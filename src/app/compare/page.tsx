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
    'stroke-foreground fill-foreground/10',
    'stroke-foreground-secondary fill-foreground/5',
    'stroke-foreground-muted fill-foreground/5',
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
            className="stroke-border fill-none"
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
            className="stroke-border"
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
              className="fill-foreground-muted text-[9px] font-bold uppercase tracking-widest"
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
      <div className="mt-8 flex flex-wrap justify-center gap-6">
        {headers.slice(1).map((h, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full bg-foreground")} />
            <span className="text-[10px] font-bold text-foreground-secondary truncate max-w-[100px] uppercase tracking-wider">{h}</span>
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
          <p className="text-[9px] text-foreground-muted uppercase tracking-[0.2em] font-bold opacity-30">MAPPING VECTOR DIMENSIONS</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 text-foreground selection:bg-foreground selection:text-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-48 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16 md:mb-24">
          <div className="space-y-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-4 bg-card rounded-2xl hover:bg-foreground hover:text-background transition-all group border border-border shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="px-5 py-2.5 bg-card rounded-full text-[10px] font-black text-foreground uppercase tracking-[0.3em] border border-border-strong">
                Compare Engine <span className="opacity-20 mx-2">|</span> AI OS v2.0
              </div>
            </div>
            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black text-foreground tracking-tighter leading-[0.85] uppercase">
              Research <br /><span className="text-foreground-muted opacity-30">Synthesis</span>
            </h1>
            <p className="text-foreground-secondary font-medium leading-relaxed text-lg md:text-xl max-w-2xl">
              Advanced cross-pollination of academic methodologies, findings, and innovation metrics powered by JurnalStar Intelligence.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={handleCompare}
              disabled={comparing || papers.length < 2}
              className="flex-1 lg:flex-none btn-primary h-20 md:h-24 px-12 md:px-20 !rounded-[2.5rem] !text-xs !tracking-[0.2em] active:scale-95 disabled:opacity-30 shadow-2xl"
            >
              {comparing ? (
                <div className="flex items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SYNTHESIZING...</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Sparkles className="w-5 h-5" />
                  <span>START DEEP ANALYSIS ({papers.length})</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Paper Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mb-20 md:mb-32">
          {papers.map((paper, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              key={`${paper.source || 'journal'}-${paper.paperId || index}`} 
              className="mono-card p-10 rounded-[3rem] relative flex flex-col h-full bg-card"
            >
               <div className="flex justify-between items-start mb-10">
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground bg-muted px-4 py-2 rounded-xl border border-border">
                   {paper.source || 'Intel'}
                 </span>
                 <div className="flex items-center gap-2 text-foreground-muted">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{(paper.citationCount || 0).toLocaleString()}</span>
                 </div>
               </div>
               <div className="flex-grow">
                 <h3 className="text-xl font-extrabold text-foreground leading-[1.2] mb-8 tracking-tighter line-clamp-3 uppercase">{paper.title}</h3>
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="px-4 py-2 rounded-xl bg-muted text-[10px] font-bold text-foreground-secondary uppercase tracking-widest border border-border">
                     {paper.year || 'N/A'}
                   </div>
                   <div className="px-4 py-2 rounded-xl bg-muted text-[10px] font-bold text-foreground-secondary uppercase tracking-widest border border-border truncate max-w-[150px]">
                     {paper.venue || 'Research Venue'}
                   </div>
                 </div>
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
              className="space-y-24 md:space-y-32"
            >
              {/* AI Verdict & Radar */}
              <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
                <div className="lg:col-span-4 mono-card p-12 rounded-[3.5rem] flex flex-col items-center justify-center bg-card">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted mb-12 self-start flex items-center gap-3">
                    <Target className="w-4 h-4" /> Vector Analysis
                  </h3>
                  <div className="w-full">
                    <RadarChart data={comparison.radarData} headers={comparison.headers} />
                  </div>
                </div>

                <div className="lg:col-span-8 bg-foreground text-background p-12 md:p-20 rounded-[4rem] relative overflow-hidden shadow-2xl">
                  <div className="absolute -top-20 -right-20 opacity-[0.03] pointer-events-none">
                    <Brain className="w-[600px] h-[600px] text-background" />
                  </div>
                  
                  <div className="relative z-10 space-y-16">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-background text-foreground rounded-3xl flex items-center justify-center border border-background/20 shadow-xl">
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase text-background">Critical Verdict</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-background/60">Sourced via {comparison.provider || 'Neural Core'}</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/60">Deep Synthesis</h4>
                        <p className="text-2xl md:text-4xl font-medium leading-[1.2] tracking-tight text-background">
                          {comparison.verdict?.summary || comparison.conclusion}
                        </p>
                      </div>
                      
                      <div className="bg-background/10 border border-background/20 p-10 rounded-[3rem]">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/50 mb-4">Strategic Recommendation</h4>
                        <p className="text-background text-lg md:text-xl leading-relaxed font-medium">
                          {comparison.verdict?.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
                  <div className="space-y-4">
                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Comparison Matrix</h3>
                    <p className="text-foreground-secondary text-lg md:text-xl font-medium">Detailed breakdown of research methodologies and novelty parameters.</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="h-16 px-10 rounded-2xl border border-border-strong text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-all shadow-sm">
                      Export Data
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[3.5rem] border border-border-strong bg-card shadow-2xl">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-border-strong">
                        {comparison.headers.map((header: string, i: number) => (
                          <th key={i} className={cn(
                            "p-12 text-[10px] font-black uppercase tracking-widest text-foreground-muted",
                            i === 0 ? "w-80 bg-muted/30" : ""
                          )}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {comparison.rows?.map((row: string[], i: number) => (
                        <tr key={i} className="group hover:bg-muted/10 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className={cn(
                              "p-12 text-lg font-medium leading-relaxed",
                              j === 0 ? "bg-muted/30 font-extrabold text-foreground w-80 tracking-tighter uppercase" : "text-foreground-secondary group-hover:text-foreground transition-colors"
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
              className="py-40 text-center space-y-12 mono-card rounded-[4rem] border-dashed border-border-strong bg-card flex flex-col items-center"
            >
              <div className="w-32 h-32 bg-muted rounded-[3rem] flex items-center justify-center relative group">
                <Scale className="w-14 h-14 text-foreground/20 group-hover:scale-110 transition-all duration-500" />
                <div className="absolute inset-0 border-2 border-foreground/10 rounded-[3rem] animate-ping opacity-20" />
              </div>
              <div className="space-y-6 px-6">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Ready for Neural Synthesis?</h2>
                <p className="text-foreground-secondary max-w-lg mx-auto font-medium text-xl leading-relaxed">
                  Select papers above and initiate the deep analysis engine to uncover cross-disciplinary research patterns.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={handleCompare}
                    className="text-[10px] font-bold uppercase tracking-widest px-12 py-6 bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Quick Analysis Start
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-foreground animate-spin opacity-20" />
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">Loading Core...</span>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
