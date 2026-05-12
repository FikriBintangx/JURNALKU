'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import { cn } from '@/lib/utils';
import JournalCard from '@/components/JournalCard';
import Navbar from '@/components/Navbar';
import { Search, Filter, BookX, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalCardSkeleton } from '@/components/Skeleton';
import FilterSidebar from '@/components/FilterSidebar';
import { SearchFilters, SortBy, SearchResponse } from '@/types/search';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const recommend = searchParams.get('recommend');
  const [results, setResults] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const provider = (searchParams.get('provider') as 'default' | 'googlescholar') || 'default';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    yearStart: 1900,
    yearEnd: new Date().getFullYear(),
    openAccess: false,
    hasPdf: false,
    minCitations: 0,
    sortBy: 'relevance'
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !recommend) {
        setOffset(prev => prev + 12);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, recommend]);

  // Reset when query or recommend or provider changes
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    setError(null);
  }, [query, recommend, provider]);

  useEffect(() => {
    async function fetchResults() {
      if (!query && !recommend) return;
      if (offset > 0) setLoadingMore(true);
      
      try {
        let data;
        if (recommend && offset === 0) {
          const recommended = await journalService.getRecommendations(recommend);
          data = { data: recommended, total: recommended.length, offset: 0, error: false };
          setHasMore(false);
        } else {
          data = await journalService.search(query, 12, offset, provider, filters.sortBy || 'relevance');
          if (data.error) throw new Error(data.message || 'Gagal mengambil data');
        }
        
        if (offset === 0) {
          setResults(data.data);
          setLoading(false);
        } else {
          setResults(prev => [...prev, ...data.data]);
          setLoadingMore(false);
        }
        
        setTotal(data.total);
        if (data.data.length < 12) setHasMore(false);
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError(err.message || 'Terjadi kesalahan saat mengambil data.');
        setLoading(false);
        setLoadingMore(false);
      }
    }
    fetchResults();
  }, [query, offset, recommend, provider]);

  // Client-side filtering and sorting
  const filteredResults = results
    .filter(j => {
      if (filters.openAccess && !j.isOpenAccess) return false;
      if (filters.hasPdf && !j.openAccessPdf?.url) return false;
      if (j.year && (j.year < (filters.yearStart || 1900) || j.year > (filters.yearEnd || new Date().getFullYear()))) return false;
      if ((filters.minCitations || 0) > 0 && (j.citations || 0) < (filters.minCitations || 0)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'year') return (b.year || 0) - (a.year || 0);
      if (filters.sortBy === 'citations') return (b.citations || 0) - (a.citations || 0);
      return 0; // Default order
    });

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Info Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground flex flex-wrap items-center gap-4 tracking-tighter uppercase">
              <Search className="w-8 h-8 text-foreground" />
              {recommend ? (
                <>Jurnal Serupa</>
              ) : (
                <>Hasil untuk "<span className="opacity-40">{query}</span>"</>
              )}
            </h1>
            <p className="text-muted-foreground text-xs mt-3 font-black uppercase tracking-[0.2em]">
              {recommend ? 'Neural Recommendation Engine' : `Signals Detected: ${total.toLocaleString()}`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
            {/* Provider Toggle - Monochrome */}
            <div className="bg-muted p-1.5 rounded-2xl border border-border flex">
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                className={cn(
                  "flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  provider === 'default' ? "bg-foreground text-background shadow-2xl" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Standard
              </button>
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=googlescholar`)}
                className={cn(
                  "flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  provider === 'googlescholar' ? "bg-foreground text-background shadow-2xl" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-3 h-3" />
                Scholar
              </button>
            </div>

            <button 
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "flex items-center justify-center space-x-3 border-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative",
                isFilterOpen || Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) 
                  ? "bg-foreground text-background border-foreground shadow-2xl" 
                  : "bg-background border-border text-foreground hover:bg-muted"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Filter Intelligence</span>
              {Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-foreground rounded-full border-2 border-background" />
              )}
            </button>
          </div>
        </div>

        {/* Scraper Warning Alert - Monochrome */}
        <AnimatePresence>
          {provider === 'googlescholar' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-12 p-6 bg-muted border-2 border-foreground/10 rounded-3xl flex items-start gap-4"
            >
              <AlertCircle className="w-6 h-6 text-foreground mt-0.5 shrink-0" />
              <div>
                <h4 className="text-foreground font-black text-xs uppercase tracking-widest">EXPERIMENTAL: DIRECT SCRAPE MODE</h4>
                <p className="text-muted-foreground text-[10px] mt-2 leading-relaxed font-bold uppercase tracking-wider opacity-60">
                  Direct connection established with Google Scholar. Data integrity verified. Please maintain search velocity within safety parameters.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-48 space-y-8 text-center">
            <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center border border-border shadow-inner">
               <BookX className="w-12 h-12 opacity-20" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Search Sequence Interrupted</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm font-medium opacity-60">
                {error}. {provider === 'googlescholar' && "External signals are currently being throttled by the provider."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {provider === 'googlescholar' && (
                <button 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                  className="bg-foreground text-background px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95"
                >
                  Switch to Standard Index
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="bg-background text-foreground px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-foreground active:scale-95"
              >
                Reconnect Signal
              </button>
            </div>
          </div>

        ) : filteredResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((journal, index) => {
                const uniqueKey = `${journal.source || 'journal'}-${journal.paperId || index}`;
                if (results.length === index + 1) {
                  return (
                    <div ref={lastElementRef} key={uniqueKey}>
                      <JournalCard journal={journal} />
                    </div>
                  );
                } else {
                  return (
                    <motion.div
                      key={uniqueKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index % 12) * 0.05 }}
                    >
                      <JournalCard journal={journal} />
                    </motion.div>
                  );
                }
              })}
            </div>

            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {[1, 2, 3].map((i) => (
                  <JournalCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!hasMore && filteredResults.length > 0 && (
              <p className="text-center text-slate-500 mt-12 text-sm italic">
                Anda telah mencapai akhir hasil pencarian.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-4 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
               <BookX className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Tidak ada jurnal ditemukan</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              {results.length > 0 
                ? "Hasil pencarian tidak sesuai dengan filter Anda. Coba sesuaikan filter."
                : "Kami tidak dapat menemukan hasil untuk pencarian Anda. Coba kata kunci lain."}
            </p>
            {results.length > 0 && (
              <button 
                onClick={() => setFilters({
                  yearStart: 1900,
                  yearEnd: new Date().getFullYear(),
                  openAccess: false,
                  hasPdf: false,
                  minCitations: 0,
                  sortBy: 'relevance'
                })}
                className="text-foreground font-black text-[10px] uppercase tracking-widest hover:underline mt-4"
              >
                Reset Filter Parameters
              </button>
            )}
          </div>
        )}

        <FilterSidebar 
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setIsFilterOpen(false);
          }}
          onReset={() => {
            setFilters({
              yearStart: 1900,
              yearEnd: new Date().getFullYear(),
              openAccess: false,
              hasPdf: false,
              minCitations: 0,
              sortBy: 'relevance'
            });
            setIsFilterOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <SearchResults />
    </Suspense>
  );
}
