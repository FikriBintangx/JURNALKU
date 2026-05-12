'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import Navbar from '@/components/Navbar';
import { 
  Calendar, Users, Star, FileText, Sparkles, 
  ExternalLink, ArrowLeft, Share2, Bookmark,
  ChevronRight, Brain, Zap, Target, Quote,
  AlertCircle, RotateCcw, RefreshCw, BookOpen,
  Loader2, BookX, Search
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarkButton from '@/components/BookmarkButton';
import CitationModal from '@/components/CitationModal';
import { cn } from '@/lib/utils';
import { AIJournalAnalysis } from '@/components/AI/AIJournalAnalysis';
import { AIAnalyticsPanel } from '@/components/AI/AIAnalyticsPanel';
import UnpaywallButton from '@/components/UnpaywallButton';



export default function JournalDetail() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCiteModalOpen, setIsCiteModalOpen] = useState(false);

  const source = searchParams.get('source') || 'semantic';

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      console.log(`[PAGE] Fetching Detail for: ${id} (${source})`);
      const data = await journalService.getDetail(id as string, source);
      
      if (data && data.error) {
        setError(data.message);
        setJournal(null);
      } else {
        setJournal(data);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [id, source]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] pt-28 px-4">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 bg-white/10 rounded-lg w-3/4"></div>
          <div className="h-4 bg-white/5 rounded w-1/4"></div>
          <div className="space-y-6">
            <div className="h-64 bg-white/5 rounded-3xl"></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="h-40 bg-white/5 rounded-3xl col-span-2"></div>
              <div className="h-40 bg-white/5 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-3xl text-center space-y-8 shadow-2xl"
        >
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Data Tidak Ditemukan</h1>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {error || "Jurnal dengan ID ini tidak tersedia di database kami."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Coba Lagi
            </button>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-bold border border-white/10 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Pencarian
            </Link>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black mb-3">System Diagnostic</div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-[10px] text-slate-500 font-mono">ID: {id}</span>
              <span className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-[10px] text-slate-500 font-mono uppercase">Source: {source}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      {/* Premium Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/5 blur-[150px] rounded-full animate-pulse-slow" />
      </div>

      <div className="relative pt-24 md:pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          
          {/* Hero Section */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => window.history.back()}
                className="p-2 md:p-3 bg-card hover:bg-muted rounded-2xl border border-border transition-all group backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="h-6 w-px bg-border mx-1" />
              <div className={cn(
                "px-3 py-1.5 border rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2",
                source === 'openalex' ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                source === 'googlescholar' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                "bg-primary/10 border-primary/30 text-primary"
              )}>
                {source === 'openalex' ? <BookX className="w-3 h-3" /> : 
                 source === 'googlescholar' ? <Search className="w-3 h-3" /> : 
                 <Sparkles className="w-3 h-3" />}
                {source === 'googlescholar' ? 'Scholar' : source}
              </div>
              {journal?.year && (
                <span className="px-3 py-1.5 bg-muted border border-border rounded-full text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {journal.year}
                </span>
              )}
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight"
            >
              {journal?.title}
            </motion.h1>

            <div className="flex flex-wrap gap-4 md:gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs md:text-sm font-semibold italic line-clamp-1">
                  {journal?.authors && journal.authors.length > 0 
                    ? journal.authors.map((a: any) => a.name).join(", ") 
                    : "Penulis Anonim"}
                </span>
              </div>
              {journal?.venue && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs md:text-sm font-bold uppercase tracking-tight line-clamp-1">{journal.venue}</span>
                </div>
              )}
            </div>

              <div className="flex flex-wrap gap-4 pt-4 items-center">
                {journal?.url && (
                  <a 
                    href={journal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl font-black hover:opacity-90 transition-all shadow-xl active:scale-95"
                  >
                    <ExternalLink className="w-5 h-5" />
                    SUMBER ASLI
                  </a>
                )}
                
                {/* Unpaywall PDF Finder - High Visibility */}
                {journal?.doi && (
                  <UnpaywallButton 
                    doi={journal.doi} 
                    className="px-8 py-4 rounded-2xl text-sm h-full"
                  />
                )}
              <div className="flex gap-2">
                <BookmarkButton journal={journal} />
                <Link 
                  href={`/search?recommend=${journal?.paperId}`}
                  className="p-4 bg-card border border-border text-foreground rounded-2xl hover:bg-muted transition-all"
                  title="Cari Jurnal Serupa"
                >
                  <Target className="w-5 h-5 text-primary" />
                </Link>
              </div>
            </div>
          </section>

          {/* AI Power Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <h2 className="text-[10px] md:text-sm font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Research Tools
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/20 to-transparent" />
            </div>

            <AIJournalAnalysis 
              paperId={journal.paperId || (id as string)}
              abstract={journal.abstract || ""}
              title={journal.title || ""}
            />

            <div className="pt-8">
              <AIAnalyticsPanel paper={journal} />
            </div>
          </section>

          {/* Abstract & Meta */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card border border-border p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] backdrop-blur-md shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-black text-foreground mb-6 md:mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  Abstrak
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-[1.8] text-base md:text-lg font-medium whitespace-pre-wrap">
                    {journal?.abstract || "Tidak ada abstrak yang tersedia untuk jurnal ini."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border p-8 rounded-[2rem] md:rounded-[2.5rem]">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">Informasi Publikasi</h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center group">
                    <span className="text-muted-foreground font-bold text-sm">Sitasi</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-foreground font-black">{journal?.citationCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold text-sm">Akses</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${journal?.isOpenAccess ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {journal?.isOpenAccess ? "Terbuka" : "Terbatas"}
                    </span>
                  </div>
                  {journal?.doi && (
                    <div className="pt-6 border-t border-border">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">DOI Number</span>
                      <span className="text-primary text-xs font-mono break-all leading-relaxed">{journal.doi}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setIsCiteModalOpen(true)}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl text-xs font-black uppercase transition-all border border-primary/20"
                  >
                    <Quote className="w-4 h-4" />
                    Format Sitasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <CitationModal 
        journal={journal} 
        isOpen={isCiteModalOpen} 
        onClose={() => setIsCiteModalOpen(false)} 
      />
    </main>
  );
}
