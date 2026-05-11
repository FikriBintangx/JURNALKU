'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Sparkles, Loader2 } from 'lucide-react';

interface SearchSuggestionsProps {
  query: string;
  onSelect?: (val: string) => void;
}

export default function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

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
          // Limit to 5 unique suggestions
          const uniqueTitles = Array.from(new Set(data.data.map((p: any) => p.title))).slice(0, 5) as string[];
          setSuggestions(uniqueTitles);
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

  if (query.length < 3) return null;

  return (
    <div className="w-full">
      {loading ? (
        <div className="p-6 flex items-center justify-center space-x-3 text-slate-400 text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Mencari saran riset terbaik...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-2 px-2">
          <div className="px-4 py-2 flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Saran AI</span>
          </div>
          {suggestions.map((s, i) => (
            <button 
              key={i}
              onClick={() => onSelect?.(s)}
              className="w-full flex items-center px-4 py-3 bg-black text-white dark:bg-white dark:text-black hover:bg-primary/20 transition-all rounded-2xl group text-left"
            >
              <Search className="w-4 h-4 mr-3 opacity-50 group-hover:text-primary" />
              <span className="text-sm font-medium line-clamp-1">{s}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
