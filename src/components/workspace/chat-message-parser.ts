// src/components/workspace/chat-message-parser.ts

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'ats'; content: string };

/**
 * Split an assistant message into text and ATS-tip segments.
 * Handles both Unix (\n) and Windows (\r\n) line endings from the LLM.
 *
 * Regex is created inside the function so lastIndex=0 each call.
 * Unclosed :::ats blocks fall through as trailing text — acceptable fallback.
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  // Normalise CRLF → LF so the regex works regardless of LLM line ending style
  const normalised = content.replace(/\r\n/g, '\n');

  const segments: MessageSegment[] = [];
  // Match :::ats\n...\n::: or :::ats\n...\n::: with optional trailing whitespace
  const ATSFence = /:::ats\n([\s\S]*?)\n:::/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ATSFence.exec(normalised)) !== null) {
    const textBefore = normalised.slice(lastIndex, match.index).trim();
    if (textBefore) segments.push({ type: 'text', content: textBefore });

    const atsContent = match[1].trim();
    if (atsContent) segments.push({ type: 'ats', content: atsContent });

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
const ANALYSIS_PREFIXES = ['📋', '🎯', '✅', '🔧', '⚠️', '⚠'];

export type AnalysisLine = { emoji: string; label: string; value: string } | { raw: string };

/**
 * Parse the structured analysis block (📋/🎯/✅/🔧/⚠️ lines) into typed lines.
 * Lines that don't match the pattern are returned as { raw }.
 */
export function parseAnalysisLines(text: string): AnalysisLine[] {
  return text.split('\n').map((line) => {
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
  }).filter((l) => ('raw' in l ? (l.raw ?? '').length > 0 : true));
}
