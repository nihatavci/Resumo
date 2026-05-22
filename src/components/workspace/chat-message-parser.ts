// src/components/workspace/chat-message-parser.ts

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'ats'; content: string }
  | { type: 'memory'; points: string[] }
  | { type: 'match'; content: string };

/**
 * Split an assistant message into typed segments.
 * Handles :::ats, :::memory, :::match fence blocks.
 * Handles both Unix (\n) and Windows (\r\n) line endings.
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  const normalised = content.replace(/\r\n/g, '\n');
  const segments: MessageSegment[] = [];

  // Match any :::TYPE\n...\n::: fence block
  const AnyFence = /:::(ats|memory|match)\n([\s\S]*?)\n:::/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = AnyFence.exec(normalised)) !== null) {
    const textBefore = normalised.slice(lastIndex, match.index).trim();
    if (textBefore) segments.push({ type: 'text', content: textBefore });

    const fenceType = match[1] as 'ats' | 'memory' | 'match';
    const fenceContent = match[2].trim();

    if (fenceType === 'ats' && fenceContent) {
      segments.push({ type: 'ats', content: fenceContent });
    } else if (fenceType === 'memory' && fenceContent) {
      const points = fenceContent
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (points.length) segments.push({ type: 'memory', points });
    } else if (fenceType === 'match' && fenceContent) {
      segments.push({ type: 'match', content: fenceContent });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = normalised.slice(lastIndex).trim();
  if (tail) segments.push({ type: 'text', content: tail });

  if (segments.length === 0 && normalised.trim()) {
    segments.push({ type: 'text', content: normalised.trim() });
  }

  return segments;
}

/** Emoji prefixes used in the structured analysis lines */
const ANALYSIS_PREFIXES = ['📋', '🎯', '💼', '🌍', '✅', '🔧', '⚠️', '⚠'];

export type AnalysisLine = { emoji: string; label: string; value: string } | { raw: string };

/**
 * Parse the structured analysis block into typed lines.
 * Lines that don't match the pattern are returned as { raw }.
 */
export function parseAnalysisLines(text: string): AnalysisLine[] {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      for (const emoji of ANALYSIS_PREFIXES) {
        if (trimmed.startsWith(emoji)) {
          const rest = trimmed.slice(emoji.length).trim();
          const colonIdx = rest.indexOf(':');
          if (colonIdx !== -1) {
            return {
              emoji,
              label: rest.slice(0, colonIdx).trim(),
              value: rest.slice(colonIdx + 1).trim(),
            };
          }
        }
      }
      return { raw: trimmed };
    })
    .filter((l) => ('raw' in l ? (l.raw ?? '').length > 0 : true));
}

export type MatchLine = {
  marker: '✅' | '⚡' | '❌';
  requirement: string;
  explanation: string;
};

/**
 * Parse the content of a :::match fence into typed match lines.
 * Lines that don't start with ✅/⚡/❌ are skipped.
 */
export function parseMatchLines(content: string): MatchLine[] {
  const results: MatchLine[] = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const marker = line.startsWith('✅') ? '✅' : line.startsWith('⚡') ? '⚡' : line.startsWith('❌') ? '❌' : null;
    if (!marker) continue;
    const rest = line.slice(marker.length).trim();
    const pipeIdx = rest.indexOf('|');
    if (pipeIdx === -1) continue;
    results.push({
      marker,
      requirement: rest.slice(0, pipeIdx).trim(),
      explanation: rest.slice(pipeIdx + 1).trim(),
    });
  }
  return results;
}

/**
 * Merge incoming memory points into an existing list, deduplicating
 * by normalised (lowercased + trimmed) label.
 */
export function extractMemoryPoints(existing: string[], incoming: string[]): string[] {
  const normalised = new Set(existing.map((p) => p.toLowerCase().trim()));
  const merged = [...existing];
  for (const point of incoming) {
    if (!normalised.has(point.toLowerCase().trim())) {
      merged.push(point);
      normalised.add(point.toLowerCase().trim());
    }
  }
  return merged;
}
