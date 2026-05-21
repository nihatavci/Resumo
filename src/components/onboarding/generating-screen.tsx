'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fadeIn } from '@/components/motion/variants';

const STAGES = [
  { label: 'Analyzing your experience…', detail: 'Extracting skills, achievements, and impact from your CV' },
  { label: 'Optimizing for ATS…', detail: 'Rewriting bullets with strong action verbs and quantified results' },
  { label: 'Categorizing your skills…', detail: 'Grouping skills by industry-standard categories' },
  { label: 'Building your Master CV…', detail: 'Saving the ATS-optimized version to your profile' },
];

export function GeneratingScreen() {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx((idx) => (idx + 1 < STAGES.length ? idx + 1 : idx));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stage = STAGES[stageIdx];

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <div className="text-center space-y-8 max-w-md">
        <motion.div
          className="w-16 h-16 mx-auto rounded-full spectrum-gradient"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.h2
              key={stage.label}
              className="text-dia-heading-sm font-light text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {stage.label}
            </motion.h2>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={stage.detail}
              className="text-dia-body text-dia-ash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {stage.detail}
            </motion.p>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {STAGES.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === stageIdx ? 'w-6 bg-foreground' : idx < stageIdx ? 'w-2 bg-foreground/40' : 'w-2 bg-foreground/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
