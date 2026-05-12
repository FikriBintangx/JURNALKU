'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Brain, 
  Zap, 
  BookOpen, 
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { TrendingSection } from '@/components/TrendingSection';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const categories = [
    { name: 'Artificial Intelligence', icon: <Brain className="w-4 h-4" /> },
    { name: 'Life Sciences', icon: <Zap className="w-4 h-4" /> },
    { name: 'Quantum Physics', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'Psychology', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans">
      <Navbar />
      
      {/* Backdrop Blur Focus Layer */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-2xl z-30 transition-all duration-700"
          />
        )}
      </AnimatePresence>
      
      {/* Cinematic Hero */}
      <section className="relative pt-48 pb-32 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-muted/50 border border-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"
            >
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span>The Intelligence Layer for Academic Research</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85]"
            >
              RESEARCH <br className="hidden md:block" /> 
              WITHOUT LIMITS.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-60"
            >
              Access 200M+ academic papers. Instantly summarize complex research, 
              predict future trends, and unlock open access PDF globally.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-4xl mx-auto"
          >
            <form onSubmit={handleSearch} className="relative group z-40">
              <div className={cn(
                "bg-muted/30 border border-border rounded-full p-2 md:p-3 flex items-center transition-all duration-700",
                isSearchFocused ? "bg-background border-foreground/50 ring-[40px] ring-foreground/5 shadow-[0_0_100px_rgba(0,0,0,0.2)] scale-[1.08]" : "hover:bg-muted/60"
              )}>
                <div className="pl-6 pr-4">
                  <Search className={cn(
                    "w-6 h-6 transition-colors duration-500",
                    isSearchFocused ? "text-foreground" : "text-muted-foreground/30"
                  )} />
                </div>
                <input
                  type="text"
                  value={query}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask any research question..."
                  className="flex-grow bg-transparent border-none outline-none text-foreground text-xl md:text-2xl font-bold placeholder:text-muted-foreground/20 py-4 md:py-6"
                />
                <button 
                  type="submit"
                  className="mono-button px-10 md:px-16 py-4 md:py-6 text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            {categories.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => {
                  setQuery(cat.name);
                  router.push(`/search?q=${encodeURIComponent(cat.name)}`);
                }}
                className="flex items-center space-x-3 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all bg-muted/50 border border-border hover:bg-foreground hover:text-background group"
              >
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">{cat.icon}</div>
                <span>{cat.name}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Module Cards */}
      <section className="py-32 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Semantic Index', desc: 'Query 200M+ papers with natural language.', icon: <BookOpen className="w-6 h-6 text-foreground" /> },
              { title: 'Neural Summary', desc: 'Get core insights in seconds, not hours.', icon: <Brain className="w-6 h-6 text-foreground" /> },
              { title: 'Open Unlock', desc: 'Legal PDF access via Unpaywall network.', icon: <Zap className="w-6 h-6 text-foreground" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-12 mono-card mono-card-hover space-y-6"
              >
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center border border-border shadow-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">{feature.title}</h3>
                  <p className="opacity-40 text-sm font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TrendingSection />

      {/* Modern Footer */}
      <footer className="py-24 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">JurnalStar</span>
          </div>
          <div className="flex items-center space-x-12 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
            <Link href="/docs" className="hover:opacity-100 transition-opacity">Docs</Link>
          </div>
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest">© 2026 JurnalStar AI. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}

