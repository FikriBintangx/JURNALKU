'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Sparkles, Loader2, BookOpen, ArrowUpRight } from 'lucide-react';
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
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (val: string) => {
    const newHistory = [val, ...history.filter(h => h !== val)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

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
        console.error('Suggestion Fetch Error:', e.message);
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
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="text-foreground font-black underline decoration-2 underline-offset-4">{part}</span>
          ) : (
            <span key={i} className="opacity-50">{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {debouncedQuery.length < 3 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 px-4"
          >
            {history.length > 0 ? (
              <div className="space-y-6">
                <div className="px-6 flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Recent Intel History</span>
                  <button onClick={clearHistory} className="text-[9px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-all hover:text-red-500">Purge Cache</button>
                </div>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        saveToHistory(h);
                        onSelect?.(h);
                      }}
                      className="w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] hover:bg-foreground/5 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all shrink-0">
                        <Search className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                      </div>
                      <span className="text-base font-bold text-foreground/70 group-hover:text-foreground transition-colors truncate">{h}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 bg-foreground/5 rounded-full flex items-center justify-center mx-auto border border-foreground/5">
                  <Sparkles className="w-6 h-6 text-foreground/20" />
                </div>
                <p className="label-caps !opacity-20">Neural Cache Empty</p>
              </div>
            )}
          </motion.div>
        ) : loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-foreground opacity-10" />
              <Sparkles className="w-5 h-5 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="label-caps !opacity-40 animate-pulse">Neural Mapping...</span>
          </motion.div>
        ) : suggestions.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4 px-2"
          >
            <div className="px-6 py-4 flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground rounded-xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">AI Neural Signals</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{suggestions.length} Vectors</span>
            </div>

            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    saveToHistory(s.title);
                    onSelect?.(s.title);
                  }}
                  className="w-full flex items-center justify-between px-6 py-5 transition-all rounded-[1.75rem] group text-left hover:bg-foreground/5 hover:translate-x-1"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-[1.25rem] bg-foreground/5 border border-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-foreground group-hover:text-background transition-all">
                      {s.type === 'topic' ? <Search className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[15px] font-bold truncate tracking-tight mb-0.5 text-foreground/80 group-hover:text-foreground">
                        {highlightText(s.title, query)}
                      </span>
                      <span className="text-[9px] opacity-30 uppercase font-black tracking-[0.2em] group-hover:opacity-50">
                        {s.type === 'topic' ? 'Topical Cluster' : 'Research Document'}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-16 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto border border-border/50">
              <Search className="w-6 h-6 opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-black opacity-40">No Signal Detected</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-30 leading-relaxed">Expand your query for deeper intelligence mapping</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
