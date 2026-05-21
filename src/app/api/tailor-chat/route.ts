// src/app/api/tailor-chat/route.ts
import { streamText, convertToCoreMessages, type Message } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import { scrapeJobUrl } from '@/utils/actions/scrape';
import type { Resume } from '@/lib/types';

/**
 * Streaming chat for the tailoring conversation.
 *
 * Scraping is done SERVER-SIDE before the AI sees anything.
 * The AI never makes tool calls — it just gets clean text.
 * This eliminates all "tool call failed" errors from the AI.
 */

const URL_REGEX = /https?:\/\/[^\s"'<>()]+/gi;

/**
 * Extract the first URL from a message string.
 */
function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match?.[0] ?? null;
}

/**
 * Pre-process the latest user message:
 * - If it contains a URL, scrape it server-side and inject the result
 * - Returns the enriched message content string
 */
async function enrichUserMessage(content: string): Promise<string> {
  const url = extractUrl(content);
  if (!url) return content; // No URL — return as-is

  console.log('[tailor-chat] pre-scraping URL:', url);
  const result = await scrapeJobUrl(url);

  if (result.ok && result.text) {
    // Replace the URL in the message with the scraped content
    const withoutUrl = content.replace(url, '').trim();
    const prefix = withoutUrl ? `${withoutUrl}\n\n` : '';
    return `${prefix}[Job posting fetched from ${url}${result.title ? ` — ${result.title}` : ''}]\n\n${result.text}`;
  }

  // Scrape failed — remove the URL and tell the AI scraping failed
  const withoutUrl = content.replace(url, '').trim();
  if (withoutUrl.length > 100) {
    // User also pasted text — just use that, ignore URL failure silently
    return withoutUrl;
  }

  // No useful text — instruct AI to ask for paste
  return `[URL provided: ${url} — scraping failed, site blocked]\n${withoutUrl}`;
}

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

  // Pre-process the latest user message to handle URLs server-side
  const processedMessages = [...messages];
  const lastUserIdx = [...processedMessages].map(m => m.role).lastIndexOf('user');
  if (lastUserIdx !== -1) {
    const lastUser = processedMessages[lastUserIdx];
    const rawContent = typeof lastUser.content === 'string' ? lastUser.content : '';
    if (rawContent && extractUrl(rawContent)) {
      const enriched = await enrichUserMessage(rawContent);
      processedMessages[lastUserIdx] = { ...lastUser, content: enriched };
    }
  }

  const systemPrompt = `You are a sharp resume strategist. You help candidates tailor their CV for a specific job.

CONVERSATION STYLE:
- Be direct and concise. No long paragraphs.
- You can ask smart follow-up questions — max 1 at a time — to sharpen the tailoring.
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
- Respond conversationally and concisely — update the plan, answer questions.
- Re-emit the :::ats block only if new ATS tips emerge.
- Keep responses under 6 lines unless the user asks for detail.

IMPORTANT — if you see "[URL provided: ... — scraping failed]" in the user message:
- If there is no other text: reply with exactly one line: "I couldn't fetch that page. Please paste the job description text here and I'll analyse it instantly."
- Never mention scraping, function calls, or technical errors.

Rules:
- Never use markdown headers (##, ###).
- Never invent experience the candidate doesn't have.
- Never mention tool calls, function calls, or scraping errors to the user.

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
        ...convertToCoreMessages(processedMessages),
      ],
      // No tools — scraping is handled server-side before the AI sees the message
      maxSteps: 1,
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
