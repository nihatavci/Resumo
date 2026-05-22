// src/components/workspace/tailored-diff-view.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Resume } from '@/lib/types';
import type { ProposedChanges } from './types';
import { Sparkles } from 'lucide-react';

interface TailoredDiffViewProps {
  masterResume: Resume;
  pendingChanges: ProposedChanges;
}

/** Returns true if two bullet strings differ (trims whitespace) */
function bulletChanged(original: string, updated: string): boolean {
  return original.trim() !== updated.trim();
}

/** Tooltip that appears above the hovered element, clamped to viewport */
function OriginalTooltip({
  text,
  visible,
  anchorRef,
}: {
  text: string;
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !anchorRef.current || !tooltipRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = anchor.top + scrollY - tip.height - 8;
    let left = anchor.left + scrollX + anchor.width / 2 - tip.width / 2;

    // Clamp to viewport
    if (left < 8) left = 8;
    if (left + tip.width > window.innerWidth - 8) left = window.innerWidth - 8 - tip.width;
    if (top < 8 + scrollY) top = anchor.bottom + scrollY + 8; // flip to below

    setPos({ top, left });
  }, [visible, anchorRef]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 max-w-sm px-3 py-2 text-xs leading-relaxed rounded-xl bg-foreground text-background shadow-xl pointer-events-none"
      style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 mb-1">
        Original
      </p>
      {text}
    </div>
  );
}

/** A single bullet with optional diff highlight + hover tooltip */
function DiffBullet({
  text,
  original,
  changed,
}: {
  text: string;
  original?: string;
  changed: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  return (
    <>
      <li
        ref={ref}
        onMouseEnter={() => changed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative pl-3 leading-snug text-[11px] transition-colors ${
          changed
            ? 'text-foreground cursor-default'
            : 'text-foreground/70'
        }`}
      >
        {/* Bullet dot */}
        <span
          className={`absolute left-0 top-[0.45em] h-1 w-1 rounded-full ${
            changed ? 'bg-amber-500' : 'bg-foreground/30'
          }`}
        />

        {/* Highlight pill for changed bullets */}
        {changed ? (
          <span className="inline rounded bg-amber-50 border border-amber-200/80 px-1 py-0.5 -mx-1">
            {text}
            <span className="ml-1.5 inline-flex items-center align-middle">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
            </span>
          </span>
        ) : (
          text
        )}
      </li>
      {changed && original && (
        <OriginalTooltip
          text={original}
          visible={hovered}
          anchorRef={ref as React.RefObject<HTMLElement | null>}
        />
      )}
    </>
  );
}

export function TailoredDiffView({ masterResume, pendingChanges }: TailoredDiffViewProps) {
  const masterExp = masterResume.work_experience ?? [];
  const pendingExp = pendingChanges.work_experience ?? [];

  // Summary changed line count
  const summaryChanged =
    pendingChanges.professional_summary &&
    pendingChanges.professional_summary !== masterResume.professional_summary;

  let totalChanged = summaryChanged ? 1 : 0;
  pendingExp.forEach((pw, i) => {
    const mw = masterExp[i];
    if (!mw) return;
    pw.description?.forEach((b, j) => {
      if (mw.description?.[j] === undefined || bulletChanged(mw.description[j], b)) totalChanged++;
    });
  });

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-5 bg-dia-canvas text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
          Tailored CV — change preview
        </h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">
          {totalChanged} {totalChanged === 1 ? 'change' : 'changes'}
        </span>
      </div>

      {/* Summary */}
      {(pendingChanges.professional_summary || masterResume.professional_summary) && (
        <section className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            Summary
          </p>
          {summaryChanged ? (
            <div className="relative group">
              <p className="text-xs leading-relaxed rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-foreground">
                {pendingChanges.professional_summary}
                <Sparkles className="inline ml-1.5 h-3 w-3 text-amber-400 align-middle" />
              </p>
              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute left-0 -top-1 -translate-y-full z-50 w-full max-w-md">
                <div className="rounded-xl bg-foreground text-background text-xs px-3 py-2 shadow-xl leading-relaxed">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50 mb-1">
                    Original
                  </p>
                  {masterResume.professional_summary}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-foreground/60 px-1">
              {masterResume.professional_summary}
            </p>
          )}
        </section>
      )}

      {/* Work experience diff */}
      {pendingExp.map((pw, i) => {
        const mw = masterExp[i];
        const bulletDiffs = (pw.description ?? []).map((b, j) => ({
          text: b,
          original: mw?.description?.[j],
          changed: !mw?.description?.[j] || bulletChanged(mw.description[j], b),
        }));
        const hasChanges = bulletDiffs.some((d) => d.changed);

        return (
          <section key={i} className={`rounded-2xl border p-4 space-y-2.5 transition-colors ${
            hasChanges ? 'border-amber-200 bg-white' : 'border-dia-divider bg-white/60'
          }`}>
            {/* Role header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-xs leading-tight">
                  {pw.position}
                </p>
                <p className="text-[11px] text-foreground/50 mt-0.5">
                  {pw.company}{pw.location ? ` · ${pw.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasChanges && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold uppercase tracking-wide">
                    edited
                  </span>
                )}
                <span className="text-[10px] text-foreground/40">{pw.date}</span>
              </div>
            </div>

            {/* Bullets */}
            <ul className="space-y-1.5 list-none">
              {bulletDiffs.map((d, j) => (
                <DiffBullet
                  key={j}
                  text={d.text}
                  original={d.original}
                  changed={d.changed}
                />
              ))}
            </ul>

            {/* Technologies */}
            {pw.technologies && pw.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {pw.technologies.map((t, j) => (
                  <span
                    key={j}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/50 border border-foreground/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Rationale */}
      {pendingChanges.rationale && (
        <section className="rounded-2xl border border-dia-divider bg-white/60 px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
            AI rationale
          </p>
          <p className="text-xs leading-relaxed text-foreground/60">
            {pendingChanges.rationale}
          </p>
        </section>
      )}

      <div className="h-8" />
    </div>
  );
}
