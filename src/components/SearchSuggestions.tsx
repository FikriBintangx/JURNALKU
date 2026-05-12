'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Sparkles, Loader2, BookOpen, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <span key={i} className="text-primary font-bold">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  if (query.length < 3) return null;

  return (
    <div className="w-full">
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center space-y-4 text-slate-400 animate-in fade-in duration-500">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
            <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Menganalisis Kebutuhan Riset...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-3 px-2">
          <div className="px-4 py-2 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI Smart Suggest</span>
            </div>
            <span className="text-[9px] font-medium opacity-40 uppercase tracking-tighter">{suggestions.length} Hasil Relevan</span>
          </div>

          <div className="grid gap-1">
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => onSelect?.(s.title)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 transition-all rounded-2xl group text-left",
                  "hover:bg-primary/10 hover:translate-x-1",
                  "text-inherit"
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0",
                    s.type === 'topic' ? "bg-indigo-500/10 text-indigo-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {s.type === 'topic' ? <Search className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate leading-none mb-1">
                      {highlightText(s.title, query)}
                    </span>
                    <span className="text-[10px] opacity-50 uppercase font-black tracking-tighter">
                      {s.type === 'topic' ? 'Topik Terkait' : 'Judul Literatur'}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-all -translate-y-1 translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold opacity-80">Tidak menemukan saran spesifik</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Coba gunakan kata kunci yang lebih umum</p>
          </div>
        </div>
      )}
    </div>
  );
}
