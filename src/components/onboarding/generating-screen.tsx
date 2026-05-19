'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/components/motion/variants';

export function GeneratingScreen() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <div className="text-center space-y-8">
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
          <h2 className="text-dia-heading-sm font-light text-foreground">
            Building your profile...
          </h2>
          <motion.p
            className="text-dia-body text-dia-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Creating your Memory and generating your Master CV.
          </motion.p>
          <motion.p
            className="text-dia-body-sm text-dia-steel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            This usually takes 10-15 seconds...
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
