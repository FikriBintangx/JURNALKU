'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles, BookOpen, Brain, Zap, Loader2, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import APIStatusCard from '@/components/APIStatusCard';
import { TrendingSection } from '@/components/TrendingSection';
import { cn } from '@/lib/utils';

const TypewriterTitle = () => {
  const words = ['Jurnal Dunia', 'Paper Akademik', 'Riset Global', 'Karya Ilmiah'];
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(150);

  useEffect(() => {
    const handleType = () => {
      const currentWord = words[index];
      if (isDeleting) {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
        setSpeed(50);
      } else {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        setSpeed(150);
      }

      if (!isDeleting && displayText === currentWord) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      }
    };

    const timer = setTimeout(handleType, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, index, speed]);

  return <span className="text-primary inline-block min-w-[200px]">{displayText}<span className="animate-pulse">|</span></span>;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<{keywords: string[], explanation: string} | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleOptimizeQuery = async () => {
    if (!query || query.length < 10) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setOptimizedData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const categories = [
    { name: 'Kecerdasan Buatan', icon: <Brain className="w-4 h-4" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { name: 'Kedokteran', icon: <Zap className="w-4 h-4" />, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { name: 'Fisika Kuantum', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { name: 'Psikologi', icon: <BookOpen className="w-4 h-4" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden text-foreground">
      <Navbar />
      
      {/* Premium Subtle Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full" 
        />
      </div>

      <section className="relative pt-32 md:pt-48 pb-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-10 md:space-y-16">
          <div className="space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-muted/50 border border-border/50 px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Next Generation AI Research Engine</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight text-foreground leading-[0.9] lg:leading-[1.05]"
            >
              Cari riset <br className="hidden md:block" /> 
              dengan <TypewriterTitle />
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Akses jutaan jurnal akademik global. Dapatkan ringkasan AI instan, 
              temukan research gap, dan buka PDF gratis secara legal dalam satu platform.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-3xl mx-auto z-40"
          >
            {/* Hero Backdrop Overlay */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-background/80 backdrop-blur-2xl z-[30] pointer-events-auto"
                  onClick={() => setIsSearchFocused(false)}
                />
              )}
            </AnimatePresence>

            <form onSubmit={handleSearch} className="relative group z-40">
              <div className={cn(
                "glass-card rounded-[2.5rem] p-1.5 md:p-2 flex items-center border-border/60 shadow-xl transition-all relative overflow-hidden",
                isSearchFocused ? "border-primary/40 ring-8 ring-primary/5 bg-card shadow-2xl scale-[1.02]" : "hover:border-primary/20"
              )}>
                <div className="pl-6 md:pl-8 pr-4">
                  <Search className={cn(
                    "w-5 h-5 md:w-6 md:h-6 transition-colors",
                    isSearchFocused ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </div>
                <input
                  type="text"
                  value={query}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik topik penelitian atau pertanyaan..."
                  className="flex-grow bg-transparent border-none outline-none text-foreground text-lg md:text-xl font-medium placeholder:text-muted-foreground/40 py-4 md:py-6 focus:ring-0"
                />
                <button 
                  type="submit"
                  className="bg-foreground text-background hover:opacity-90 px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-3"
                >
                  <span className="hidden sm:inline">Research</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* AI Optimizer Section */}
              <AnimatePresence>
                {query.length > 15 && !optimizedData && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    type="button"
                    onClick={handleOptimizeQuery}
                    disabled={isOptimizing}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center space-x-2 text-primary hover:text-primary/80 text-[10px] font-black uppercase tracking-widest bg-primary/5 px-5 py-3 rounded-full border border-primary/20 transition-all hover:bg-primary/10 backdrop-blur-md"
                  >
                    {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                    <span>{isOptimizing ? 'Thinking...' : 'Optimize with AI'}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* AI Insights Panel */}
            <AnimatePresence>
              {(optimizedData || isOptimizing) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-8 p-8 rounded-[2.5rem] glass-card border-primary/20 text-left shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-primary font-black text-[10px] uppercase tracking-[0.2em] flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      AI Research Insights
                    </h4>
                    {!isOptimizing && (
                      <button type="button" onClick={() => setOptimizedData(null)} className="text-muted-foreground hover:text-foreground p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isOptimizing ? (
                    <div className="flex items-center space-x-4 py-6">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <div className="space-y-1">
                        <span className="text-foreground text-sm font-bold block">Merumuskan strategi riset...</span>
                        <span className="text-muted-foreground text-xs italic">Menganalisis jutaan parameter data akademik</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-base text-muted-foreground leading-relaxed font-medium">
                        "{optimizedData?.explanation}"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {optimizedData?.keywords.map((kw, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setQuery(kw);
                              router.push(`/search?q=${encodeURIComponent(kw)}`);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-xl border border-primary/10 text-xs font-black uppercase tracking-tight transition-all active:scale-95"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {categories.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => {
                  setQuery(cat.name);
                  router.push(`/search?q=${encodeURIComponent(cat.name)}`);
                }}
                className={`flex items-center space-x-3 rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-muted border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Global Index', desc: '200 juta+ paper dari OpenAlex dan Semantic Scholar.', icon: <BookOpen className="w-5 h-5" /> },
              { title: 'AI Assistant', desc: 'Analisis gap, ringkasan, dan penjelasan ELI5 instan.', icon: <Brain className="w-5 h-5" /> },
              { title: 'Zero Barrier', desc: 'Buka PDF gratis secara legal dengan Unpaywall API.', icon: <Zap className="w-5 h-5" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="p-8 rounded-[2.5rem] glass-card glass-card-hover space-y-4 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TrendingSection />

      {/* Explore Indicator */}
      <div className="pb-12 flex justify-center">
        <div className="flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Explore Library</span>
        </div>
      </div>
    </main>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

