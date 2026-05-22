// src/app/api/tailor-research/route.ts
import { generateText, type LanguageModelV1 } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Derive a URL slug from a company name */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(gmbh|ag|ltd|inc|co|llc|srl|bv|nv|sa)\b/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fetch a URL via Jina.ai reader and return truncated text or null */
async function jinaFetch(url: string, maxChars = 4000): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'text/plain', 'X-Return-Format': 'text' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length < 200 ? null : text.slice(0, maxChars);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    companyName: string;
    jobTitle?: string;
    homepage?: string;
  };
  const { companyName, jobTitle, homepage } = body;

  if (!companyName) {
    return Response.json({ ok: false, error: 'companyName required' }, { status: 400 });
  }

  console.log('[tailor-research] start:', companyName);
  const slug = toSlug(companyName);

  // Parallel scrape all three sources — partial results are fine
  const [kununuResult, websiteResult, linkedinResult] = await Promise.allSettled([
    jinaFetch(`https://www.kununu.com/de/${slug}`),
    jinaFetch(homepage ? `${homepage}/about` : `https://${slug}.com/about`),
    jinaFetch(`https://www.linkedin.com/company/${slug}`),
  ]);

  const kununuText = kununuResult.status === 'fulfilled' ? kununuResult.value : null;
  const websiteText = websiteResult.status === 'fulfilled' ? websiteResult.value : null;
  const linkedinText = linkedinResult.status === 'fulfilled' ? linkedinResult.value : null;

  const rawContext = [
    kununuText ? `[Kununu reviews]\n${kununuText}` : null,
    websiteText ? `[Company website]\n${websiteText}` : null,
    linkedinText ? `[LinkedIn company page]\n${linkedinText}` : null,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');

  if (!rawContext) {
    return Response.json({
      ok: false,
      error: `Couldn't research ${companyName} — try pasting their About page into the chat.`,
    });
  }

  const { model, usageEventId } = await startAIUsageRequest({
    route: 'api.tailor-research',
    userId,
    isPro: true,
  });

  try {
    const { text, usage } = await generateText({
      model: model as LanguageModelV1,
      maxTokens: 350,
      system: `You are extracting company intelligence to help a job candidate. Be concise and factual. Only use information present in the sources — never invent.`,
      prompt: `Company: ${companyName}${jobTitle ? `, role: ${jobTitle}` : ''}

Sources:
${rawContext}

Respond in JSON with exactly these three keys (no markdown, raw JSON only):
{
  "culture": "1-2 sentences on values and work environment tone",
  "employerRep": "Kununu rating if found, plus 1-2 key review quotes (positive and/or critical)",
  "hiringSignals": "What they seem to prioritise when hiring, based on the sources"
}`,
    });

    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });

    // Parse AI JSON response
    let parsed: { culture: string; employerRep: string; hiringSignals: string };
    try {
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { culture: text, employerRep: 'See above', hiringSignals: 'See above' };
    }

    return Response.json({ ok: true, ...parsed });
  } catch (err) {
    console.error('[tailor-research] error:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'research_failed',
    });
    return Response.json({ ok: false, error: 'Research failed' }, { status: 500 });
  }
}

export const maxDuration = 60;
