// src/components/onboarding/cv-upload.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeIn, slideUp } from '@/components/motion/variants';

interface CVUploadProps {
  onComplete: (cvText: string) => void;
  onSkip: () => void;
  isExtracting?: boolean;
}

// Lazy-load pdfjs-dist to avoid SSR issues
/**
 * Robust PDF text extraction.
 * - disableFontFace + useSystemFonts: avoid embedded-font glyph remapping that
 *   converts "AVCI" → "Avc1" when a CV uses a font where the capital-I glyph
 *   is encoded as digit-1.
 * - Column detection: 2-column resumes (sidebar + main) need to be read column
 *   by column, not line by line, or text gets jumbled.
 * - Y-coordinate line grouping preserves visual line breaks.
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    disableFontFace: true,
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent({ includeMarkedContent: false });

    type PosItem = { str: string; x: number; y: number; w: number };
    const items: PosItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const tx = item.transform as number[];
      items.push({
        str: item.str,
        x: tx[4],
        y: tx[5],
        w: 'width' in item ? (item.width as number) : 0,
      });
    }
    if (items.length === 0) continue;

    // Detect 2-column layout: significant clustering both left and right of midpoint
    const mid = viewport.width * 0.5;
    const leftItems = items.filter((it) => it.x < mid * 0.9);
    const rightItems = items.filter((it) => it.x > mid * 1.1);
    const isTwoColumn =
      leftItems.length > items.length * 0.2 &&
      rightItems.length > items.length * 0.2;

    const renderColumn = (cols: PosItem[]): string => {
      const sorted = [...cols].sort((a, b) => {
        const dy = Math.abs(a.y - b.y);
        if (dy > 3) return b.y - a.y; // PDF Y is bottom-up
        return a.x - b.x;
      });
      let out = '';
      let lastY: number | null = null;
      let lastEnd = 0;
      for (const it of sorted) {
        if (lastY !== null && Math.abs(it.y - lastY) > 3) {
          out += '\n';
          lastEnd = 0;
        } else if (out && !out.endsWith(' ') && !out.endsWith('\n') && it.x - lastEnd > 2) {
          out += ' ';
        }
        out += it.str;
        lastY = it.y;
        lastEnd = it.x + it.w;
      }
      return out;
    };

    if (isTwoColumn) {
      // Most CVs put contact/skills in narrow left column, work history in wide right column.
      // Detect which is wider to decide order.
      const leftAvgX = leftItems.reduce((s, it) => s + it.x, 0) / leftItems.length;
      const rightAvgX = rightItems.reduce((s, it) => s + it.x, 0) / rightItems.length;
      // Process narrower column first if it's the sidebar (left), else main first
      const leftText = renderColumn(items.filter((it) => it.x < mid));
      const rightText = renderColumn(items.filter((it) => it.x >= mid));
      pages.push(leftAvgX < rightAvgX ? `${leftText}\n\n${rightText}` : `${rightText}\n\n${leftText}`);
    } else {
      pages.push(renderColumn(items));
    }
  }

  return pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function CVUpload({ onComplete, onSkip, isExtracting }: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preload pdfjs on mount so first upload is faster
  useEffect(() => {
    import('pdfjs-dist').catch(() => {});
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      if (!text.trim()) {
        setError(
          'Could not extract text from this PDF. It may be image-based (scanned). Try a different file or skip.'
        );
        setIsProcessing(false);
        return;
      }
      onComplete(text);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Failed to read this PDF. Please try a different file or skip.');
      setIsProcessing(false);
    }
  }, [onComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  }, [processFile]);

  const busy = isProcessing || isExtracting;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className="text-center space-y-6 max-w-md w-full"
        variants={slideUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-dia-heading font-light text-foreground tracking-[-2px]">
          Welcome to Resumo
        </h1>
        <p className="text-dia-subheading text-dia-ash">
          Upload your CV and {"we'll"} pre-fill everything for you.
        </p>

        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'mt-8 border-2 border-dashed rounded-dia p-12 flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer group',
            isDragging
              ? 'border-foreground bg-dia-fog scale-[1.02]'
              : 'border-dia-steel hover:border-foreground hover:bg-dia-fog/50',
            busy && 'pointer-events-none opacity-60'
          )}
        >
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileInput}
            disabled={busy}
          />

          {busy ? (
            <>
              <Loader2 className="w-12 h-12 text-foreground animate-spin" />
              <p className="text-dia-body text-foreground font-medium">
                {isExtracting ? 'Analysing CV with AI…' : `Reading ${fileName}…`}
              </p>
              {isExtracting && (
                <p className="text-dia-body-sm text-dia-ash">
                  Extracting your experience, skills and education
                </p>
              )}
            </>
          ) : fileName ? (
            <>
              <FileText className="w-12 h-12 text-foreground" />
              <p className="text-dia-body text-foreground font-medium">{fileName}</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-dia-steel group-hover:text-foreground group-hover:scale-110 transition-all duration-200" />
              <div className="text-center">
                <p className="text-dia-body text-foreground font-medium">
                  Drop your PDF resume here
                </p>
                <p className="text-dia-body-sm text-dia-ash">or click to browse files</p>
              </div>
            </>
          )}
        </label>

        {error && (
          <motion.p
            className="text-sm text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={onSkip}
          className="text-dia-body-sm text-dia-ash hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          {"Skip — I'll"} enter everything manually
        </button>
      </motion.div>
    </motion.div>
  );
}
