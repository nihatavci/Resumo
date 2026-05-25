// src/lib/resume-fonts.ts
// Curated font options for resume PDFs.
// Fonts are registered once via Font.register() from @react-pdf/renderer.

import { Font } from '@react-pdf/renderer';

export interface ResumeFont {
  id: string;
  name: string;
  category: 'sans' | 'serif';
  /** react-pdf family name for regular weight */
  pdfFamily: string;
  /** react-pdf family name for bold weight */
  pdfFamilyBold: string;
  /** CSS font-family for browser thumbnail previews */
  cssFamily: string;
  /** Google Fonts stylesheet URL to preload for browser preview */
  googleFontsUrl?: string;
}

// ── Font CDN URLs (Latin subset, gstatic.com) ──────────────────────────────

// Inter — variable font, same file serves all weights
const INTER_URL =
  'https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2';

// Lato — separate static files per weight
const LATO_400_URL =
  'https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHjx4wXiWtFCc.woff2';
const LATO_700_URL =
  'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2';

// Source Sans 3 — variable font
const SOURCE_SANS_URL =
  'https://fonts.gstatic.com/s/sourcesans3/v19/nwpStKy2OAdR1K-IwhWudF-R3w8aZejf5Hc.woff2';

// EB Garamond — classic serif, variable font
const GARAMOND_URL =
  'https://fonts.gstatic.com/s/ebgaramond/v32/SlGUmQSNjdsmc35JDF1K5GR1SDk_YAPI.woff2';

// Playfair Display — stylish editorial serif, variable font
const PLAYFAIR_URL =
  'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgEM86xQ.woff2';

// ── Registration ───────────────────────────────────────────────────────────

let fontsRegistered = false;

/**
 * Register all custom fonts with react-pdf's Font singleton.
 * Safe to call multiple times — registers only once.
 * Must be called before any PDF document is rendered.
 */
export function registerResumeFonts() {
  if (fontsRegistered || typeof window === 'undefined') return;
  fontsRegistered = true;

  // Inter
  Font.register({ family: 'Inter', src: INTER_URL, fontWeight: 400 });
  Font.register({ family: 'Inter-Bold', src: INTER_URL, fontWeight: 700 });

  // Lato (separate files per weight)
  Font.register({ family: 'Lato', src: LATO_400_URL });
  Font.register({ family: 'Lato-Bold', src: LATO_700_URL });

  // Source Sans 3
  Font.register({ family: 'SourceSans3', src: SOURCE_SANS_URL, fontWeight: 400 });
  Font.register({ family: 'SourceSans3-Bold', src: SOURCE_SANS_URL, fontWeight: 700 });

  // EB Garamond
  Font.register({ family: 'EBGaramond', src: GARAMOND_URL, fontWeight: 400 });
  Font.register({ family: 'EBGaramond-Bold', src: GARAMOND_URL, fontWeight: 700 });

  // Playfair Display
  Font.register({ family: 'PlayfairDisplay', src: PLAYFAIR_URL, fontWeight: 400 });
  Font.register({ family: 'PlayfairDisplay-Bold', src: PLAYFAIR_URL, fontWeight: 700 });
}

// ── Font catalogue ─────────────────────────────────────────────────────────

export const RESUME_FONTS: ResumeFont[] = [
  {
    id: 'default',
    name: 'Default',
    category: 'sans',
    pdfFamily: '',
    pdfFamilyBold: '',
    cssFamily: '',
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans',
    pdfFamily: 'Inter',
    pdfFamilyBold: 'Inter-Bold',
    cssFamily: 'Inter, sans-serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
  },
  {
    id: 'lato',
    name: 'Lato',
    category: 'sans',
    pdfFamily: 'Lato',
    pdfFamilyBold: 'Lato-Bold',
    cssFamily: 'Lato, sans-serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
  },
  {
    id: 'source-sans',
    name: 'Source Sans',
    category: 'sans',
    pdfFamily: 'SourceSans3',
    pdfFamilyBold: 'SourceSans3-Bold',
    cssFamily: '"Source Sans 3", sans-serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap',
  },
  {
    id: 'garamond',
    name: 'Garamond',
    category: 'serif',
    pdfFamily: 'EBGaramond',
    pdfFamilyBold: 'EBGaramond-Bold',
    cssFamily: '"EB Garamond", Georgia, serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap',
  },
  {
    id: 'playfair',
    name: 'Playfair',
    category: 'serif',
    pdfFamily: 'PlayfairDisplay',
    pdfFamilyBold: 'PlayfairDisplay-Bold',
    cssFamily: '"Playfair Display", Georgia, serif',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
  },
];

export function getFontById(id: string): ResumeFont | undefined {
  return RESUME_FONTS.find((f) => f.id === id);
}
