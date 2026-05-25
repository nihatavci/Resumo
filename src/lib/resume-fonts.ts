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

// ── Font URLs (self-hosted in /public/fonts, served via Cloudflare CDN) ────

const INTER_400_URL = '/fonts/inter-400.woff2';
const INTER_700_URL = '/fonts/inter-700.woff2';

const LATO_400_URL = '/fonts/lato-400.woff2';
const LATO_700_URL = '/fonts/lato-700.woff2';

const SOURCE_SANS_400_URL = '/fonts/source-sans-400.woff2';
const SOURCE_SANS_700_URL = '/fonts/source-sans-700.woff2';

const GARAMOND_400_URL = '/fonts/garamond-400.woff2';
const GARAMOND_700_URL = '/fonts/garamond-700.woff2';

const PLAYFAIR_400_URL = '/fonts/playfair-400.woff2';
const PLAYFAIR_700_URL = '/fonts/playfair-700.woff2';

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
  Font.register({ family: 'Inter', src: INTER_400_URL });
  Font.register({ family: 'Inter-Bold', src: INTER_700_URL });

  // Lato
  Font.register({ family: 'Lato', src: LATO_400_URL });
  Font.register({ family: 'Lato-Bold', src: LATO_700_URL });

  // Source Sans 3
  Font.register({ family: 'SourceSans3', src: SOURCE_SANS_400_URL });
  Font.register({ family: 'SourceSans3-Bold', src: SOURCE_SANS_700_URL });

  // EB Garamond
  Font.register({ family: 'EBGaramond', src: GARAMOND_400_URL });
  Font.register({ family: 'EBGaramond-Bold', src: GARAMOND_700_URL });

  // Playfair Display
  Font.register({ family: 'PlayfairDisplay', src: PLAYFAIR_400_URL });
  Font.register({ family: 'PlayfairDisplay-Bold', src: PLAYFAIR_700_URL });
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
