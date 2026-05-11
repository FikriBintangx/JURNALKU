'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles, BookOpen, Brain, Zap, Loader2, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import APIStatusCard from '@/components/APIStatusCard';
import { TrendingSection } from '@/components/TrendingSection';

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
      
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 50, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
          x: [0, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" 
      />

      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-left space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-primary text-[10px] md:text-xs font-black uppercase tracking-widest"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Asisten Riset Berbasis AI v2.0</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1] lg:leading-[1.1]"
            >
              Cari, Baca, dan <br />
              Ngobrol dengan <br />
              <TypewriterTitle />
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl font-medium leading-relaxed"
            >
              Rasakan masa depan riset. Cari jutaan jurnal, dapatkan ringkasan AI instan, dan tanya jawab langsung dengan isi PDF menggunakan Gemini Pro.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="relative max-w-2xl mt-10"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Apa yang ingin Anda teliti hari ini?..."
                    className="w-full bg-card border border-border rounded-full py-5 md:py-7 px-14 md:px-20 text-foreground focus:outline-none focus:border-primary/50 transition-all text-lg md:text-xl shadow-2xl backdrop-blur-2xl placeholder:text-muted-foreground/60"
                  />
                  <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 md:w-7 md:h-7 group-focus-within:text-primary transition-colors" />
                  <button 
                    type="submit"
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-white px-6 md:px-10 py-3.5 md:py-4.5 rounded-full flex items-center space-x-2 transition-all active:scale-95 shadow-xl font-black text-sm md:text-base uppercase tracking-widest group/btn"
                  >
                    <span className="hidden sm:inline">Telusuri</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* AI Optimizer Section */}
              <AnimatePresence>
                {query.length > 15 && !optimizedData && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    type="button"
                    onClick={handleOptimizeQuery}
                    disabled={isOptimizing}
                    className="mt-6 flex items-center space-x-2 text-primary hover:text-primary/80 text-[10px] font-black uppercase tracking-widest bg-primary/5 px-5 py-3 rounded-2xl border border-primary/20 transition-all hover:bg-primary/10"
                  >
                    {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isOptimizing ? 'Menganalisis Query...' : 'Optimasi dengan AI'}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* AI Results */}
              <AnimatePresence>
                {(optimizedData || isOptimizing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-primary/20 text-left shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Brain className="w-20 h-20 text-primary" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="text-foreground font-black text-[10px] uppercase tracking-widest flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        AI Research Assistant Insights
                      </h4>
                      {!isOptimizing && (
                        <button type="button" onClick={() => setOptimizedData(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {isOptimizing ? (
                      <div className="flex items-center space-x-4 py-4 relative z-10">
                        <div className="relative">
                          <div className="w-10 h-10 border-2 border-primary/20 rounded-full animate-ping" />
                          <Loader2 className="w-10 h-10 text-primary animate-spin absolute inset-0" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-foreground text-sm font-bold block">Memproses ide Anda...</span>
                          <span className="text-muted-foreground text-xs italic">Merumuskan kata kunci akademik paling relevan</span>
                        </div>
                      </div>
                    ) : (optimizedData?.keywords && optimizedData.keywords.length > 0) ? (
                      <div className="space-y-4 relative z-10">
                        <p className="text-xs text-muted-foreground font-medium italic">
                          "{optimizedData.explanation}"
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {optimizedData.keywords.map((kw, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setQuery(kw);
                                router.push(`/search?q=${encodeURIComponent(kw)}`);
                              }}
                              className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl border border-primary/10 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs italic">Gagal mendapatkan saran. Coba topik lain.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 mt-12"
            >
              {categories.map((cat) => (
                <button 
                  key={cat.name}
                  onClick={() => {
                    setQuery(cat.name);
                    router.push(`/search?q=${encodeURIComponent(cat.name)}`);
                  }}
                  className={`flex items-center space-x-3 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border ${cat.color} shadow-lg`}
                >
                  {cat.icon}
                  <span>{cat.name}</span>
                </button>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <APIStatusCard />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border bg-muted/20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-foreground">Teknologi Masa Depan Riset</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">Platform bertenaga AI yang membantu peneliti menelusuri literatur ilmiah dengan kecepatan cahaya.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '200 Juta+', desc: 'Paper akademik global yang diindeks setiap hari secara real-time dari berbagai sumber terpercaya.', icon: <BookOpen className="w-6 h-6 text-primary" /> },
              { title: 'AI Insights', desc: 'Dapatkan ringkasan instan, poin penting, dan analisis gap riset untuk setiap paper dalam hitungan detik.', icon: <Brain className="w-6 h-6 text-purple-400" /> },
              { title: 'Chat PDF', desc: 'Lupakan membaca ratusan halaman. Tanya langsung ke isi paper dan dapatkan jawaban akurat dari Gemini.', icon: <Zap className="w-6 h-6 text-amber-400" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[3rem] bg-card/30 backdrop-blur-md border border-border text-center space-y-6 hover:border-primary/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                <div className="w-16 h-16 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border group-hover:bg-primary/10 group-hover:scale-110 transition-all shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section with modern container */}
      <div className="max-w-7xl mx-auto px-4 pb-32">
        <div className="relative rounded-[4rem] bg-gradient-to-b from-transparent to-primary/5 p-1">
          <TrendingSection />
        </div>
      </div>

      {/* Scroll to Explore Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 text-muted-foreground"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 border-2 border-muted rounded-full flex justify-center p-1"
        >
          <div className="w-1 h-2 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
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

