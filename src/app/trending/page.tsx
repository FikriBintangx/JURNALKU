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
    <div className="min-h-screen bg-background pt-32 md:pt-48 pb-32">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-muted">
              <Flame className="w-4 h-4 text-foreground" />
              Live Neural Trends
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
              Trending <br /><span className="text-foreground-muted opacity-30">Research</span>
            </h1>
            <p className="text-foreground-secondary font-medium text-lg md:text-xl max-w-xl leading-relaxed">
              Discover the papers most cited and discussed by the global research community this week.
            </p>
          </div>
          
          <div className="flex bg-muted p-1.5 rounded-2xl border border-border shadow-sm">
            <button className="px-8 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95">Weekly</button>
            <button className="px-8 py-3 text-foreground-muted text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all">Monthly</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.paperId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <JournalCard journal={paper} />
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Insight Card - Premium OS Version */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-24 bg-foreground text-background rounded-[4rem] text-center relative overflow-hidden shadow-2xl group"
        >
          <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Sparkles className="w-[800px] h-[800px] text-background" />
          </div>
          
          <div className="relative z-10 space-y-12">
            <div className="w-20 h-20 bg-background text-foreground rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="w-10 h-10" />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase leading-[0.9]">Explore New <br/> Frontiers?</h2>
              <p className="text-background/40 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
                Our Neural Engine can identify research gaps in any field of interest.
              </p>
            </div>

            <button className="bg-background text-foreground hover:scale-105 active:scale-95 px-12 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl flex items-center mx-auto gap-4">
              <span>Initialize AI Discovery</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
