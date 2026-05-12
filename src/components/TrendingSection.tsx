'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const TrendingSection = () => {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => {
        setTrending(data.data || []);
        setLoading(false);
      });
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-foreground rounded-2xl flex items-center justify-center border border-foreground/10 shadow-lg">
              <TrendingUp className="text-background w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Trending Research</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Curated Intelligence Layer</p>
            </div>
          </div>
          <div className="hidden md:block w-32 h-px bg-border/50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mono-card mono-card-hover p-8 h-full flex flex-col group">
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-black" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-black">Global Trend</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest bg-muted/30 px-2.5 py-1 rounded-md">{item.year}</span>
                </div>
                
                <h3 className="text-lg font-black line-clamp-2 mb-8 transition-colors leading-tight h-14">
                  {item.title}
                </h3>
                
                <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-30">Engagement</span>
                    <span className="text-xs font-bold">{item.citations.toLocaleString()} Citations</span>
                  </div>
                  <Link 
                    href={`/journal/${item.id}`}
                    className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-all border border-border/50 shadow-inner group-hover:scale-110 active:scale-95"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
