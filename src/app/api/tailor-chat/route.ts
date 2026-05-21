// src/app/api/tailor-chat/route.ts
import { streamText, tool, convertToCoreMessages, type Message } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { scrapeJobUrl } from '@/utils/actions/scrape';
import type { Resume } from '@/lib/types';

/**
 * Streaming chat for the tailoring conversation.
 *
 * Architecture: this endpoint runs free-form chat (no structured tool calls).
 * Workers AI's tool-calling support over Vercel AI SDK is inconsistent, so
 * we keep the chat conversational. When the user clicks "Generate tailored
 * CV" the client calls a SEPARATE endpoint that uses generateObject (proven
 * reliable) to produce the structured changes.
 *
 * The only tool we provide is `scrape_job_url` because that's a deterministic
 * action — if the model decides to call it, fine; if not, the user can just
 * paste the JD text.
 */

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    messages: Message[];
    masterResume: Resume;
  };
  const { messages, masterResume } = body;

  console.log('[tailor-chat] start, messages:', messages.length);

  const { model, usageEventId } = await startAIUsageRequest({
    route: 'api.tailor-chat',
    userId,
    isPro: true,
  });

  const systemPrompt = `You are a professional resume tailoring assistant. The user wants to adapt their Master CV to a specific job opening.

Your job in this chat:
1. If the user provides a URL, call scrape_job_url to fetch it.
2. Read the job description carefully and understand what the role demands.
3. Discuss the role with the user. Ask one or two clarifying questions ONLY if essential (e.g. "Want me to emphasize your B2B SaaS experience or your performance marketing work?"). Most users want fast results — don't over-ask.
4. Once you understand the role and the user's preferences, tell them concisely what you would change — which roles to emphasize, which skills to push up, what the new summary should say. Be specific.
5. Then say: "Click **Generate tailored CV** to apply these changes" — the user will click a button to produce the final structured tailored resume.

Be conversational and concise. Plain language. Bullet points OK.

Constraints (you must respect these in your suggestions):
- NEVER invent facts the candidate doesn't have.
- NEVER drop work experience entries.
- Only rewrite bullets, reorder skills, optionally rephrase the summary.
- The candidate may not be a software engineer — they could be in marketing, sales, design, etc.

MASTER CV (for context):
${JSON.stringify(
  {
    professional_summary: masterResume.professional_summary,
    work_experience: masterResume.work_experience?.map((w) => ({
      company: w.company,
      position: w.position,
      date: w.date,
      bullet_count: w.description?.length ?? 0,
    })),
    skills: masterResume.skills?.map((s) => s.category),
    education: masterResume.education?.map((e) => `${e.degree} ${e.field ?? ''} at ${e.school}`),
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
            'Fetch a public job posting from a URL and return its text. Use whenever the user provides a URL.',
          parameters: z.object({
            url: z.string().describe('The URL of the job posting'),
          }),
          execute: async ({ url }) => {
            return await scrapeJobUrl(url);
          },
        }),
      },
      maxSteps: 3,
      onFinish: async ({ usage, finishReason }) => {
        console.log('[tailor-chat] finished, reason:', finishReason);
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
    return new Response(err instanceof Error ? err.message : 'Streaming error', { status: 500 });
  }
}
