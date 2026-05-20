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
 * Extract text from PDF preserving layout using item positioning.
 * PDF text items carry [scaleX, skewY, skewX, scaleY, X, Y] in `transform`.
 * We use the Y coordinate to detect line breaks — without this, multi-column
 * resumes get jumbled and even the candidate's name becomes unparseable.
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Collect items with positioning
    type PosItem = { str: string; x: number; y: number };
    const items: PosItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const tx = item.transform as number[];
      items.push({ str: item.str, x: tx[4], y: tx[5] });
    }

    if (items.length === 0) continue;

    // Sort: rows top-to-bottom (Y descending in PDF coords), within row left-to-right
    items.sort((a, b) => {
      const dy = Math.abs(a.y - b.y);
      if (dy > 3) return b.y - a.y;
      return a.x - b.x;
    });

    // Group into lines by Y proximity
    let text = '';
    let lastY: number | null = null;
    let lastX = 0;
    for (const item of items) {
      if (lastY !== null && Math.abs(item.y - lastY) > 3) {
        text += '\n';
        lastX = 0;
      } else if (text && !text.endsWith(' ') && item.x - lastX > 2) {
        text += ' ';
      }
      text += item.str;
      lastY = item.y;
      lastX = item.x + item.str.length * 4; // rough char width estimate
    }

    pages.push(text);
  }

  return pages.join('\n\n').trim();
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
