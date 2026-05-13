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
    <section className="py-16 md:py-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 bg-background px-6 py-4 rounded-none shadow-[0_20px_60px_rgba(0,0,0,0.15)] relative z-10 hover:translate-y-[-4px] transition-all duration-500 cursor-default border-l-4 border-foreground"
          >
            <div className="w-10 h-10 bg-foreground text-background rounded-none flex items-center justify-center shadow-lg transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>

            <div className="text-left pr-2">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-foreground leading-none">
                Riset Trending
              </h2>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-foreground/40 mt-1">
                Lapisan Insight Neural
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mono-card p-6 md:p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-foreground text-background px-3 py-1 rounded-none flex items-center gap-2 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Tren Global</span>
                  </div>
                  <span className="text-[9px] text-foreground-muted font-bold uppercase tracking-widest bg-background px-2 py-0.5 rounded-none border border-foreground shadow-[2px_2px_0px_rgba(0,0,0,1)]">{item.year}</span>
                </div>
                
                <h3 className="text-lg font-extrabold leading-[1.2] mb-8 transition-all tracking-tight h-14 line-clamp-2 uppercase group-hover:opacity-70">
                  {item.title}
                </h3>
                
                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground-muted mb-0.5">Interaksi</span>
                    <span className="text-xs font-black text-foreground">{(item.citations || 0).toLocaleString()} <span className="text-[9px] text-foreground-muted font-bold uppercase ml-1">Sitasi</span></span>
                  </div>
                  <Link 
                    href={`/journal/${item.id}`}
                    className="w-10 h-10 bg-background text-foreground rounded-none flex items-center justify-center hover:bg-foreground hover:text-background transition-all border-2 border-foreground shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] group-hover:scale-110 active:scale-95"
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
