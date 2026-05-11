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
    <div className="min-h-screen bg-[#020617] pb-32">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group backdrop-blur-md"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                AI Comparison Suite v2.0
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Bandingkan <span className="text-indigo-500">Riset</span>
            </h1>
            <p className="text-slate-500 max-w-xl font-medium leading-relaxed">
              Analisis mendalam terhadap metodologi, temuan kunci, dan kebaruan riset menggunakan AI Generative.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleCompare}
              disabled={comparing || papers.length < 2}
              className="flex-1 md:flex-none bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 shadow-xl shadow-white/5 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {comparing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
              <span>{comparing ? 'MENGANALISIS...' : `MULAI ANALISIS AI${papers.length > 0 ? ` (${papers.length})` : ''}`}</span>
            </button>
          </div>
        </div>

        {/* Paper Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {papers.map((paper, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={`${paper.source || 'journal'}-${paper.paperId || index}`} 
              className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden backdrop-blur-md group"
            >
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-20 h-20" />
               </div>
               <div className="flex justify-between items-start mb-6">
                 <span className={cn(
                   "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border",
                   paper.source === 'openalex' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                   paper.source === 'googlescholar' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                   "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                 )}>
                   {paper.source || 'Aggregator'}
                 </span>
                 <div className="flex items-center gap-1.5 text-slate-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{paper.citationCount || 0} Sitasi</span>
                 </div>
               </div>
               <h3 className="text-sm font-black text-white leading-relaxed mb-4 line-clamp-3">{paper.title}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{paper.year || 'Tahun N/A'} • {paper.venue || 'Venue N/A'}</p>
            </motion.div>
          ))}
        </div>

        {/* Compare Error State */}
        {compareError && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl flex-shrink-0">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-bold text-sm">{compareError}</p>
              <button
                onClick={() => setCompareError(null)}
                className="text-xs text-red-400/70 hover:text-red-400 mt-1 underline"
              >Tutup</button>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {comparison && comparison.headers ? (
          <div className="space-y-12">
            
            {/* AI Critical Insights Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Radar Chart Card */}
              <div className="md:col-span-1 bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl">
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Score Matrix
                </h3>
                <RadarChart data={comparison.radarData} headers={comparison.headers} />
              </div>

              {/* Critical Verdict Card */}
              <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5">
                   <Brain className="w-64 h-64" />
                </div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">AI Critical Verdict</h3>
                </div>
                
                <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Ringkasan Sintesis</h4>
                    <p className="text-slate-200 font-medium leading-relaxed italic text-lg">
                      "{comparison.verdict?.summary || comparison.conclusion}"
                    </p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3">Rekomendasi Riset</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {comparison.verdict?.recommendation || "Lakukan analisis lanjutan berdasarkan perbandingan parameter di bawah."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  Deep Comparison Matrix
                </h3>
                <div className="flex gap-2">
                   <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-all">
                      <Download className="w-4 h-4" /> EXPORT PDF
                   </button>
                   <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-black text-indigo-400 hover:bg-indigo-500/20 transition-all">
                      <Quote className="w-4 h-4" /> CITE ALL
                   </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[2.5rem] border border-white/10 glass-card shadow-2xl">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-indigo-600/20 backdrop-blur-xl sticky top-0 z-20">
                      {comparison.headers.map((header: string, i: number) => (
                        <th key={i} className={cn(
                          "p-8 text-[10px] font-black text-indigo-400 border-b border-white/10 uppercase tracking-[0.2em]",
                          i === 0 ? "w-48" : ""
                        )}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comparison.rows?.map((row: string[], i: number) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group">
                        {row.map((cell, j) => (
                          <td key={j} className={cn(
                            "p-8 text-sm leading-relaxed",
                            j === 0 ? "font-black text-white bg-white/5 w-48 border-r border-white/10" : "text-slate-300 font-medium"
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
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-emerald-500/20 rounded-2xl">
                    <Zap className="w-6 h-6 text-emerald-500" />
                 </div>
                 <div>
                    <h4 className="text-white font-black">Temukan Peluang Riset Baru?</h4>
                    <p className="text-slate-400 text-sm font-medium">Berdasarkan celah (gap) yang ditemukan, Anda bisa mengeksplorasi variabel yang belum tersentuh.</p>
                 </div>
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-black px-8 py-3 rounded-xl font-black transition-all active:scale-95 flex items-center gap-2">
                 MULAI RISET BARU <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-40 text-center space-y-8 glass-card rounded-[4rem] border border-dashed border-white/10 backdrop-blur-sm"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Scale className="w-12 h-12 text-slate-600" />
                <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-ping" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight italic">Ready to Bridge the Knowledge Gap?</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  Klik tombol <span className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Mulai Analisis AI</span> untuk melihat perbedaan metodologi, dataset, dan temuan dari jurnal pilihan Anda.
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
