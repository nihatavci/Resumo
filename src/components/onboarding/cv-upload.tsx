// src/components/onboarding/cv-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2 } from 'lucide-react';
import pdfToText from 'react-pdftotext';
import { cn } from '@/lib/utils';
import { fadeIn, slideUp } from '@/components/motion/variants';

interface CVUploadProps {
  onComplete: (cvText: string) => void;
  onSkip: () => void;
  isExtracting?: boolean;
}

export function CVUpload({ onComplete, onSkip, isExtracting }: CVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setError(null);

    try {
      const text = await pdfToText(file);
      if (!text.trim()) {
        setError('Could not extract text from this PDF. It may be image-based. Try a different file or skip this step.');
        setIsProcessing(false);
        return;
      }
      onComplete(text);
    } catch {
      setError('Failed to read this PDF. Please try a different file or skip this step.');
      setIsProcessing(false);
    }
  }, [onComplete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
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
          Upload your CV and we&apos;ll build your career profile together.
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
            (isProcessing || isExtracting) && 'pointer-events-none opacity-60'
          )}
        >
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileInput}
            disabled={isProcessing || isExtracting}
          />

          {isProcessing || isExtracting ? (
            <>
              <Loader2 className="w-12 h-12 text-foreground animate-spin" />
              <p className="text-dia-body text-foreground font-medium">
                {isExtracting ? 'Analyzing your CV with AI...' : `Reading ${fileName}...`}
              </p>
              {isExtracting && (
                <p className="text-dia-body-sm text-dia-ash">
                  Extracting your experience, skills, and education
                </p>
              )}
            </>
          ) : fileName ? (
            <>
              <FileText className="w-12 h-12 text-foreground" />
              <p className="text-dia-body text-foreground font-medium">
                {fileName}
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-dia-steel group-hover:text-foreground group-hover:scale-110 transition-all duration-200" />
              <div className="text-center">
                <p className="text-dia-body text-foreground font-medium">
                  Drop your PDF resume here
                </p>
                <p className="text-dia-body-sm text-dia-ash">
                  or click to browse files
                </p>
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
          Skip — I&apos;ll enter everything manually
        </button>
      </motion.div>
    </motion.div>
  );
}
