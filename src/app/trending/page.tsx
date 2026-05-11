'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Flame, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import JournalCard from '@/components/JournalCard';
import { JournalCardSkeleton } from '@/components/Skeleton';

export default function TrendingPage() {
  const [papers, setPapers] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true);
      // Simulating trending by searching for 'latest' or popular terms
      const data = await journalService.search('artificial intelligence', 6);
      setPapers(data.data);
      setLoading(false);
    }
    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center">
              <Flame className="w-8 h-8 mr-4 text-orange-500 fill-orange-500" />
              Populer Hari Ini
            </h1>
            <p className="text-slate-400">
              Temukan jurnal yang paling banyak dibaca dan didiskusikan oleh para peneliti minggu ini.
            </p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg">Minggu Ini</button>
            <button className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white transition-colors">Bulan Ini</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.paperId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <JournalCard journal={paper} />
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Insight Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 glass-card p-12 rounded-[40px] border border-indigo-500/20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/5 -z-10" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
          
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ingin Menemukan Topik Baru?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-lg">
            Asisten AI kami dapat membantu Anda menemukan "Research Gap" di bidang apapun yang Anda minati.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 flex items-center mx-auto space-x-3">
            <span>Mulai Riset dengan AI</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
