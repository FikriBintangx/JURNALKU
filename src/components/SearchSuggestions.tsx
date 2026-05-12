'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Sparkles, BookOpen, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestionItem {
  title: string;
  type: 'paper' | 'topic';
}

interface SearchSuggestionsProps {
  query: string;
  onSelect?: (val: string) => void;
}

export default function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function getSuggestions() {
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (data.data) {
          setSuggestions(data.data);
        }
      } catch (e: any) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    getSuggestions();
  }, [debouncedQuery]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className="font-medium">
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="text-primary font-black bg-primary/10 px-0.5 rounded-sm">{part}</span>
          ) : (
            <span key={i} className="opacity-80">{part}</span>
          )
        )}
      </span>
    );
  };

  if (query.length < 3) return null;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative">
              <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 animate-pulse">Analyzing Patterns...</span>
          </motion.div>
        ) : suggestions.length > 0 ? (
          <motion.div 
            key="results"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
            className="py-4 px-3"
          >
            <div className="px-5 py-3 flex items-center justify-between mb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Intellectual Suggestions</span>
              </div>
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{suggestions.length} Results</span>
            </div>

            <div className="grid gap-1">
              {suggestions.map((s, i) => (
                <motion.button 
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  onClick={() => onSelect?.(s.title)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-all rounded-2xl group text-left hover:bg-muted/50 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-inner",
                      s.type === 'topic' ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white"
                    )}>
                      {s.type === 'topic' ? <Search className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate leading-tight mb-1 transition-colors">
                        {highlightText(s.title, query)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          {s.type === 'topic' ? 'Focus Area' : 'Scientific Title'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[9px] font-black text-primary/60 uppercase">Match Found</span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 translate-x-1 text-primary" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center space-y-5"
          >
            <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto border border-border/40 group-hover:scale-110 transition-transform">
              <Search className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-foreground/40">Context not established</p>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-black">Refine query for AI synthesis</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
