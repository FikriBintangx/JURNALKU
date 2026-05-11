'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Zap, Layers, Share2, Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { QueueStatus } from './QueueStatus';

interface AIAnalyticsPanelProps {
  paper: any;
}

export const AIAnalyticsPanel = ({ paper }: AIAnalyticsPanelProps) => {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [gaps, setGaps] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalytics = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const [roadmapRes, gapsRes] = await Promise.all([
        fetch('/api/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: paper.id || paper.paperId, abstract: paper.abstract, title: paper.title })
        }),
        fetch('/api/gap-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: paper.id || paper.paperId, abstract: paper.abstract, title: paper.title })
        })
      ]);

      const roadmapData = await roadmapRes.json();
      const gapsData = await gapsRes.json();

      if (roadmapData.success && gapsData.success) {
        setRoadmap(roadmapData.data);
        setGaps(gapsData.data);
      } else {
        setError(roadmapData.message || gapsData.message || "Gagal memuat analisis AI");
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan koneksi atau kuota AI habis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Trigger Section */}
      {!roadmap && !gaps && !loading && !error && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] text-center space-y-4 backdrop-blur-sm">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Buka Insight AI Mendalam</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 font-medium">
              Dapatkan Roadmap Penelitian dan Prediksi Gap riset khusus untuk jurnal ini menggunakan Gemini 2.0 Flash.
            </p>
          </div>
          <button
            onClick={generateAnalytics}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            Mulai Analisis AI
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="h-40 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 border border-white/5 animate-pulse">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Generate Analytics...</p>
            <QueueStatus isVisible={true} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-400 font-bold">{error}</p>
          <button
            onClick={generateAnalytics}
            className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10"
          >
            <RotateCcw size={12} /> Coba Lagi
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <div className="space-y-8">
          {/* Research Roadmap */}
          {roadmap?.roadmap && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-[2.5rem] border-indigo-500/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                  <Map size={24} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Research Roadmap</h3>
              </div>
              
              <div className="space-y-6 relative">
                {roadmap.roadmap.map((step: string, i: number) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
                        {i + 1}
                      </div>
                      {i < roadmap.roadmap.length - 1 && <div className="w-px h-full bg-gradient-to-b from-indigo-500/20 to-transparent my-2" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-slate-300 leading-relaxed font-medium">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Research Gaps */}
          {gaps?.gaps && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-[2.5rem] border-amber-500/20"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Gap Prediction</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gaps.gaps.map((gap: any, i: number) => (
                  <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group">
                    <h4 className="text-white font-black mb-3 group-hover:text-amber-400 transition-colors">{gap.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{gap.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-6 rounded-3xl text-center border-white/5">
              <Layers className="mx-auto mb-3 text-indigo-400" size={24} />
              <div className="text-2xl font-black text-white">{paper.citations || paper.citationCount || 0}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Citations</div>
            </div>
            <div className="glass-card p-6 rounded-3xl text-center border-white/5">
              <Share2 className="mx-auto mb-3 text-emerald-400" size={24} />
              <div className="text-2xl font-black text-white">0.92</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Growth Index</div>
            </div>
            <div className="glass-card p-6 rounded-3xl text-center border-white/5">
              <Zap className="mx-auto mb-3 text-amber-400" size={24} />
              <div className="text-2xl font-black text-white">High</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Impact</div>
            </div>
            <div className="glass-card p-6 rounded-3xl text-center border-white/5">
              <Map className="mx-auto mb-3 text-purple-400" size={24} />
              <div className="text-2xl font-black text-white">Ready</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Analysis</div>
            </div>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
};
