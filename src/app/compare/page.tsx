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
    'stroke-foreground fill-foreground/20',
    'stroke-foreground/60 fill-foreground/10',
    'stroke-foreground/40 fill-foreground/5',
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
            className="stroke-foreground/10 fill-none"
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
            className="stroke-foreground/5"
          />
        ))}
        {/* Labels */}
        {points.map((p, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = center + (radius + 25) * Math.cos(angle);
          const ly = center + (radius + 25) * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              className="fill-foreground/40 text-[9px] font-black uppercase tracking-widest"
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
            className={cn("transition-all duration-500", colors[idx % colors.length])}
            strokeWidth="3"
          />
        ))}
      </svg>
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
          const source = id.toUpperCase().startsWith('W') ? 'openalex' : 'semantic';
          return journalService.getDetail(id, source);
        }));
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-foreground animate-spin opacity-10" />
          <Sparkles className="w-6 h-6 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase animate-pulse text-foreground">Initializing Neural Synthesis...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground selection:bg-foreground selection:text-background transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-48 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 md:mb-24">
          <div className="space-y-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-5 bg-background hover:bg-foreground hover:text-background transition-all group border-2 border-foreground/10 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="px-6 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.4em] border-l-8 border-foreground/20">
                Compare Engine <span className="opacity-40 mx-2">|</span> AI OS v2.0
              </div>
            </div>
            <h1 className="text-[clamp(3.5rem,10vw,7rem)] font-black text-foreground tracking-tightest leading-[0.8] uppercase">
              RESEARCH <br /><span className="text-foreground/20">SYNTHESIS</span>
            </h1>
            <p className="text-foreground/60 font-medium leading-relaxed text-lg md:text-xl max-w-2xl border-l-2 border-foreground/10 pl-8">
              Advanced cross-pollination of academic methodologies, findings, and innovation metrics.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={handleCompare}
              disabled={comparing || papers.length < 2}
              className="flex-1 lg:flex-none btn-primary h-20 md:h-28 px-12 md:px-24 rounded-none text-xs md:text-sm tracking-[0.25em] active:scale-95 disabled:opacity-30 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_100px_-20px_rgba(255,255,255,0.1)] border-none"
            >
              {comparing ? (
                <div className="flex items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>MENYINTESIS...</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Sparkles className="w-5 h-5" />
                  <span>MULAI ANALISIS MENDALAM ({papers.length})</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Paper Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 mb-20 md:mb-32 border-2 border-foreground/10 bg-foreground/10 p-1">
          {papers.map((paper, index) => (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              key={`${paper.source || 'journal'}-${paper.paperId || index}`} 
              className="bg-background p-10 relative flex flex-col h-full hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-500 group border border-transparent hover:border-foreground/10 hover:-translate-y-1"
            >
               <div className="flex justify-between items-start mb-12">
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 border border-foreground/10 px-4 py-2">
                   {paper.source || 'Intel'}
                 </span>
                 <div className="flex items-center gap-2 text-foreground/20 group-hover:text-foreground transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{(paper.citationCount || 0).toLocaleString()}</span>
                 </div>
               </div>
               <div className="flex-grow">
                 <h3 className="text-xl md:text-2xl font-black text-foreground leading-tight mb-10 tracking-tight uppercase line-clamp-3 group-hover:text-blue-500 transition-colors">{paper.title}</h3>
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="px-5 py-2.5 bg-foreground/5 text-[10px] font-black text-foreground uppercase tracking-widest border border-foreground/5">
                     {paper.year || 'N/A'}
                   </div>
                   <div className="px-5 py-2.5 bg-foreground/5 text-[10px] font-black text-foreground uppercase tracking-widest border border-foreground/5 truncate max-w-[150px]">
                     {paper.venue || 'Research Venue'}
                   </div>
                 </div>
               </div>
               
               {/* Decorative luxury corner */}
               <div className="absolute bottom-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <div className="absolute bottom-4 right-4 w-[2px] h-4 bg-foreground/20" />
                 <div className="absolute bottom-4 right-4 h-[2px] w-4 bg-foreground/20" />
               </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Results */}
        <AnimatePresence mode="wait">
          {comparison ? (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-32"
            >
              {/* AI Verdict & Radar */}
              <div className="grid lg:grid-cols-12 gap-1 bg-foreground/10 border-2 border-foreground/10">
                <div className="lg:col-span-5 bg-background p-12 md:p-16 flex flex-col items-center justify-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-12 self-start flex items-center gap-4">
                    <Target className="w-5 h-5" /> Matriks Perbandingan Vektor
                  </h3>
                  <div className="w-full max-w-[400px]">
                    <RadarChart data={comparison.radarData} headers={comparison.headers} />
                  </div>
                </div>

                <div className="lg:col-span-7 bg-foreground text-background p-12 md:p-24 relative overflow-hidden transition-colors duration-500">
                  <div className="absolute -top-20 -right-20 opacity-[0.08] pointer-events-none">
                    <Brain className="w-[600px] h-[600px] text-background" />
                  </div>
                  
                  <div className="relative z-10 space-y-20">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-background text-foreground rounded-none flex items-center justify-center shadow-2xl border-l-[12px] border-foreground/20">
                        <ShieldCheck className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-none uppercase">Verdikt Kritikal</h3>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Sumber data: {comparison.provider || 'Neural Core'}</p>
                      </div>
                    </div>

                    <div className="space-y-16">
                      <div className="space-y-8 border-l-2 border-background/20 pl-10">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30">Deep Synthesis</h4>
                        <p className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tightest">
                          {comparison.verdict?.summary || comparison.conclusion}
                        </p>
                      </div>
                      
                      <div className="bg-background/5 border border-background/10 p-12 rounded-none hover:bg-background/10 transition-colors">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30 mb-6 flex items-center gap-3">
                          <Zap className="w-4 h-4 text-amber-500" /> Strategic Recommendation
                        </h4>
                        <p className="text-xl md:text-2xl leading-relaxed font-medium">
                          {comparison.verdict?.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="space-y-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-2">
                  <div className="space-y-6">
                    <h3 className="text-5xl md:text-7xl font-black tracking-tightest uppercase leading-none">Matriks <br className="md:hidden" /><span className="text-foreground/20">Perbandingan</span></h3>
                    <p className="text-foreground/50 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed">Rincian mendalam metodologi riset dan parameter kebaruan.</p>
                  </div>
                  <button className="btn-primary h-20 px-12 rounded-none border-none text-[10px] tracking-widest shadow-xl active:scale-95">
                    Ekspor Data Mentah
                  </button>
                </div>

                <div className="overflow-x-auto border-4 border-foreground bg-foreground">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr>
                        {comparison.headers.map((header: string, i: number) => (
                          <th key={i} className={cn(
                            "p-12 text-[11px] font-black uppercase tracking-[0.3em] border-r border-background/10 text-background",
                            i === 0 ? "w-96 bg-foreground/90 border-l-8 border-background" : "bg-foreground"
                          )}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y-2 divide-foreground/5">
                      {comparison.rows?.map((row: string[], i: number) => (
                        <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all duration-300 relative">
                          {row.map((cell, j) => (
                            <td key={j} className={cn(
                              "p-12 text-xl font-medium leading-relaxed border-r border-foreground/5",
                              j === 0 ? "bg-zinc-50 dark:bg-zinc-900 font-black text-foreground w-96 tracking-tight uppercase border-l-8 border-foreground/10" : "text-foreground/70 group-hover:text-foreground transition-colors"
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
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-48 text-center space-y-16 border-4 border-dashed border-foreground/10 bg-foreground/[0.02] flex flex-col items-center"
            >
              <div className="w-40 h-40 bg-foreground/5 flex items-center justify-center relative group">
                <Scale className="w-20 h-20 text-foreground/10 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 border-4 border-foreground/5 animate-ping opacity-20" />
              </div>
              <div className="space-y-8 px-8">
                <h2 className="text-5xl md:text-6xl font-black tracking-tightest uppercase">Siap untuk Sintesis Neural?</h2>
                <p className="text-foreground/40 max-w-xl mx-auto font-medium text-xl leading-relaxed">
                  Pilih jurnal di atas dan aktifkan mesin analisis mendalam untuk mengungkap pola riset lintas disiplin.
                </p>
                <div className="pt-10">
                  <button 
                    onClick={handleCompare}
                    className="btn-primary text-[12px] px-16 py-8 rounded-none active:scale-95 shadow-2xl border-none"
                  >
                    Mulai Analisis Cepat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 text-foreground animate-spin opacity-20" />
          <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Loading Core...</span>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
