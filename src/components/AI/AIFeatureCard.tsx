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

  const [displayText, setDisplayText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (data && !loading) {
      let index = 0;
      setDisplayText('');
      const interval = setInterval(() => {
        setDisplayText((prev) => data.slice(0, index + 1));
        index++;
        if (index >= data.length) clearInterval(interval);
      }, 5); // Fast typewriter for better UX
      return () => clearInterval(interval);
    }
  }, [data, loading]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data || '');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div 
      layout
      className="glass-card rounded-[2rem] p-7 flex flex-col h-full min-h-[260px] relative overflow-hidden group/aicolor shadow-lg hover:shadow-primary/5 transition-all duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Decorative Aura - Pulsing when loading */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-all duration-1000 opacity-20",
        loading ? "bg-primary animate-pulse scale-150" : "bg-primary/20"
      )} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-primary group-hover/aicolor:scale-110 group-hover/aicolor:rotate-3 transition-all duration-500 shadow-inner">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="font-black text-foreground tracking-tight text-sm leading-none mb-1">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">AI Intelligence</p>
          </div>
        </div>
        {!data && (
          <button 
            onClick={generate}
            disabled={loading}
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-2xl transition-all flex items-center gap-2.5 btn-premium",
              loading 
                ? "bg-muted text-muted-foreground cursor-not-allowed" 
                : "bg-foreground text-background hover:opacity-90 shadow-xl"
            )}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'Analyzing' : 'Process'}
          </button>
        )}
        {data && !loading && (
          <button 
            onClick={copyToClipboard}
            className="p-2.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary rounded-xl transition-all active:scale-95 border border-border/50"
            title="Copy to Clipboard"
          >
            {isCopied ? <Sparkles size={14} className="text-emerald-500" /> : <RotateCcw size={14} className="rotate-45" />}
          </button>
        )}
      </div>

      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse scale-150" />
                <Brain className="w-10 h-10 text-primary animate-bounce transition-all duration-1000" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">Consulting Gemini...</p>
                <QueueStatus isVisible={true} />
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-red-500/5 rounded-2xl flex items-center justify-center border border-red-500/10 shadow-inner">
                <AlertCircle className="text-red-500/70 w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-red-500/80 font-black uppercase tracking-widest">Neural Error</p>
                <p className="text-[11px] text-muted-foreground font-medium px-4">{error}</p>
              </div>
              <button 
                onClick={generate}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-6 py-3 bg-muted/80 text-foreground rounded-2xl border border-border/50 hover:bg-muted transition-all active:scale-95"
              >
                <RotateCcw size={12} />
                Reconnect
              </button>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-[450px] overflow-y-auto pr-2 font-medium"
            >
              <div className="p-5 bg-muted/20 rounded-[1.5rem] border border-border/30 shadow-inner">
                {displayText}
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
              </div>
            </motion.div>
          ) : (
            <motion.p 
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground leading-[1.6] font-medium px-2 py-2"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
