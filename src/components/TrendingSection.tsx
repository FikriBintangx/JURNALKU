'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tighter">Trending Research</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {trending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card glass-card-hover p-8 rounded-3xl group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  Hot Area
                </span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.year}</span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-foreground line-clamp-2 mb-6 group-hover:text-primary transition-colors leading-snug h-12">
                {item.title}
              </h3>
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/50">
                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  {item.citations} Citations
                </div>
                <Link 
                  href={`/journal/${item.id}`}
                  className="p-2 bg-muted rounded-xl text-muted-foreground group-hover:text-amber-500 transition-colors border border-border"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

  );
};
