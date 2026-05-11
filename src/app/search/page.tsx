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
      if (j.year && (j.year < (filters.yearStart || 1900) || j.year > (filters.yearEnd || 2024))) return false;
      if ((filters.minCitations || 0) > 0 && (j.citationCount || 0) < (filters.minCitations || 0)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'year') return (b.year || 0) - (a.year || 0);
      if (filters.sortBy === 'citations') return (b.citationCount || 0) - (a.citationCount || 0);
      return 0; // Default order
    });

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Info Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex flex-wrap items-center gap-3">
              <Search className="w-6 h-6 text-primary" />
              {recommend ? (
                <>Jurnal Serupa</>
              ) : (
                <>Hasil untuk "<span className="text-primary">{query}</span>"</>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-2 font-medium">
              {recommend ? 'Menampilkan karya ilmiah terkait' : `Menemukan sekitar ${total.toLocaleString()} karya ilmiah`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Provider Toggle */}
            <div className="bg-muted p-1 rounded-xl border border-border flex">
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  provider === 'default' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Standard
              </button>
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=googlescholar`)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  provider === 'googlescholar' ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-3 h-3" />
                Scholar
              </button>
            </div>

            <button 
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "flex items-center justify-center space-x-2 border px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative",
                isFilterOpen || Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) 
                  ? "bg-primary/10 border-primary/50 text-primary" 
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
            </button>
          </div>
        </div>

        {/* Scraper Warning Alert */}
        <AnimatePresence>
          {provider === 'googlescholar' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-amber-500 font-bold text-sm">Eksperimental: Web Scraping Mode</h4>
                <p className="text-amber-500/70 text-xs mt-1 leading-relaxed">
                  Pencarian Google Scholar menggunakan teknik scraping langsung. Google mungkin memblokir pencarian jika dilakukan terlalu cepat.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
               <BookX className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">Oops! Pencarian Terhambat</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                {error}. {provider === 'googlescholar' && "Google Scholar mungkin sedang memblokir akses sementara."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {provider === 'googlescholar' && (
                <button 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                  Ganti ke Mode Standard
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="bg-muted hover:bg-muted/80 text-foreground px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-border active:scale-95"
              >
                Coba Lagi
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
                className="text-indigo-400 font-bold text-sm hover:underline mt-2"
              >
                Reset Filter
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
