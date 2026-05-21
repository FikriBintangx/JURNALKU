'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowUpRight, Sparkles, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Scope = 'international' | 'indonesia';

export const TrendingSection = () => {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope>('international');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trending?scope=${scope}`)
      .then(res => res.json())
      .then(data => {
        setTrending(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [scope]);

  return (
    <section className="py-16 md:py-20 relative bg-background">
      {/* Animated Grid Background */}
      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 4rem 4rem; }
        }
      `}</style>
      <div className="absolute inset-0 opacity-5 dark:opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(to right, var(--foreground) 2px, transparent 2px), linear-gradient(to bottom, var(--foreground) 2px, transparent 2px)', 
             backgroundSize: '4rem 4rem',
             animation: 'gridMove 20s linear infinite'
           }}>
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            {/* Title Badge */}
            <div className="inline-flex items-center gap-4 bg-background px-6 py-4 rounded-3xl shadow-sm border border-border/50">
              <div className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center shadow-sm">
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
            </div>

            {/* Indo / Internasional Toggle */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center p-1 bg-background border border-border/50 rounded-2xl shadow-sm gap-1">
                <button
                  onClick={() => setScope('indonesia')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    scope === 'indonesia'
                      ? "bg-foreground text-background shadow-sm"
                      : "text-foreground/40 hover:text-foreground/70"
                  )}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Indonesia
                </button>
                <button
                  onClick={() => setScope('international')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    scope === 'international'
                      ? "bg-foreground text-background shadow-sm"
                      : "text-foreground/40 hover:text-foreground/70"
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Internasional
                </button>
              </div>
              {/* Scope description */}
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 text-center">
                {scope === 'indonesia'
                  ? '🇮🇩 Menampilkan jurnal dari peneliti & institusi Indonesia'
                  : '🌍 Menampilkan jurnal dari seluruh dunia'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Cards Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1,2,3].map(i => (
                <div key={i} className="bg-card rounded-3xl p-8 h-52 animate-pulse border border-border/50">
                  <div className="h-4 bg-card-foreground/10 rounded-full w-1/3 mb-4" />
                  <div className="h-6 bg-card-foreground/10 rounded-full w-full mb-3" />
                  <div className="h-6 bg-card-foreground/10 rounded-full w-4/5" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={scope}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {trending.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="bg-card p-6 md:p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 rounded-3xl border border-border/50 shadow-sm hover:border-foreground/20 hover:shadow-md">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-card-foreground text-card px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">
                          {scope === 'indonesia' ? 'Tren 🇮🇩' : 'Tren Global'}
                        </span>
                      </div>
                      <span className="text-[9px] text-card-foreground/70 font-bold uppercase tracking-widest bg-card-foreground/5 px-2 py-0.5 rounded-full border border-card-foreground/10 shadow-sm">{item.year}</span>
                    </div>
                    
                    <h3 className="text-lg font-extrabold leading-[1.2] mb-8 transition-all tracking-tight h-14 line-clamp-2 uppercase group-hover:opacity-70 text-card-foreground">
                      {item.title}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-card-foreground/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-card-foreground/60 mb-0.5">Interaksi</span>
                        <span className="text-xs font-black text-card-foreground">{(item.citations || 0).toLocaleString()} <span className="text-[9px] text-card-foreground/60 font-bold uppercase ml-1">Sitasi</span></span>
                      </div>
                      <Link 
                        href={`/journal/${item.id}`}
                        className="w-10 h-10 bg-card-foreground text-card rounded-full flex items-center justify-center hover:opacity-80 transition-all border border-card-foreground/20 shadow-sm group-hover:scale-110 active:scale-95"
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
