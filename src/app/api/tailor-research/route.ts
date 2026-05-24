// src/app/api/tailor-research/route.ts
import { generateText, type LanguageModelV1 } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Fetch a URL via Jina reader, return text or null */
async function jinaFetch(url: string, maxChars = 5000): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/plain',
        'X-Return-Format': 'text',
        'X-Timeout': '15',
      },
      signal: AbortSignal.timeout(18_000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length < 100 ? null : text.slice(0, maxChars);
  } catch {
    return null;
  }
}

/** Search via Jina search API — works for any company, no slug guessing */
async function jinaSearch(query: string, maxChars = 5000): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://s.jina.ai/?q=${encoded}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/plain',
        'X-Return-Format': 'text',
        'X-Timeout': '20',
      },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length < 100 ? null : text.slice(0, maxChars);
  } catch {
    return null;
  }
}

/** Derive a URL slug from a company name */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(gmbh|ag|ltd|inc|co|llc|srl|bv|nv|sa)\b/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    companyName: string;
    jobTitle?: string;
    homepage?: string;
    aboutPageText?: string;
  };
  const { companyName, jobTitle, homepage, aboutPageText } = body;

  if (!companyName) {
    return Response.json({ ok: false, error: 'companyName required' }, { status: 400 });
  }

  console.log('[tailor-research] start:', companyName, aboutPageText ? '(with pasted text)' : '');

  let rawContext: string;

  if (aboutPageText && aboutPageText.trim().length > 50) {
    // User pasted the About page text directly — use it as the sole context
    rawContext = `[Company About page — pasted by user]\n${aboutPageText.trim().slice(0, 6000)}`;
    console.log('[tailor-research] using pasted text, length:', aboutPageText.length);
  } else {
    const slug = toSlug(companyName);

    // Strategy: run all sources in parallel — Jina search is the reliable fallback
    const [searchResult, kununuResult, websiteResult] = await Promise.allSettled([
      // Primary: Jina web search — works for any company
      jinaSearch(`${companyName} company employer culture review glassdoor kununu`),
      // Secondary: Kununu direct (DACH companies)
      jinaFetch(`https://www.kununu.com/de/${slug}`),
      // Secondary: Company website (try homepage first, then guess)
      homepage
        ? jinaFetch(`${homepage}/about`)
        : jinaFetch(`https://${slug}.com/about`),
    ]);

    const searchText = searchResult.status === 'fulfilled' ? searchResult.value : null;
    const kununuText = kununuResult.status === 'fulfilled' ? kununuResult.value : null;
    const websiteText = websiteResult.status === 'fulfilled' ? websiteResult.value : null;

    console.log('[tailor-research] sources:', {
      search: Boolean(searchText),
      kununu: Boolean(kununuText),
      website: Boolean(websiteText),
    });

    rawContext = [
      searchText ? `[Web search results]\n${searchText}` : null,
      kununuText ? `[Kununu reviews]\n${kununuText}` : null,
      websiteText ? `[Company website]\n${websiteText}` : null,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!rawContext) {
      return Response.json({
        ok: false,
        error: `Couldn't find public information about ${companyName}. Paste their About page text below.`,
      });
    }
  }

  const { model, usageEventId } = await startAIUsageRequest({
    route: 'api.tailor-research',
    userId,
    isPro: true,
  });

  try {
    const { text, usage } = await generateText({
      model: model as LanguageModelV1,
      maxTokens: 400,
      system: `You are extracting company intelligence to help a job candidate prepare. Be concise and factual. Only use information from the sources — never invent.`,
      prompt: `Company: ${companyName}${jobTitle ? `, role: ${jobTitle}` : ''}

Sources:
${rawContext}

Respond with raw JSON only (no markdown, no code fences):
{
  "culture": "1-2 sentences on work environment, values, and team culture",
  "employerRep": "Employer reputation — Kununu/Glassdoor rating if found, plus 1-2 key review quotes",
  "hiringSignals": "What this company seems to prioritise when hiring"
}`,
    });

    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });

    let parsed: { culture: string; employerRep: string; hiringSignals: string };
    try {
      const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, surface the raw text in culture field
      parsed = {
        culture: text.slice(0, 300),
        employerRep: 'Could not extract separately',
        hiringSignals: 'Could not extract separately',
      };
    }

    return Response.json({ ok: true, ...parsed });
  } catch (err) {
    console.error('[tailor-research] AI error:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'research_failed',
    });
    return Response.json({ ok: false, error: 'Research failed — AI error' }, { status: 500 });
  }
}

export const maxDuration = 60;
