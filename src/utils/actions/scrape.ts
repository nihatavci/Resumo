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
 * Fetch a public URL and extract the main text content.
 * Returns ok:false when the site blocks scraping (login walls, captchas, 403s).
 */
export async function scrapeJobUrl(url: string): Promise<ScrapeResult> {
  await getAuthenticatedUser();
  console.log('[scrapeJobUrl] fetching:', url);

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, url, error: 'Only http/https URLs are supported.' };
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, url, error: `HTTP ${res.status} — site may block scraping` };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('html') && !contentType.includes('text')) {
      return { ok: false, url, error: `Unsupported content type: ${contentType}` };
    }

    const html = await res.text();

    // LinkedIn login wall detection
    if (
      html.includes('Sign in to LinkedIn') ||
      html.includes('Join LinkedIn') ||
      (parsed.hostname.includes('linkedin.com') && html.length < 50000)
    ) {
      return {
        ok: false,
        url,
        error:
          'LinkedIn blocks public scraping. Please copy the job description text and paste it directly into the chat.',
      };
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    const text = html
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

    const truncated = text.slice(0, 8000);
    console.log('[scrapeJobUrl] success, text length:', truncated.length);
    return { ok: true, url, title, text: truncated };
  } catch (err) {
    console.error('[scrapeJobUrl] failed:', err);
    return {
      ok: false,
      url,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
