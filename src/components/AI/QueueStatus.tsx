'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface QueueStatusProps {
  isVisible: boolean;
}

export const QueueStatus = ({ isVisible }: QueueStatusProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] mt-3 shadow-xl"
    >
      <Clock size={12} className="animate-pulse" />
      <span>Neural Queue: Processing Intelligence...</span>
    </motion.div>
  );
};
