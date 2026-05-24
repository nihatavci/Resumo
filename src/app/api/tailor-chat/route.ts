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
    companyIntel?: string;
    responseLanguage?: string;
  };
  const { messages, masterResume, companyIntel, responseLanguage } = body;

  console.log('[tailor-chat] start, messages:', messages.length);

  const { model, usageEventId, resolved } = await startAIUsageRequest({
    route: 'api.tailor-chat',
    userId,
    isPro: true,
  });
  console.log('[tailor-chat] model:', resolved.modelId, '| provider:', resolved.providerId);

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

  // Inject company intel into last user message if provided (and not already there)
  if (companyIntel && lastUserIdx !== -1) {
    const existing = processedMessages[lastUserIdx];
    const content = typeof existing.content === 'string' ? existing.content : '';
    if (!content.includes('[Company intel:')) {
      processedMessages[lastUserIdx] = {
        ...existing,
        content: `[Company intel: ${companyIntel}]\n\n${content}`,
      };
    }
  }

  const languageRule = responseLanguage
    ? `LANGUAGE RULE — ABSOLUTE:
You MUST write every single word of every reply in ${responseLanguage === 'en' ? 'English' : responseLanguage === 'de' ? 'German (Deutsch)' : responseLanguage === 'fr' ? 'French (Français)' : responseLanguage === 'es' ? 'Spanish (Español)' : responseLanguage === 'it' ? 'Italian (Italiano)' : responseLanguage === 'pt' ? 'Portuguese (Português)' : responseLanguage === 'nl' ? 'Dutch (Nederlands)' : responseLanguage === 'tr' ? 'Turkish (Türkçe)' : responseLanguage}.
This applies regardless of what language the job description is written in, or what language the user types in.
Never switch languages mid-reply. Never borrow words from the job description's language. Translate any key terms if needed.`
    : `LANGUAGE RULE — ABSOLUTE:
Always respond in the same language as the MASTER CV, regardless of what language the job description is written in.
Detect the master CV language from the text below and use that language for every word you write.
Never mix languages.`;

  const systemPrompt = `You are a sharp resume strategist. You help candidates tailor their CV for a specific job.

${languageRule}

IF NO JOB HAS BEEN SHARED YET — ABSOLUTE RULE:
- If the user's message does NOT contain a job description, job title, company name, required skills list, or a URL — do NOT produce any analysis, match map, or plan.
- Reply with exactly one sentence asking for the job: "Please paste the job description or URL you'd like to tailor your CV for."
- Nothing else. No analysis. No bullet points. No suggestions.

CONVERSATION STYLE:
- Be direct and concise. No long paragraphs.
- You can ask smart follow-up questions — max 1 at a time — to sharpen the tailoring.
- After the user answers, update your plan accordingly and confirm.
- Once you have enough context, end with: "Ready? Click **Generate tailored CV** when you want to apply these changes."

WHEN A JOB IS FIRST SHARED — produce THREE parts in this exact order:

PART 1 — Structured extraction (plain text, no markdown headers, use exactly these emojis):
📋 Role: [company + role in ≤10 words]
🎯 Required: [3–6 must-have skills/keywords from the JD, comma-separated]
💼 Nice-to-have: [2–4 preferred skills, comma-separated]
🌍 Culture signals: [3–4 tone/values keywords from JD wording, comma-separated]
⚠️ Red flags: [any hard requirements the candidate may genuinely lack — omit line if none]

PART 2 — Match map (immediately after Part 1, in this exact fence):
:::match
✅ [requirement] | [evidence from candidate's CV — be specific, cite company/metric]
⚡ [requirement] | [partial match explanation]
❌ [requirement] | [honest gap — what's missing and where to address it]
:::
Rules for match map: only list requirements from Part 1. ✅ = strong evidence in CV. ⚡ = partial/implied. ❌ = genuine gap. Be honest — do not mark something ✅ if it's not in the CV.

PART 3 — Proactive suggestions (plain text, ≤4 lines, after the :::match fence):
- For 1–2 existing bullets that would land better for this role, give the specific rewrite: "At [Company], instead of '[original text]' → '[stronger phrasing]'" — only rephrase what's there, no new facts.
- For each ❌ item: one actionable sentence (cover letter, address in interview, etc.).

THEN — ATS tips if relevant (keyword gaps, missing metrics, formatting):
:::ats
[tip 1]
[tip 2]
:::

THEN — memory fence summarising the agreed plan (always emit this after any first analysis or plan update):
:::memory
[short decision label, ≤6 words]
[short decision label]
:::

THEN ask your one follow-up question if needed.

FOR FOLLOW-UP MESSAGES (after the initial analysis):
- Respond conversationally and concisely — update the plan, answer questions.
- Re-emit :::memory with the FULL updated list of decisions whenever the plan changes (not just new ones — the full current list).
- Re-emit :::ats only if new ATS tips emerge.
- Do NOT re-emit :::match unless the user asks for a fresh analysis.
- Keep responses under 6 lines unless the user asks for detail.

IMPORTANT — if you see "[URL provided: ... — scraping failed]" in the user message:
- If there is no other text: reply with exactly one line: "I couldn't fetch that page. Please paste the job description text here and I'll analyse it instantly."
- Never mention scraping, function calls, or technical errors.

HONESTY RULES — ABSOLUTE:
- Never use markdown headers (##, ###).
- ZERO FABRICATION: Never suggest adding a skill, technology, responsibility, or industry context that does not already appear in the candidate's master CV for that specific role. If the JD mentions E-Commerce but the candidate's CV has no E-Commerce experience, do NOT suggest adding E-Commerce content — instead flag it as a gap in ⚠️ Red flags.
- In the 🔧 Plan and :::memory, only promise changes grounded in actual bullet content from the master CV.
- Never mention tool calls, function calls, or scraping errors to the user.

MASTER CV (detect language from this text and use it for all replies):
${JSON.stringify(
  {
    professional_summary: masterResume.professional_summary,
    work_experience: masterResume.work_experience?.map((w) => ({
      company: w.company,
      position: w.position,
      date: w.date,
      location: w.location,
      bullets: w.description ?? [],
      technologies: w.technologies ?? [],
    })),
    skills: masterResume.skills?.map((s) => ({ category: s.category, items: s.items })),
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
