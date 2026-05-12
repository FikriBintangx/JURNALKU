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
      className="glass-card rounded-[2rem] p-6 flex flex-col h-full min-h-[240px] relative overflow-hidden group/aicolor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-primary group-hover/aicolor:scale-110 transition-transform">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-foreground tracking-tight text-sm">{title}</h3>
        </div>
        {!data && (
          <button 
            onClick={generate}
            disabled={loading}
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-full transition-all flex items-center gap-2",
              loading 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "bg-foreground text-background hover:opacity-90 active:scale-95 shadow-md"
            )}
          >
            {loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
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
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="relative mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="absolute inset-0 w-8 h-8 bg-primary/10 rounded-full blur-xl animate-pulse" />
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] animate-pulse">Processing Intel...</p>
              <QueueStatus isVisible={true} />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center border border-red-500/10">
                <AlertCircle className="text-red-500/70 w-5 h-5" />
              </div>
              <p className="text-[11px] text-red-500/60 font-bold leading-tight">{error}</p>
              <button 
                onClick={generate}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-5 py-2.5 bg-muted/50 text-foreground rounded-xl border border-border/50 hover:bg-muted transition-all"
              >
                <RotateCcw size={10} />
                Try Again
              </button>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-2 custom-scrollbar font-medium"
            >
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/30">
                {data}
              </div>
            </motion.div>
          ) : (
            <motion.p 
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground leading-relaxed font-medium px-1"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
