'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import Navbar from '@/components/Navbar';
import { 
  Calendar, Users, Star, Sparkles, 
  ExternalLink, ArrowLeft, Share2,
  Brain, Zap, Target, Quote,
  AlertCircle, RefreshCw, BookOpen,
  ShieldCheck
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
      
      {/* Premium Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative pt-24 md:pt-36 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-10 md:space-y-16">
          
          {/* Header & Hero Section */}
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

            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1] tracking-tight"
              >
                {journal?.title}
              </motion.h1>

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

          {/* Meta & Actions Grid */}
          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="glass-card rounded-[2rem] p-6 flex items-center gap-5 border-border/40">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Citations</p>
                <p className="text-xl font-mono font-black text-foreground">{journal?.citationCount || 0}</p>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 flex items-center gap-5 border-border/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Access</p>
                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                  {journal?.isOpenAccess ? "Open Access" : "Limited Access"}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 flex items-center gap-5 border-border/40">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Year</p>
                <p className="text-xl font-mono font-black text-foreground">{journal?.year || 'N/A'}</p>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 flex items-center gap-5 border-border/40">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Relevance</p>
                <p className="text-xl font-mono font-black text-foreground">98%</p>
              </div>
            </div>
          </section>

          {/* AI Tools & Analysis Grid */}
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Brain className="w-6 h-6" />
              </div>
              <h2 className="text-[11px] font-black text-foreground uppercase tracking-[0.4em] flex items-center gap-2 whitespace-nowrap">
                AI Research Intelligence Suite
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent" />
            </div>

            <AIJournalAnalysis 
              paperId={journal.paperId || (id as string)}
              abstract={journal.abstract || ""}
              title={journal.title || ""}
            />

            <AIAnalyticsPanel paper={journal} />
          </section>

          {/* Abstract Content */}
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2">
              <div className="glass-card rounded-[3rem] p-8 md:p-14 border-border/40 shadow-xl relative group">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
                
                <h2 className="text-2xl md:text-4xl font-black text-foreground mb-10 flex items-center gap-5">
                  <span className="w-2 h-10 bg-primary rounded-full" />
                  Research Abstract
                </h2>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground/90 leading-[2] text-lg md:text-xl font-medium tracking-tight whitespace-pre-wrap selection:bg-primary/40">
                    {journal?.abstract || "Tidak ada abstrak yang tersedia untuk jurnal ini. Namun Anda tetap bisa menggunakan alat AI di atas untuk menganalisis metadata dan referensi terkait."}
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap gap-3">
                  {journal?.doi && (
                    <div className="px-5 py-3 rounded-2xl bg-muted/30 border border-border/50 flex flex-col">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Digital Object Identifier</span>
                      <span className="text-xs font-mono font-bold text-primary/80">{journal.doi}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="glass-card rounded-[2.5rem] p-8 md:p-10 space-y-10 border-border/40 sticky top-32">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Actions
                  </h4>
                  
                  <div className="grid gap-3">
                    <button 
                      onClick={() => setIsCiteModalOpen(true)}
                      className="w-full flex items-center justify-center gap-4 bg-foreground text-background py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
                    >
                      <Quote className="w-4 h-4" />
                      Format Citation
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-4 bg-muted/40 hover:bg-muted/60 text-foreground py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all border border-border/50">
                      <Share2 className="w-4 h-4 opacity-50" />
                      Share Research
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-border/40">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin-slow" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Source Diagnostic</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted-foreground">PROVIDER</span>
                      <span className="text-foreground font-bold uppercase">{source}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted-foreground">LATENCY</span>
                      <span className="text-emerald-500 font-bold">~142ms</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-muted-foreground">PAPER_ID</span>
                      <span className="text-foreground/40 truncate ml-4">{journal?.paperId || 'N/A'}</span>
                    </div>
                  </div>
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
