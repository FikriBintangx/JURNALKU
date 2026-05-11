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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mt-2"
    >
      <Clock size={12} className="animate-pulse" />
      <span>Antrian: AI sedang melayani permintaan lain...</span>
    </motion.div>
  );
};
