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
  Loader2, BookX, Search, Maximize2, Minimize2
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
  const params = useParams();
  const searchParams = useSearchParams();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCiteModalOpen, setIsCiteModalOpen] = useState(false);
  const [isTitleMinimized, setIsTitleMinimized] = useState(false);

  // Handle catch-all id (it will be string[] for [...id])
  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw.join('/') : idRaw;
  const decodedId = id ? decodeURIComponent(id) : null;

  const source = searchParams.get('source') || 'semantic';

  useEffect(() => {
    async function fetchDetail() {
      if (!decodedId) return;
      setLoading(true);
      setError(null);
      
      console.log(`[PAGE] Fetching Detail for: ${decodedId} (${source})`);
      const data = await journalService.getDetail(decodedId, source);
      
      if (data && data.error) {
        setError(data.message);
        setJournal(null);
      } else {
        setJournal(data);
      }
      setLoading(false);
    }
    fetchDetail();
  }, [decodedId, source]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-28 px-4">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 bg-muted rounded-lg w-3/4"></div>
          <div className="h-4 bg-muted/50 rounded w-1/4"></div>
          <div className="space-y-6">
            <div className="h-64 bg-muted/50 rounded-[2.5rem]"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-muted/50 rounded-[2.5rem] md:col-span-2"></div>
              <div className="h-40 bg-muted/50 rounded-[2.5rem]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-muted/30 border border-border/50 p-10 rounded-[2.5rem] backdrop-blur-3xl text-center space-y-8 shadow-2xl"
        >
          <div className="w-24 h-24 bg-foreground/5 border border-foreground/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-12 h-12 text-foreground/40" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Data Not Found</h1>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              {error || "The requested journal identifier is not available in our neural mapping."}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-border transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Terminal
            </Link>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black mb-3">System Diagnostic</div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-black/40 rounded-lg border border-white/5 text-[10px] text-slate-500 font-mono">ID: {decodedId}</span>
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
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative pt-24 md:pt-36 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-10 md:space-y-16">
          
          <section className="space-y-8 md:space-y-10">
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-3 glass-card rounded-2xl hover:bg-muted transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2",
                  source === 'openalex' ? "bg-amber-500/5 border-amber-500/20 text-amber-500/80" :
                  source === 'googlescholar' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500/80" :
                  "bg-primary/5 border-primary/20 text-primary/80"
                )}>
                  {source === 'googlescholar' ? 'Google Scholar' : source}
                </div>
                {journal?.year && (
                  <span className="px-3 py-1.5 glass-card rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    Publikasi {journal.year}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6 relative group">
              <motion.h1 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "font-black text-foreground leading-tight tracking-tight transition-all duration-500 ease-out",
                  isTitleMinimized ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl lg:text-6xl"
                )}
              >
                {journal?.title}
              </motion.h1>

              <button
                onClick={() => setIsTitleMinimized(!isTitleMinimized)}
                className="absolute -left-12 top-2 p-2 rounded-xl glass-card text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                title={isTitleMinimized ? "Perbesar Judul" : "Perkecil Judul"}
              >
                {isTitleMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Authors</span>
                    <span className="text-sm font-bold italic line-clamp-1">
                      {journal?.authors && journal.authors.length > 0 
                        ? journal.authors.map((a: any) => a.name).join(", ") 
                        : "Penulis Anonim"}
                    </span>
                  </div>
                </div>

                {journal?.venue && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-accent">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Venue</span>
                      <span className="text-sm font-bold uppercase tracking-tight line-clamp-1">{journal.venue}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              {journal?.url && (
                <a 
                  href={journal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Source Link
                </a>
              )}

              {journal?.doi && (
                <a 
                  href={`https://doi.org/${journal.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-muted border border-border px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                  DOI Link
                </a>
              )}
              
              {journal?.doi && (
                <UnpaywallButton 
                  doi={journal.doi} 
                  className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest h-full"
                />
              )}

              <div className="flex gap-2">
                <BookmarkButton journal={journal} className="!p-4 !rounded-2xl" />
                <Link 
                  href={`/search?recommend=${journal?.paperId}`}
                  className="p-4 glass-card rounded-2xl hover:bg-muted transition-all text-primary"
                  title="Cari Jurnal Serupa"
                >
                  <Target className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2 whitespace-nowrap">
                <Brain className="w-4 h-4" />
                AI Research Intelligence
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
            </div>

            <AIJournalAnalysis 
              paperId={journal.paperId || (decodedId || "")}
              abstract={journal.abstract || ""}
              title={journal.title || ""}
            />

            <AIAnalyticsPanel paper={journal} />
          </section>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 shadow-sm border-border/40">
                <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8 flex items-center gap-4">
                  <span className="w-1.5 h-8 bg-primary rounded-full" />
                  Abstrak Riset
                </h2>
                <p className="text-muted-foreground leading-[1.8] text-lg font-medium whitespace-pre-wrap">
                  {journal?.abstract || "Tidak ada abstrak yang tersedia untuk jurnal ini."}
                </p>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="glass-card rounded-[2.5rem] p-8 space-y-8 border-border/40">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Meta Information</h4>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold text-sm">Citation Count</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500/80" />
                      <span className="text-foreground font-black">{journal?.citationCount || 0}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-bold text-sm">Access Status</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                      journal?.isOpenAccess ? "bg-emerald-500/5 text-emerald-500/80 border border-emerald-500/10" : "bg-muted/50 text-muted-foreground border border-border/50"
                    )}>
                      {journal?.isOpenAccess ? "Open Access" : "Limited"}
                    </span>
                  </div>

                  {journal?.doi && (
                    <div className="pt-6 border-t border-border/40">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Digital Object Identifier</span>
                      <span className="text-primary/70 text-xs font-mono break-all leading-relaxed">{journal.doi}</span>
                    </div>
                  )}

                  <button 
                    onClick={() => setIsCiteModalOpen(true)}
                    className="w-full flex items-center justify-center gap-3 bg-muted/40 hover:bg-muted/60 text-foreground py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-border/50"
                  >
                    <Quote className="w-4 h-4 text-primary/60" />
                    Format Citasi
                  </button>
                </div>
              </div>
            </aside>
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
