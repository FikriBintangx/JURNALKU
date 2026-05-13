'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import { cn } from '@/lib/utils';
import JournalCard from '@/components/JournalCard';
import Navbar from '@/components/Navbar';
import { Search, Filter, BookX, Loader2, Sparkles, AlertCircle, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JournalCardSkeleton } from '@/components/Skeleton';
import FilterSidebar from '@/components/FilterSidebar';
import { SearchFilters, SortBy, SearchResponse, ResearchIntelligence } from '@/types/search';
import IntelligencePanel from '@/components/IntelligencePanel';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const recommend = searchParams.get('recommend');
  const [results, setResults] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [intelligence, setIntelligence] = useState<ResearchIntelligence | undefined>();
  const provider = (searchParams.get('provider') as 'default' | 'googlescholar') || 'default';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    yearStart: searchParams.get('yearStart') ? parseInt(searchParams.get('yearStart')!) : 1900,
    yearEnd: searchParams.get('yearEnd') ? parseInt(searchParams.get('yearEnd')!) : new Date().getFullYear(),
    openAccess: searchParams.get('openAccess') === 'true',
    hasPdf: searchParams.get('hasPdf') === 'true',
    minCitations: searchParams.get('minCitations') ? parseInt(searchParams.get('minCitations')!) : 0,
    sortBy: (searchParams.get('sortBy') as any) || 'relevance'
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

  // Reset when query, recommend, provider, or filters change
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    setError(null);
  }, [query, recommend, provider, JSON.stringify(filters)]);

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
          data = await journalService.search(query, 12, offset, provider, filters);
          if (data.error) throw new Error(data.message || 'Gagal mengambil data');
        }
        
        if (offset === 0) {
          setResults(data.data);
          setIntelligence(data.intelligence);
          setLoading(false);
        } else {
          setResults(prev => {
            // Deduplicate by paperId to prevent keys collisions and redundant UI items
            const existingIds = new Set(prev.map(p => p.paperId).filter(Boolean));
            const newItems = data.data.filter(p => !p.paperId || !existingIds.has(p.paperId));
            return [...prev, ...newItems];
          });
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

  // The backend now handles filtering, so we use the results directly
  const filteredResults = results;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Info Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8 border-b border-border/50 pb-8">
          <div className="flex-1 min-w-0 max-w-3xl">
            <div className="flex items-start gap-4">
              <Search className="w-8 h-8 text-foreground shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h1 
                  onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                  className={cn(
                    "font-black text-foreground tracking-tighter uppercase transition-all duration-500 ease-out cursor-pointer overflow-hidden",
                    isTitleExpanded 
                      ? "text-3xl md:text-4xl leading-tight" 
                      : "text-lg md:text-xl whitespace-nowrap overflow-hidden text-ellipsis text-slate-400 hover:text-slate-800"
                  )}
                  title="Klik untuk mengubah ukuran teks"
                >
                  {recommend ? (
                    <>Jurnal Serupa</>
                  ) : (
                    <>Hasil untuk <span className={cn(isTitleExpanded ? "text-foreground-muted ml-2" : "text-slate-300 ml-1")}>"</span><span className="opacity-100">{searchParams.get('q') || query}</span><span className={cn(isTitleExpanded ? "text-foreground-muted" : "text-slate-300")}>"</span></>
                  )}
                </h1>
                
                <div className="flex items-center gap-3 mt-3">
                  <button 
                    onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-slate-200 text-[10px] font-bold text-foreground transition-colors uppercase tracking-wider"
                  >
                    {isTitleExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    <span>{isTitleExpanded ? 'Perkecil Judul' : 'Perluas Judul'}</span>
                  </button>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-l border-slate-300 pl-3">
                    {recommend ? 'Mesin Rekomendasi Neural' : `Jurnal Ditemukan: ${total.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 shrink-0 w-full lg:w-auto">
            {/* Provider Toggle - Monochrome */}
            <div className="bg-muted p-1 bg-muted/50 rounded-2xl border border-border flex shadow-inner w-full sm:w-auto">
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                className={cn(
                  "btn-fill-mewah flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                  provider === 'default' ? "bg-black text-white shadow-xl" : "text-foreground-muted hover:text-foreground"
                )}
              >
                Standard
              </button>
              <button 
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=googlescholar`)}
                className={cn(
                  "btn-fill-mewah flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  provider === 'googlescholar' ? "bg-black text-white shadow-xl" : "text-foreground-muted hover:text-foreground"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Scholar
              </button>
            </div>

            <button 
              onClick={() => setIsFilterOpen(true)}
              className={cn(
                "btn-fill-mewah w-full sm:w-auto flex items-center justify-center space-x-2 md:space-x-3 border-2 px-6 md:px-8 py-2.5 md:py-3.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative",
                isFilterOpen || Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) 
                  ? "bg-foreground text-background border-foreground shadow-2xl" 
                  : "bg-background border-border-strong text-foreground hover:bg-muted"
              )}
            >
              <Filter className="w-4 h-4" />
              <span>Filter Intelijen</span>
              {Object.values(filters).some(v => v === true || (typeof v === 'number' && v > 0)) && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground rounded-full border-2 border-background" />
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
              className="mb-12 p-8 bg-white text-black border border-black/10 rounded-[2rem] flex items-start gap-6 shadow-xl"
            >
              <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="text-black font-black text-sm uppercase tracking-widest leading-none mb-2">EKSPERIMENTAL: MODE SCRAPE LANGSUNG</h4>
                <p className="text-black/70 text-[11px] leading-relaxed font-bold uppercase tracking-wider">
                  Koneksi langsung terbentuk dengan Google Scholar. Integritas data diverifikasi. Harap pertahankan kecepatan pencarian dalam batas aman.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intelligence Panel */}
        <AnimatePresence mode="wait">
          {query && intelligence && !loading && (
            <IntelligencePanel intelligence={intelligence} />
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-12">
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative w-32 h-32 mb-2">
                <img 
                  src="https://media1.tenor.com/m/SH31iAEWLT8AAAAC/pikachu-running.gif" 
                  alt="Loading..." 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23000000' opacity='0.1'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                  ( sabar ya mba, mas, pak, kids , bot sedang mencari )
                </h3>
                <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-widest animate-pulse">
                  Memetakan Niat Semantik • Memperluas Domain Riset • Mengumpulkan Provider
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <JournalCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-48 space-y-10 text-center">
            <div className="w-28 h-28 bg-muted rounded-[2.5rem] flex items-center justify-center border border-border shadow-inner">
               <BookX className="w-12 h-12 text-foreground-muted/20" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase">Pencarian Terganggu</h2>
              <p className="text-foreground-secondary max-w-md mx-auto text-base font-medium">
                {error}. {provider === 'googlescholar' && "Sinyal eksternal saat ini sedang dibatasi oleh penyedia."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-lg mx-auto">
              {provider === 'googlescholar' && (
                <button 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                  className="flex-1 btn-primary h-14 md:h-16 px-12"
                >
                  Beralih ke Indeks Standar
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 h-14 md:h-16 px-12 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 border-border-strong hover:bg-muted active:scale-95 bg-background text-foreground"
              >
                Hubungkan Ulang
              </button>
            </div>
          </div>

        ) : filteredResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((journal, index) => {
                // Ensure absolute uniqueness by combining source, ID, and index
                const uniqueKey = `${journal.source || 'journal'}-${journal.paperId || 'null'}-${index}`;
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
          <div className="flex flex-col items-center justify-center py-56 space-y-12 text-center relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/[0.02] rounded-full blur-[120px] pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 bg-muted rounded-[3rem] flex items-center justify-center border border-border shadow-inner group transition-all hover:border-foreground/20">
                 <Search className="w-14 h-14 text-foreground-muted/20 group-hover:text-foreground/40 transition-colors" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-foreground/40" />
              </motion.div>
            </motion.div>

            <div className="space-y-6 relative">
              <h2 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Tidak Ada Jurnal Ditemukan</h2>
              <p className="text-foreground-muted max-w-md mx-auto text-sm font-black uppercase tracking-[0.3em]">
                {results.length > 0 
                  ? "PARAMETER FILTER TERLALU KETAT"
                  : "PERLUAS PENCARIAN ANDA UNTUK HASIL YANG LEBIH BAIK"}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto relative">
              <div className="bg-muted p-1.5 rounded-2xl border border-border flex shadow-inner w-full">
                <button 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=default`)}
                  className={cn(
                    "flex-1 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    provider === 'default' ? "bg-black text-white shadow-xl" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  Indeks Standar
                </button>
                <button 
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&provider=googlescholar`)}
                  className={cn(
                    "flex-1 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    provider === 'googlescholar' ? "bg-black text-white shadow-xl" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Scholar
                </button>
              </div>

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
                  className="text-foreground font-black text-[10px] uppercase tracking-[0.4em] hover:text-foreground-muted transition-colors border-b-2 border-foreground/10 pb-1"
                >
                  Reset Filter Intelijen
                </button>
              )}
            </div>
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
