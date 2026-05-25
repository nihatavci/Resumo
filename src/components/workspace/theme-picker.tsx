'use client';

import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { RESUME_THEMES, type ResumeTheme } from '@/lib/resume-themes';
import { RESUME_FONTS, type ResumeFont } from '@/lib/resume-fonts';

interface ThemePickerProps {
  selectedThemeId: string;
  onChange: (themeId: string) => void;
  selectedFontId: string;
  onFontChange: (fontId: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export function ThemePicker({
  selectedThemeId,
  onChange,
  selectedFontId,
  onFontChange,
  onOpenChange,
}: ThemePickerProps) {
  const [open, setOpen] = useState(false);

  function toggle(value: boolean) {
    setOpen(value);
    onOpenChange?.(value);
  }

  return (
    <div className="relative">
      <button
        onClick={() => toggle(!open)}
        className={`flex items-center gap-1.5 rounded-full bg-white border text-foreground text-xs font-medium px-3 py-1.5 shadow-sm transition-all ${
          open ? 'border-foreground/30 bg-foreground/5' : 'border-dia-divider hover:bg-foreground/5'
        }`}
        title="Change CV theme & font"
      >
        <Palette className="h-3.5 w-3.5" />
        <span>Style</span>
      </button>

      {open && (
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => toggle(false)}
          />
          {/* Popover */}
          <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-2xl border border-dia-divider p-4 min-w-[340px]">
            {/* ── Theme section ── */}
            <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest mb-3 px-0.5">
              Theme
            </p>
            <div className="flex gap-3">
              {RESUME_THEMES.map(theme => (
                <ThemeThumbnail
                  key={theme.id}
                  theme={theme}
                  selected={theme.id === selectedThemeId}
                  onSelect={() => {
                    onChange(theme.id);
                    toggle(false);
                  }}
                />
              ))}
            </div>

            {/* ── Font section ── */}
            <div className="mt-4 pt-3.5 border-t border-dia-divider">
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-widest mb-2.5 px-0.5">
                Font
              </p>
              <FontPicker
                selectedFontId={selectedFontId}
                onSelect={(id) => {
                  onFontChange(id);
                  toggle(false);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Font Picker ────────────────────────────────────────────────────────────

function FontPicker({
  selectedFontId,
  onSelect,
}: {
  selectedFontId: string;
  onSelect: (id: string) => void;
}) {
  // Load Google Fonts stylesheets for preview rendering
  useEffect(() => {
    RESUME_FONTS.forEach((font) => {
      if (!font.googleFontsUrl) return;
      const id = `gfont-${font.id}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = font.googleFontsUrl;
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {RESUME_FONTS.map((font) => (
        <FontPill
          key={font.id}
          font={font}
          selected={font.id === selectedFontId}
          onSelect={() => onSelect(font.id)}
        />
      ))}
    </div>
  );
}

function FontPill({
  font,
  selected,
  onSelect,
}: {
  font: ResumeFont;
  selected: boolean;
  onSelect: () => void;
}) {
  const labelStyle = font.cssFamily
    ? { fontFamily: font.cssFamily }
    : undefined;

  return (
    <button
      onClick={onSelect}
      style={labelStyle}
      className={`text-xs px-3 py-1.5 rounded-full transition-all ${
        selected
          ? 'bg-foreground text-background shadow-sm font-medium'
          : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground border border-dia-divider'
      }`}
    >
      {font.name}
    </button>
  );
}

// ── Theme Thumbnail ────────────────────────────────────────────────────────

function ThemeThumbnail({
  theme,
  selected,
  onSelect,
}: {
  theme: ResumeTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  const bodyFont =
    theme.fontFamily === 'Times-Roman'
      ? 'Georgia, "Times New Roman", serif'
      : '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const boldFont =
    theme.fontFamilyBold === 'Times-Bold'
      ? 'Georgia, "Times New Roman", serif'
      : '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const nameIsBold = theme.nameFontFamily.includes('Bold');

  return (
    <button
      onClick={onSelect}
      title={theme.name}
      className={`flex flex-col rounded-xl overflow-hidden transition-all duration-150 hover:scale-105 hover:shadow-md ${
        selected
          ? 'ring-2 ring-foreground ring-offset-1 shadow-md'
          : 'ring-1 ring-foreground/10 shadow-sm'
      }`}
    >
      {/* Mini resume preview */}
      <div
        style={{
          width: 58,
          height: 76,
          backgroundColor: '#ffffff',
          padding: '6px 7px 4px',
          fontFamily: bodyFont,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Name bar */}
        <div
          style={{
            fontSize: 5.5,
            fontFamily: boldFont,
            fontWeight: nameIsBold ? 700 : 400,
            color: theme.nameColor,
            textAlign: theme.headerAlign,
            letterSpacing: (theme.nameLetterSpacing ?? 0.5) * 0.3,
            marginBottom: 1.5,
            paddingBottom: theme.headerDivider ? 1.5 : 0,
            borderBottom: theme.headerDivider
              ? `${theme.headerDivider.width * 0.8}px solid ${theme.headerDivider.color}`
              : 'none',
          }}
        >
          JOHN DOE
        </div>
        {/* Contact row */}
        <div
          style={{
            fontSize: 2.5,
            color: theme.mutedColor,
            textAlign: theme.headerAlign,
            marginBottom: 3,
            fontFamily: bodyFont,
          }}
        >
          Berlin • hello@email.com
        </div>

        {/* Section title 1 — EXPERIENCE */}
        <SectionTitleMini theme={theme} boldFont={boldFont} />

        {/* Fake content lines */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 1,
            marginTop: 1.5,
          }}
        >
          <div
            style={{
              height: 1.5,
              width: '58%',
              backgroundColor: theme.mutedColor,
              opacity: 0.35,
              borderRadius: 1,
            }}
          />
          <div
            style={{
              height: 1.5,
              width: '22%',
              backgroundColor: theme.mutedColor,
              opacity: 0.25,
              borderRadius: 1,
            }}
          />
        </div>
        {[88, 72, 95, 65].map((w, i) => (
          <div
            key={i}
            style={{
              height: 1.5,
              width: `${w}%`,
              backgroundColor: theme.bodyColor,
              opacity: 0.15,
              borderRadius: 1,
              marginBottom: 1,
            }}
          />
        ))}

        {/* Section title 2 — SKILLS */}
        <div style={{ marginTop: 3 }}>
          <SectionTitleMini theme={theme} boldFont={boldFont} label="SKILLS" />
        </div>
        {[80, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 1.5,
              width: `${w}%`,
              backgroundColor: theme.bodyColor,
              opacity: 0.15,
              borderRadius: 1,
              marginBottom: 1,
              marginTop: 1.5,
            }}
          />
        ))}
      </div>

      {/* Theme name label */}
      <div
        className="text-[9px] font-medium text-center py-1.5 px-1 leading-none"
        style={{
          backgroundColor: selected ? '#f5f5f5' : '#fafafa',
          color: selected ? '#111' : '#666',
          fontWeight: selected ? 600 : 400,
        }}
      >
        {theme.name}
      </div>
    </button>
  );
}

function SectionTitleMini({
  theme,
  boldFont,
  label = 'EXPERIENCE',
}: {
  theme: ResumeTheme;
  boldFont: string;
  label?: string;
}) {
  return (
    <div
      style={{
        fontSize: 3.5,
        fontFamily: boldFont,
        fontWeight: 700,
        color: theme.sectionTitleColor,
        backgroundColor: theme.sectionTitleBg ?? 'transparent',
        letterSpacing: (theme.sectionTitleLetterSpacing ?? 0) * 0.3,
        paddingLeft: theme.sectionAccentLeft
          ? theme.sectionAccentLeft.paddingLeft * 0.25
          : (theme.sectionTitlePaddingH ?? 0) * 0.25,
        paddingRight: (theme.sectionTitlePaddingH ?? 0) * 0.25,
        paddingTop: (theme.sectionTitlePaddingV ?? 0) * 0.5,
        paddingBottom: theme.sectionDivider
          ? 1
          : (theme.sectionTitlePaddingV ?? 0) * 0.5,
        borderBottom: theme.sectionDivider
          ? `${theme.sectionDivider.width * 0.8}px solid ${theme.sectionDivider.color}`
          : 'none',
        borderLeft: theme.sectionAccentLeft
          ? `${theme.sectionAccentLeft.width * 0.8}px solid ${theme.sectionAccentLeft.color}`
          : 'none',
      }}
    >
      {label}
    </div>
  );
}
