// src/lib/resume-themes.ts

export interface ResumeTheme {
  id: string;
  name: string;

  // Colors
  nameColor: string;
  sectionTitleColor: string;
  sectionTitleBg?: string;       // Stone: white text on dark bar
  sectionTitlePaddingH?: number; // horizontal padding when bg is set
  sectionTitlePaddingV?: number; // vertical padding when bg is set
  bodyColor: string;
  mutedColor: string;            // contact info, dates, location
  linkColor: string;

  // Dividers
  headerDivider: { color: string; width: number } | null;
  sectionDivider: { color: string; width: number } | null;

  // Left accent bar (Sharp theme)
  sectionAccentLeft?: { color: string; width: number; paddingLeft: number };

  // Typography — use react-pdf built-in font names
  fontFamily: string;       // body text
  fontFamilyBold: string;   // bold text
  nameFontFamily: string;   // CV name (can differ, e.g. Minimal uses Helvetica not Bold)
  nameLetterSpacing?: number;
  sectionTitleLetterSpacing?: number;
  sectionTitleTextTransform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none';

  // Layout
  headerAlign: 'center' | 'left';

  // Bullet character rendered in experience/project lists
  bulletChar: string;
}

// ── Theme Definitions ──────────────────────────────────────────────────────

export const RESUME_THEMES: ResumeTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    nameColor: '#111827',
    sectionTitleColor: '#111827',
    bodyColor: '#111827',
    mutedColor: '#4b5563',
    linkColor: '#2563eb',
    headerDivider: { color: '#d1d5db', width: 0.5 },
    sectionDivider: { color: '#e5e7eb', width: 0.5 },
    fontFamily: 'Helvetica',
    fontFamilyBold: 'Helvetica-Bold',
    nameFontFamily: 'Helvetica-Bold',
    nameLetterSpacing: 0.5,
    sectionTitleTextTransform: 'uppercase',
    headerAlign: 'center',
    bulletChar: '•',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    nameColor: '#0a0a0a',
    sectionTitleColor: '#0a0a0a',
    bodyColor: '#0a0a0a',
    mutedColor: '#5c5c5c',
    linkColor: '#0a0a0a',
    headerDivider: null,
    sectionDivider: { color: '#0a0a0a', width: 1 },
    fontFamily: 'Helvetica',
    fontFamilyBold: 'Helvetica-Bold',
    nameFontFamily: 'Helvetica',
    nameLetterSpacing: 0.3,
    sectionTitleTextTransform: 'uppercase',
    sectionTitleLetterSpacing: 1,
    headerAlign: 'left',
    bulletChar: '–',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    nameColor: '#1e3a5f',
    sectionTitleColor: '#1e3a5f',
    bodyColor: '#1c1c1c',
    mutedColor: '#4a5568',
    linkColor: '#1e3a5f',
    headerDivider: { color: '#bfdbfe', width: 1 },
    sectionDivider: null,
    sectionAccentLeft: { color: '#1e3a5f', width: 2, paddingLeft: 6 },
    fontFamily: 'Helvetica',
    fontFamilyBold: 'Helvetica-Bold',
    nameFontFamily: 'Helvetica-Bold',
    sectionTitleTextTransform: 'uppercase',
    headerAlign: 'left',
    bulletChar: '▸',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    nameColor: '#1a1a1a',
    sectionTitleColor: '#1a1a1a',
    bodyColor: '#2d2d2d',
    mutedColor: '#6b6b6b',
    linkColor: '#2d2d2d',
    headerDivider: { color: '#b8b8b8', width: 0.5 },
    sectionDivider: { color: '#b8b8b8', width: 0.5 },
    fontFamily: 'Times-Roman',
    fontFamilyBold: 'Times-Bold',
    nameFontFamily: 'Times-Bold',
    nameLetterSpacing: 2,
    sectionTitleLetterSpacing: 1.5,
    sectionTitleTextTransform: 'uppercase',
    headerAlign: 'center',
    bulletChar: '·',
  },
  {
    id: 'stone',
    name: 'Stone',
    nameColor: '#292524',
    sectionTitleColor: '#ffffff',
    sectionTitleBg: '#292524',
    sectionTitlePaddingH: 4,
    sectionTitlePaddingV: 2,
    bodyColor: '#292524',
    mutedColor: '#78716c',
    linkColor: '#292524',
    headerDivider: { color: '#d6d3d1', width: 0.5 },
    sectionDivider: null,
    fontFamily: 'Helvetica',
    fontFamilyBold: 'Helvetica-Bold',
    nameFontFamily: 'Helvetica-Bold',
    nameLetterSpacing: 0.5,
    sectionTitleTextTransform: 'uppercase',
    headerAlign: 'center',
    bulletChar: '•',
  },
];

export const CLASSIC_THEME = RESUME_THEMES[0];

export function getThemeById(id: string): ResumeTheme {
  return RESUME_THEMES.find(t => t.id === id) ?? CLASSIC_THEME;
}
