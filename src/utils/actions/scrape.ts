// src/utils/actions/scrape.ts
'use server';

import { getAuthenticatedUser } from '@/utils/auth';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScrapeResult {
  ok: boolean;
  url: string;
  text?: string;
  title?: string;
  error?: string;
}

/**
 * Strip HTML tags and extract clean text.
 */
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/**
 * Strategy 1: Jina.ai Reader — converts any public URL to clean markdown.
 * Works on most Cloudflare-protected sites, paywalls, SPAs.
 */
async function fetchViaJina(url: string): Promise<ScrapeResult> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  console.log('[scrapeJobUrl] trying Jina reader:', jinaUrl);

  const res = await fetch(jinaUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/plain,text/markdown,*/*',
      'X-Return-Format': 'text',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Jina HTTP ${res.status}`);
  }

  const text = (await res.text()).trim();
  if (text.length < 200) {
    throw new Error('Jina returned too little content');
  }

  // Extract title from first markdown heading if present
  const titleMatch = text.match(/^#\s+(.+)/m);
  const title = titleMatch?.[1]?.trim();

  return { ok: true, url, title, text: text.slice(0, 8000) };
}

/**
 * Strategy 2: Direct fetch — works for open job boards that don't block.
 */
async function fetchDirect(url: string, hostname: string): Promise<ScrapeResult> {
  console.log('[scrapeJobUrl] trying direct fetch:', url);

  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Referer: 'https://www.google.com/',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('html') && !contentType.includes('text')) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const html = await res.text();

  // LinkedIn login wall detection
  if (
    html.includes('Sign in to LinkedIn') ||
    html.includes('Join LinkedIn') ||
    (hostname.includes('linkedin.com') && html.length < 50000)
  ) {
    throw new Error('linkedin-wall');
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim();
  const text = extractText(html);

  if (text.length < 200) {
    throw new Error('Too little content extracted from page');
  }

  return { ok: true, url, title, text: text.slice(0, 8000) };
}

/**
 * Fetch a public URL and extract the main text content.
 *
 * Tries two strategies in order:
 *   1. Jina.ai Reader (handles Cloudflare, SPAs, most protected sites)
 *   2. Direct fetch (fast, works for open boards)
 *
 * Returns ok:false with a helpful error when both fail.
 */
export async function scrapeJobUrl(url: string): Promise<ScrapeResult> {
  await getAuthenticatedUser();
  console.log('[scrapeJobUrl] start:', url);

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, url, error: 'Only http/https URLs are supported.' };
    }
  } catch {
    return { ok: false, url, error: 'Invalid URL.' };
  }

  const hostname = parsed.hostname;

  // LinkedIn always needs a special message
  if (hostname.includes('linkedin.com')) {
    return {
      ok: false,
      url,
      error:
        'LinkedIn blocks all scrapers. Open the job post, select all text, and paste it here — I\'ll analyse it directly.',
    };
  }

  // Try Jina first (most robust), then direct fetch as fallback
  const strategies = [
    () => fetchViaJina(url),
    () => fetchDirect(url, hostname),
  ];

  let lastError = 'Could not fetch the page.';
  for (const strategy of strategies) {
    try {
      const result = await strategy();
      console.log('[scrapeJobUrl] success, chars:', result.text?.length);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[scrapeJobUrl] strategy failed:', msg);
      lastError = msg;
    }
  }

  // Both failed — give actionable guidance
  return {
    ok: false,
    url,
    error: `Could not fetch this page (${lastError}). Please copy the job description text and paste it here — I'll analyse it directly.`,
  };
}
