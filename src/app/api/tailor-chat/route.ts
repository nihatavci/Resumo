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

  const systemPrompt = `You are a sharp resume strategist. You help candidates tailor their CV for a specific job.

CONVERSATION STYLE:
- Be direct and concise. No long paragraphs.
- You can ask smart follow-up questions — max 1 at a time — to sharpen the tailoring. e.g. "Want me to lean into your B2B experience or your technical background?" or "Is this a senior IC or a management role?"
- After the user answers, update your plan accordingly and confirm.
- Once you have enough context, end with: "Ready? Click **Generate tailored CV** when you want to apply these changes."

WHEN A JOB IS FIRST SHARED — use this structure (plain text, no markdown headers):

📋 Analysed: [company + role in ≤10 words]
🎯 Key requirements: [3–5 keywords from the JD, comma-separated]
✅ You have: [matching experience from the master CV, 1–2 lines]
🔧 Plan: [concrete changes — reorder bullets, emphasise X, rename Y — 1–3 lines]
⚠️ Watch out: [one genuine risk or gap — omit if none]

Then, if you have ATS-specific advice (keyword gaps, missing metrics, formatting), add it in this fence — one tip per line, max 4 tips:

:::ats
[tip 1]
[tip 2]
:::

Then ask your one follow-up question if you need to sharpen the plan.

FOR FOLLOW-UP MESSAGES (after the initial analysis):
- Respond conversationally and concisely — update the plan, answer questions, incorporate what the user tells you.
- Re-emit the :::ats block only if new ATS tips emerge.
- Keep responses under 6 lines unless the user asks for detail.

Rules:
- Never use markdown headers (##, ###).
- Never invent experience the candidate doesn't have.
- If the user provides a URL, call scrape_job_url first, then respond in the format above.
- If scrape_job_url fails AND the user has also pasted job description text in the same message, IGNORE the scraping error and analyse the pasted text directly — do not mention the failure.
- If scrape_job_url fails AND there is no pasted text, say in one line: "I couldn't fetch that URL. Paste the job description text here and I'll analyse it." Then stop.
- Never say the scraping "was not successful" — just ask for the text and move on.

MASTER CV (for context — do not repeat this to the user):
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
