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
                <div className="px-4 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Recent Identifiers</span>
                  <button onClick={clearHistory} className="text-[9px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">Clear All</button>
                </div>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        saveToHistory(h);
                        onSelect?.(h);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all group"
                    >
                      <Search className="w-3.5 h-3.5 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <span className="text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">{h}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20">Neural Cache Empty</p>
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Neural Mapping...</span>
          </motion.div>
        ) : suggestions.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4 px-2"
          >
            <div className="px-6 py-4 flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-foreground rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-background" />
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">AI Suggested Vector</span>
              </div>
              <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">{suggestions.length} Signals</span>
            </div>

            <div className="space-y-1">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    saveToHistory(s.title);
                    onSelect?.(s.title);
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 transition-all rounded-2xl group text-left hover:bg-muted"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-foreground group-hover:text-background transition-all">
                      {s.type === 'topic' ? <Search className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-bold truncate tracking-tight mb-1">
                        {highlightText(s.title, query)}
                      </span>
                      <span className="text-[9px] opacity-30 uppercase font-black tracking-[0.2em]">
                        {s.type === 'topic' ? 'Domain Focus' : 'Document Match'}
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
