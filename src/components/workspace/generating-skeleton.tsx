// src/components/workspace/generating-skeleton.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Resume } from '@/lib/types';

interface GeneratingSkeletonProps {
  masterResume: Resume;
  progress: number; // 0–100
}

/**
 * Gemini-style shimmer skeleton displayed in the PDF preview panel while
 * a tailored CV is being generated. Lines appear sequentially (sentence by
 * sentence) with a staggered delay and a continuous shimmer sweep.
 */
export function GeneratingSkeleton({ masterResume, progress }: GeneratingSkeletonProps) {
  // Reveal lines progressively based on progress
  const [revealedLines, setRevealedLines] = useState(0);

  // Build the skeleton line descriptors from master resume structure
  const lines = buildLines(masterResume);
  const total = lines.length;

  useEffect(() => {
    // Map progress (0-100) to revealed lines count
    const target = Math.round((progress / 100) * total);
    if (target > revealedLines) {
      setRevealedLines(target);
    }
  }, [progress, total]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also drive a timed reveal independently (fills in regardless of progress signal)
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setRevealedLines((prev) => Math.max(prev, Math.min(idx, total)));
      if (idx >= total) clearInterval(interval);
    }, 90);
    return () => clearInterval(interval);
  }, [total]);

  return (
    <div className="h-full overflow-y-auto bg-[#f5f5f5]">
      {/* A4-ish paper */}
      <div className="mx-auto my-8 bg-white rounded shadow-md" style={{ width: '650px', minHeight: '900px', padding: '52px 56px' }}>

        {/* ── Header block: name + contact ── */}
        <div className="mb-6">
          <SkLine width="55%" height={22} delay={0} visible={revealedLines > 0} />
          <div className="mt-2 flex gap-4">
            <SkLine width="22%" height={10} delay={1} visible={revealedLines > 1} />
            <SkLine width="18%" height={10} delay={2} visible={revealedLines > 2} />
            <SkLine width="16%" height={10} delay={3} visible={revealedLines > 3} />
          </div>
        </div>

        <Divider />

        {/* ── Professional summary ── */}
        {masterResume.professional_summary && (
          <Section startLine={4} revealedLines={revealedLines}>
            <SkLine width="98%" height={10} delay={5} visible={revealedLines > 5} />
            <SkLine width="92%" height={10} delay={6} visible={revealedLines > 6} />
            <SkLine width="75%" height={10} delay={7} visible={revealedLines > 7} />
          </Section>
        )}

        {/* ── Work experience ── */}
        <Section startLine={8} revealedLines={revealedLines}>
          {(masterResume.work_experience ?? []).map((job, ji) => {
            const base = 9 + ji * 8;
            return (
              <div key={ji} className="mb-5">
                <div className="flex justify-between items-baseline mb-1">
                  <SkLine width="38%" height={12} delay={base} visible={revealedLines > base} />
                  <SkLine width="20%" height={10} delay={base} visible={revealedLines > base} />
                </div>
                <SkLine width="25%" height={10} delay={base + 1} visible={revealedLines > base + 1} />
                <div className="mt-2 pl-3 space-y-1.5">
                  {(job.description ?? []).slice(0, 4).map((_, bi) => (
                    <div key={bi} className="flex gap-2 items-center">
                      {/* bullet dot */}
                      <div
                        className="flex-shrink-0 rounded-full bg-gray-200"
                        style={{
                          width: 5,
                          height: 5,
                          opacity: revealedLines > base + 2 + bi ? 1 : 0,
                          transition: `opacity 0.3s ease ${(base + 2 + bi) * 0.09}s`,
                        }}
                      />
                      <SkLine
                        width={bi % 2 === 0 ? '88%' : '72%'}
                        height={9}
                        delay={base + 2 + bi}
                        visible={revealedLines > base + 2 + bi}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>

        {/* ── Skills ── */}
        <Section startLine={total - 6} revealedLines={revealedLines}>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkLine
                key={i}
                width={`${50 + (i % 4) * 20}px`}
                height={24}
                delay={total - 5 + i}
                visible={revealedLines > total - 5 + i}
                rounded="full"
              />
            ))}
          </div>
        </Section>

        {/* ── Progress bar at bottom ── */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/20 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] text-foreground/30 tabular-nums font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */

function Section({
  children,
  startLine,
  revealedLines,
}: {
  children: React.ReactNode;
  startLine: number;
  revealedLines: number;
}) {
  return (
    <div className="mb-6">
      {/* section heading */}
      <div
        className="mb-2"
        style={{
          opacity: revealedLines > startLine ? 1 : 0,
          transform: revealedLines > startLine ? 'translateY(0)' : 'translateY(6px)',
          transition: `opacity 0.3s ease ${startLine * 0.09}s, transform 0.3s ease ${startLine * 0.09}s`,
        }}
      >
        <SkLine width="18%" height={11} delay={startLine} visible={revealedLines > startLine} />
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-100 mb-5" />;
}

function SkLine({
  width,
  height,
  delay,
  visible,
  rounded = 'md',
}: {
  width: string | number;
  height: number;
  delay: number;
  visible: boolean;
  rounded?: 'md' | 'full';
}) {
  return (
    <div
      className={`skeleton-line ${rounded === 'full' ? 'rounded-full' : 'rounded'}`}
      style={{
        width,
        height,
        marginBottom: 4,
        opacity: visible ? 1 : 0,
        animationDelay: `${delay * 0.09}s, ${delay * 0.09}s`,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.28s ease ${delay * 0.09}s, transform 0.28s ease ${delay * 0.09}s`,
        // Override skeleton-line-in animation to only fire when visible
        animationPlayState: visible ? 'running' : 'paused',
      }}
    />
  );
}

/** Count total visible lines to calibrate progress → line reveal */
function buildLines(resume: Resume): string[] {
  const lines: string[] = ['name', 'contact1', 'contact2', 'contact3'];
  if (resume.professional_summary) {
    lines.push('sum-head', 'sum1', 'sum2', 'sum3');
  }
  lines.push('exp-head');
  for (const job of resume.work_experience ?? []) {
    lines.push('job-title', 'job-company');
    for (let i = 0; i < Math.min((job.description ?? []).length, 4); i++) {
      lines.push(`bullet-${i}`);
    }
  }
  lines.push('skills-head');
  for (let i = 0; i < 10; i++) lines.push(`skill-${i}`);
  return lines;
}
