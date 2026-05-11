'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Journal } from '@/types/journal';
import { Scale, Brain, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

function CompareResults() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') || [];
  const [papers, setPapers] = useState<Journal[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (ids.length === 0) return;
      setLoading(true);
      try {
        // Fetch paper details first
        const paperPromises = ids.map(id => fetch(`https://api.semanticscholar.org/graph/v1/paper/${id}?fields=title,abstract,year,authors,venue,citationCount`).then(res => res.json()));
        const papersData = await Promise.all(paperPromises);
        setPapers(papersData);

        // Fetch AI comparison
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ papers: papersData }),
        });
        const data = await res.json();
        setComparison(data.comparison);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">AI sedang menganalisis dan membandingkan jurnal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-24">
        <div className="flex items-center space-x-4 mb-12">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-full text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Scale className="w-8 h-8 mr-4 text-indigo-400" />
            Hasil Perbandingan Jurnal
          </h1>
        </div>

        {/* Papers Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {papers.map((p, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl italic -rotate-12">
                {i + 1}
              </div>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">Paper {i + 1}</p>
              <h3 className="text-white font-bold leading-tight line-clamp-2">{p.title}</h3>
              <p className="text-xs text-slate-400 mt-2">{p.year} • {p.authors?.[0]?.name}</p>
            </div>
          ))}
        </div>

        {/* AI Comparison Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        >
          <div className="bg-indigo-600/10 p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-white">Analisis Komprehensif Gemini AI</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>MODEL: GEMINI-1.5-FLASH</span>
            </div>
          </div>

          <div className="p-8">
            <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
              {comparison}
            </div>
          </div>
        </motion.div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => window.print()}
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold border border-white/10 transition-all flex items-center space-x-3"
          >
            <BookX className="w-5 h-5" />
            <span>Unduh Laporan (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompareResultsPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <CompareResults />
    </Suspense>
  );
}

// Re-using icon for fallback
function BookX(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 2 20 20" />
      <path d="M4 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
      <path d="M12 18H4a2 2 0 0 1-2-2V9c0-1.1.9-2 2-2h3" />
      <path d="M6 14h2" />
      <path d="M10 14h2" />
    </svg>
  )
}
