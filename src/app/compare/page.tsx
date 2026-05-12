'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import Navbar from '@/components/Navbar';
import { 
  Scale, Check, X, ArrowLeft, Loader2, Sparkles, 
  Brain, FileText, Download, Share2, Quote, 
  Target, Zap, ShieldCheck, TrendingUp, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- Custom Radar Chart Component ---
function RadarChart({ data, headers }: { data: any[], headers: string[] }) {
  const size = 300;
  const center = size / 2;
  const radius = center * 0.7;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      label: d.subject,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      scores: headers.slice(1).map((_, idx) => (d[`jurnal${idx + 1}`] || 0) / 10)
    };
  });

  const getPath = (jIndex: number) => {
    return points.map((p, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * p.scores[jIndex];
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  const colors = [
    'stroke-indigo-500 fill-indigo-500/20',
    'stroke-emerald-500 fill-emerald-500/20',
    'stroke-amber-500 fill-amber-500/20',
    'stroke-rose-500 fill-rose-500/20',
    'stroke-cyan-500 fill-cyan-500/20',
  ];

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Hexagons */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
          <path
            key={step}
            d={points.map((p, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = center + (radius * step) * Math.cos(angle);
              const y = center + (radius * step) * Math.sin(angle);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z'}
            className="stroke-white/10 fill-none"
            strokeWidth="1"
          />
        ))}
        {/* Axis Lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            className="stroke-white/10"
          />
        ))}
        {/* Labels */}
        {points.map((p, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = center + (radius + 20) * Math.cos(angle);
          const ly = center + (radius + 20) * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-black uppercase tracking-widest"
            >
              {p.label}
            </text>
          );
        })}
        {/* Data Paths */}
        {headers.slice(1).map((_, idx) => (
          <motion.path
            key={idx}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            d={getPath(idx)}
            className={colors[idx % colors.length]}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {headers.slice(1).map((h, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", colors[idx % colors.length].split(' ')[0].replace('stroke-', 'bg-'))} />
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const [papers, setPapers] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (ids.length === 0) return;
      setLoading(true);
      try {
        const data = await Promise.all(ids.map(async id => {
          // Auto-detect source: OpenAlex IDs start with 'W'
          const source = id.toUpperCase().startsWith('W') ? 'openalex' : 'semantic';
          return journalService.getDetail(id, source);
        }));
        // Include partial data papers too — they still have a title/id for comparison
        setPapers(data.filter(p => p && p.title) as Journal[]);
      } catch (e) {
        console.error('[COMPARE PAGE] Failed to load papers:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCompare = async () => {
    setComparing(true);
    setCompareError(null);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers }),
      });
      const data = await res.json();
      if (data.error && !data.headers) {
        setCompareError(data.message || 'Analisis AI gagal. Coba lagi.');
      } else {
        setComparison(data);
      }
    } catch (e: any) {
      setCompareError('Tidak dapat terhubung ke server. Periksa koneksi.');
      console.error('[COMPARE] Error:', e);
    } finally {
      setComparing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-mono text-xs animate-pulse tracking-widest">LOADING RESEARCH METADATA...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 md:pt-40 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-3 glass-card rounded-2xl hover:bg-muted transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="px-4 py-1.5 glass-card rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] border-primary/20">
                AI Synthesis Suite v2.0
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-[0.9]">
              Compare <br /><span className="text-primary">Research</span>
            </h1>
            <p className="text-muted-foreground max-w-xl font-medium leading-relaxed text-lg">
              Analisis mendalam terhadap metodologi, temuan kunci, dan kebaruan riset menggunakan AI Intelijen.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-5 glass-card rounded-[2rem] text-muted-foreground hover:text-foreground transition-all">
              <Share2 className="w-6 h-6" />
            </button>
            <button 
              onClick={handleCompare}
              disabled={comparing || papers.length < 2}
              className="flex-1 md:flex-none bg-foreground text-background px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 shadow-2xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {comparing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
              <span>{comparing ? 'ANALYZING...' : `START AI ANALYSIS${papers.length > 0 ? ` (${papers.length})` : ''}`}</span>
            </button>
          </div>
        </div>

        {/* Paper Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {papers.map((paper, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={`${paper.source || 'journal'}-${paper.paperId || index}`} 
              className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group border-border/40"
            >
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-24 h-24" />
               </div>
               <div className="flex justify-between items-start mb-8">
                 <span className={cn(
                   "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
                   paper.source === 'openalex' ? "bg-amber-500/5 border-amber-500/10 text-amber-500/80" :
                   paper.source === 'googlescholar' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80" :
                   "bg-primary/5 border-primary/10 text-primary/80"
                 )}>
                   {paper.source || 'Research'}
                 </span>
                 <div className="flex items-center gap-2 text-muted-foreground/60">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{paper.citationCount || 0} Citations</span>
                 </div>
               </div>
               <h3 className="text-base font-bold text-foreground leading-snug mb-6 line-clamp-3 group-hover:text-primary transition-colors">{paper.title}</h3>
               <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-2 rounded-xl border border-border/30 w-fit">
                 {paper.year || 'N/A'} <span className="opacity-30">•</span> {paper.venue || 'Research Venue'}
               </div>
            </motion.div>
          ))}
        </div>

        {/* Compare Error State */}
        {compareError && (
          <div className="mb-12 p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-center gap-6">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <X className="w-6 h-6 text-red-500/70" />
            </div>
            <div>
              <p className="text-red-500/80 font-bold text-sm tracking-tight">{compareError}</p>
              <button
                onClick={() => setCompareError(null)}
                className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 mt-2 underline transition-all"
              >Dismiss</button>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {comparison && comparison.headers ? (
          <div className="space-y-20">
            
            {/* AI Critical Insights Grid */}
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Radar Chart Card */}
              <div className="lg:col-span-1 glass-card p-10 rounded-[3rem] border-border/40 shadow-sm">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                  <Target className="w-4 h-4" />
                  Score Matrix
                </h3>
                <RadarChart data={comparison.radarData} headers={comparison.headers} />
              </div>

              {/* Critical Verdict Card */}
              <div className="lg:col-span-2 bg-muted/20 border border-border/40 p-12 rounded-[3.5rem] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                   <Brain className="w-80 h-80" />
                </div>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/5 border-primary/20">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight">AI Critical Verdict</h3>
                </div>
                
                <div className="space-y-10 relative z-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Synthesis Summary</h4>
                    <p className="text-foreground leading-relaxed italic text-2xl font-medium">
                      "{comparison.verdict?.summary || comparison.conclusion}"
                    </p>
                  </div>
                  
                  <div className="glass-card border-border/30 p-8 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4">Research Recommendation</h4>
                    <p className="text-muted-foreground text-base leading-relaxed font-medium">
                      {comparison.verdict?.recommendation || "Lakukan analisis lanjutan berdasarkan perbandingan parameter di bawah."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-2xl font-black text-foreground flex items-center gap-4">
                  <span className="w-2 h-8 bg-primary rounded-full" />
                  Deep Comparison Matrix
                </h3>
                <div className="flex gap-3">
                   <button className="flex items-center gap-3 px-6 py-3 glass-card rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted transition-all border-border/50">
                      <Download className="w-4 h-4" /> EXPORT PDF
                   </button>
                   <button className="flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10 transition-all">
                      <Quote className="w-4 h-4" /> CITE ALL
                   </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[3rem] border border-border/40 glass-card shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                      {comparison.headers.map((header: string, i: number) => (
                        <th key={i} className={cn(
                          "p-10 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]",
                          i === 0 ? "w-56" : ""
                        )}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {comparison.rows?.map((row: string[], i: number) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors group">
                        {row.map((cell, j) => (
                          <td key={j} className={cn(
                            "p-10 text-base leading-relaxed font-medium",
                            j === 0 ? "text-foreground font-black bg-muted/20 w-56 border-r border-border/20" : "text-muted-foreground"
                          )}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Research Gap Banner */}
            <div className="glass-card bg-emerald-500/[0.03] border-emerald-500/20 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20">
                    <Zap className="w-7 h-7 text-emerald-500/80" />
                 </div>
                 <div>
                    <h4 className="text-foreground text-xl font-black tracking-tight">Temukan Peluang Riset Baru?</h4>
                    <p className="text-muted-foreground font-medium">Berdasarkan celah (gap) yang ditemukan, Anda bisa mengeksplorasi variabel yang belum tersentuh.</p>
                 </div>
              </div>
              <button className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3">
                 START NEW RESEARCH <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-48 text-center space-y-10 glass-card rounded-[4rem] border border-dashed border-border/60 relative overflow-hidden"
            >
              <div className="w-28 h-28 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 relative">
                <Scale className="w-12 h-12 text-muted-foreground/30" />
                <div className="absolute inset-0 border-2 border-primary/10 rounded-[2.5rem] animate-ping" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-foreground tracking-tight">Ready to Bridge the Knowledge Gap?</h2>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium text-lg">
                  Klik tombol <span className="text-primary font-black uppercase text-[10px] tracking-[0.2em] px-2 py-1 bg-primary/5 border border-primary/10 rounded-md">Start AI Analysis</span> untuk membedah perbedaan metodologi & temuan riset.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
