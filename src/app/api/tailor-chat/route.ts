// src/app/api/tailor-chat/route.ts
import { streamText, tool, convertToCoreMessages, type Message } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { scrapeJobUrl } from '@/utils/actions/scrape';
import type { Resume } from '@/lib/types';

const proposeChangesSchema = z.object({
  professional_summary: z
    .string()
    .optional()
    .describe('Optional rewritten summary paragraph tailored for the target role.'),
  work_experience: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        date: z.string(),
        location: z.string().optional(),
        description: z.array(z.string()),
        technologies: z.array(z.string()).optional(),
      })
    )
    .describe(
      'Must contain the SAME number of entries as the master CV. Bullets rewritten and reordered for relevance to the target job. Never drop or invent jobs.'
    ),
  skills: z
    .array(z.object({ category: z.string(), items: z.array(z.string()) }))
    .describe('Skills reordered and regrouped for the target job. Never invent skills.'),
  rationale: z
    .string()
    .describe('One-paragraph plain-English explanation of what changed and why.'),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    messages: Message[];
    masterResume: Resume;
  };
  const { messages, masterResume } = body;

  const { model, usageEventId } = await startAIUsageRequest({
    route: 'api.tailor-chat',
    userId,
    isPro: true,
  });

  const systemPrompt = `You are a professional resume tailoring assistant. You help the user adapt their Master CV to a specific job opening.

You have these tools:
- scrape_job_url(url): fetch a job posting from a URL. Use this when the user provides a URL.
- propose_changes(...): once you have enough context (job description + user's preferences), call this with the proposed tailored version. The user will then review the changes in a live preview.

The user's MASTER CV is provided below as JSON. NEVER invent facts. NEVER drop work experience entries. Only rewrite bullets and reorder/regroup skills.

When you have enough context:
1. Call propose_changes with the full tailored work_experience (same number of entries as master, in the same chronological order), tailored skills, and an optional rephrased professional_summary.
2. Include a 'rationale' field explaining what you changed and why.

If the user provides a LinkedIn URL, scraping might fail. If so, politely ask them to paste the job description text directly.

Be conversational but efficient. Most users want fast results — only ask a clarifying question if it materially affects the output. Once you have a job description, propose changes immediately.

MASTER CV:
${JSON.stringify(
  {
    professional_summary: masterResume.professional_summary,
    work_experience: masterResume.work_experience,
    skills: masterResume.skills,
    education: masterResume.education,
  },
  null,
  2
)}`;

  try {
    const result = streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...convertToCoreMessages(messages),
      ],
      tools: {
        scrape_job_url: tool({
          description:
            'Fetch a public job posting from a URL and return the text. Use whenever the user provides a URL.',
          parameters: z.object({
            url: z.string().describe('The URL of the job posting'),
          }),
          execute: async ({ url }) => {
            return await scrapeJobUrl(url);
          },
        }),
        propose_changes: tool({
          description:
            'Propose the final tailored version of the resume. The user will see the changes in a live preview and decide whether to apply.',
          parameters: proposeChangesSchema,
          execute: async (changes) => {
            return { proposed: true, ...changes };
          },
        }),
      },
      maxSteps: 5,
      onFinish: async ({ usage }) => {
        await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('[tailor-chat] error:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'stream_failed',
    });
    return new Response('Streaming error', { status: 500 });
  }
}
