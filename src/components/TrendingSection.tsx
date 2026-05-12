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
    <section className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter uppercase leading-none text-foreground">Trending Research</h2>
              <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em]">Neural Insight Layer</p>
            </div>
          </div>
          <div className="hidden md:block w-32 h-px bg-border-strong" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {trending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mono-card p-8 md:p-10 h-full flex flex-col group relative overflow-hidden transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-foreground text-background px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Global Trend</span>
                  </div>
                  <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-widest bg-muted px-3 py-1 rounded-lg border border-border">{item.year}</span>
                </div>
                
                <h3 className="text-xl font-extrabold leading-[1.2] mb-10 transition-all tracking-tight h-16 line-clamp-2 uppercase group-hover:opacity-70">
                  {item.title}
                </h3>
                
                <div className="mt-auto pt-8 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted mb-1">Engagement</span>
                    <span className="text-sm font-black text-foreground">{(item.citations || 0).toLocaleString()} <span className="text-[10px] text-foreground-muted font-bold uppercase ml-1">Citations</span></span>
                  </div>
                  <Link 
                    href={`/journal/${item.id}`}
                    className="w-12 h-12 bg-muted text-foreground rounded-2xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all border border-border shadow-sm group-hover:scale-110 active:scale-95"
                  >
                    <ArrowUpRight size={20} />
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
