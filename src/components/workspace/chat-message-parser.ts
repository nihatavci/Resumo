// src/components/workspace/chat-message-parser.ts

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'ats'; content: string };

/**
 * Split an assistant message into text and ATS-tip segments.
 *
 * Example input:
 *   "📋 Analysed: ...\n\n:::ats\nAdd "TypeScript" keyword\n:::\n\nReady? Click..."
 *
 * Output:
 *   [
 *     { type: 'text', content: '📋 Analysed: ...' },
 *     { type: 'ats',  content: 'Add "TypeScript" keyword' },
 *     { type: 'text', content: 'Ready? Click...' },
 *   ]
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  // Match :::ats\n...\n::: blocks (multiline, non-greedy)
  const ATSFence = /:::ats\n([\s\S]*?)\n:::/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ATSFence.exec(content)) !== null) {
    // Text before this block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      segments.push({ type: 'text', content: textBefore });
    }

    // The ATS block content (the captured group between the fences)
    const atsContent = match[1].trim();
    if (atsContent) {
      segments.push({ type: 'ats', content: atsContent });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last block
  const tail = content.slice(lastIndex).trim();
  if (tail) {
    segments.push({ type: 'text', content: tail });
  }

  // If no blocks found at all, return the whole content as one text segment
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content: content.trim() });
  }

  return segments;
}
