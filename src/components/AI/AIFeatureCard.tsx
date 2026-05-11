'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useAIFeature } from '@/hooks/useAIFeature';
import { QueueStatus } from './QueueStatus';
import { cn } from '@/lib/utils';

interface AIFeatureCardProps {
  title: string;
  icon: React.ElementType;
  endpoint: string;
  paperId: string;
  abstract: string;
  paperTitle: string;
  description: string;
}

export const AIFeatureCard = ({
  title,
  icon: Icon,
  endpoint,
  paperId,
  abstract,
  paperTitle,
  description
}: AIFeatureCardProps) => {
  const { data, loading, error, generate } = useAIFeature({
    endpoint,
    paperId,
    abstract,
    title: paperTitle
  });

  return (
    <motion.div 
      layout
      className="glass-card rounded-2xl p-6 flex flex-col h-full min-h-[220px] relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-card-foreground tracking-tight">{title}</h3>
        </div>
        {!data && (
          <button 
            onClick={generate}
            disabled={loading}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10",
              loading 
                ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 border border-indigo-400/50"
            )}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'Analyzing' : 'Generate'}
          </button>
        )}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-xs text-muted-foreground font-medium animate-pulse">AI sedang menganalisis jurnal...</p>
              <QueueStatus isVisible={true} />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 text-center space-y-4"
            >
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertCircle className="text-red-500 w-6 h-6" />
              </div>
              <p className="text-xs text-red-400 font-bold tracking-tight">{error}</p>
              <button 
                onClick={generate}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <RotateCcw size={12} />
                Coba Lagi
              </button>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-card-foreground/80 leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-2 custom-scrollbar font-medium"
            >
              {data}
            </motion.div>
          ) : (
            <motion.p 
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground leading-relaxed font-medium"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
