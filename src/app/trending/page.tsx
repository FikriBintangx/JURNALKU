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
            <h1 className="text-5xl font-black text-foreground flex items-center tracking-tighter uppercase">
              <Flame className="w-10 h-10 mr-4 text-foreground animate-pulse" />
              Populer Hari Ini
            </h1>
            <p className="text-muted-foreground font-medium">
              Temukan jurnal yang paling banyak dibaca dan didiskusikan oleh para peneliti minggu ini.
            </p>
          </div>
          
          <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
            <button className="px-6 py-2.5 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Minggu Ini</button>
            <button className="px-6 py-2.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors">Bulan Ini</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* AI Insight Card - Monochrome Version */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-16 md:p-24 mono-card rounded-[3rem] text-center relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 space-y-10">
            <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center mx-auto border border-border shadow-2xl group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="w-10 h-10 text-foreground" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-background mb-4 tracking-tighter uppercase leading-[0.9]">Ingin Menemukan <br/> Topik Baru?</h2>
              <p className="text-background/40 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                Asisten AI kami dapat membantu Anda menemukan "Research Gap" di bidang apapun yang Anda minati.
              </p>
            </div>

            <button className="bg-background text-foreground hover:scale-105 active:scale-95 px-12 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-2xl flex items-center mx-auto space-x-4">
              <span>Mulai Riset dengan AI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
