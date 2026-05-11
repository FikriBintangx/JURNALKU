'use client';

import { motion } from 'framer-motion';

interface RelevanceScoreProps {
  score: number;
}

export const RelevanceScore = ({ score }: RelevanceScoreProps) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-indigo-400';
    return 'text-amber-400';
  };

  const getBgColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (s >= 60) return 'bg-indigo-500/10 border-indigo-500/20';
    return 'bg-amber-500/10 border-amber-500/20';
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${getBgColor(score)}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className={`text-[10px] font-black uppercase tracking-widest ${getColor(score)}`}>
        {score}% Semantic Relevance
      </span>
    </motion.div>
  );
};
