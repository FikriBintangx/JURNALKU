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
  ArrowRight,
  ChevronDown,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import SearchSuggestions from '@/components/SearchSuggestions';
import { TrendingSection } from '@/components/TrendingSection';

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const yearParam = selectedYear ? `&yearStart=${selectedYear}&sortBy=year` : '';
      router.push(`/search?q=${encodeURIComponent(query)}${yearParam}`);
    }
  };

  const categories = [
    { name: 'Kecerdasan Buatan', icon: Brain },
    { name: 'Ilmu Hayati', icon: Zap },
    { name: 'Fisika Kuantum', icon: Sparkles },
    { name: 'Psikologi', icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans transition-colors duration-500">
      <Navbar />
      
      {/* Globe Grid Background Layer (Adaptive High Contrast Version) */}
      <div className="absolute inset-0 h-[1000px] overflow-hidden pointer-events-none z-[-1] bg-background transition-colors duration-500">
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[140%] aspect-square max-w-[1600px] opacity-[0.15] dark:opacity-[0.25]">
          <svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[spin_300s_linear_infinite] rotate-[15deg] stroke-foreground">
            {/* Base Circle */}
            <circle cx="500" cy="500" r="498" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
            
            {/* Longitudes (Vertical Curves) */}
            <ellipse cx="500" cy="500" rx="450" ry="500" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="350" ry="500" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="250" ry="500" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="150" ry="500" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="50" ry="500" stroke="currentColor" strokeWidth="1.5" />
            
            {/* Latitudes (Horizontal Curves) */}
            <ellipse cx="500" cy="500" rx="500" ry="450" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="500" ry="350" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="500" ry="250" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="500" ry="150" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="500" cy="500" rx="500" ry="50" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          
          {/* Subtle Fading Gradients (Adaptive) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>
      </div>

      {/* Backdrop Blur Focus Layer */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="search-active-overlay"
          />
        )}
      </AnimatePresence>
      
      {/* Cinematic Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-3 text-[9px] font-black uppercase tracking-[0.3em] bg-foreground text-background px-4 py-1.5 border border-foreground"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Lapisan Insight Neural untuk Riset</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-5xl md:text-7xl lg:text-[105px] font-black tracking-tightest uppercase leading-[0.85] text-foreground">
                RISET<br />TANPA BATAS.
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl"
            >
              <p className="text-[10px] md:text-xs text-foreground/70 font-bold leading-relaxed uppercase tracking-widest">
                Akses 200 Juta+ Jurnal Akademik. Ringkas Riset Kompleks Secara Instan, 
                Prediksi Tren Masa Depan, dan Buka Akses PDF Secara Global.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "relative max-w-3xl mx-auto transition-all duration-700 ease-premium",
              isSearchFocused ? "search-focus-target" : "z-20"
            )}
          >
            <form 
              onSubmit={handleSearch} 
              className={cn(
                "flex items-center bg-background border-2 border-foreground transition-all duration-700 ease-premium",
                isSearchFocused 
                  ? "bg-background/80 backdrop-blur-md shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)]" 
                  : "shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,1)]"
              )}
            >
              <div className="pl-5 pr-3">
                <Search className="w-4 h-4 text-foreground/40" />
              </div>
              <input
                type="text"
                value={query}
                onFocus={() => {
                  setIsSearchFocused(true);
                  document.body.classList.add('is-search-focused');
                }}
                onBlur={() => {
                  // Small delay to allow clicking suggestions
                  setTimeout(() => {
                    setIsSearchFocused(false);
                    document.body.classList.remove('is-search-focused');
                  }, 200);
                }}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="CARI TOPIK ATAU JURNAL..."
                className="w-full bg-transparent border-none outline-none text-[10px] md:text-lg font-black text-foreground placeholder:text-foreground/30 py-3 md:py-4 uppercase tracking-tight min-w-0"
              />
              
              <div className="relative hidden md:flex items-center h-full px-4 border-l-2 border-foreground/10 bg-background/50">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-[9px] font-black uppercase tracking-widest mr-2 text-foreground/40 outline-none cursor-pointer appearance-none"
                >
                  <option value="">TAHUN</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2020">5 TAHUN</option>
                </select>
                <ChevronDown className="w-3 h-3 text-foreground/40" />
              </div>

              <button 
                type="submit"
                className="bg-foreground text-background px-4 md:px-8 py-3 md:py-4 font-black text-[10px] uppercase tracking-widest hover:invert transition-all duration-300 border-l-2 border-foreground shrink-0"
              >
                CARI
              </button>
            </form>

            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.99, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 10, scale: 0.99, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute top-full mt-4 left-0 right-0 glass-dropdown !rounded-none !bg-background/70 !backdrop-blur-2xl border-2 border-foreground p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] z-[80] search-suggestions-panel"
                >
                  <SearchSuggestions query={query} onSelect={(val) => {
                    setQuery(val);
                    router.push(`/search?q=${encodeURIComponent(val)}`);
                    setIsSearchFocused(false);
                    document.body.classList.remove('is-search-focused');
                  }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center space-y-10"
          >
            <Link 
              href="/workspace"
              className="group flex items-center justify-center px-12 py-3 font-black text-background bg-foreground transition-all duration-300 hover:scale-105 shadow-[6px_6px_0px_rgba(0,0,0,0.2)] dark:shadow-[6px_6px_0px_rgba(255,255,255,0.2)] border-2 border-foreground"
            >
              <span className="text-[10px] uppercase tracking-[0.4em]">Buka Personal Workspace (AI OS)</span>
              <ArrowRight className="w-4 h-4 ml-4 group-hover:translate-x-2 transition-transform" />
            </Link>
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 px-4">
              {categories.map((cat) => (
                <button 
                  key={cat.name}
                  onClick={() => {
                    setQuery(cat.name);
                    router.push(`/search?q=${encodeURIComponent(cat.name)}`);
                  }}
                  className="flex items-center space-x-3 rounded-none px-5 md:px-6 py-2.5 md:py-3 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all bg-background text-foreground border-2 border-foreground hover:bg-foreground hover:text-background active:scale-95 shadow-[3px_3px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_rgba(255,255,255,1)] group relative overflow-hidden"
                >
                  <div className="opacity-70 transition-opacity relative z-10">
                    <cat.icon className="w-3 h-3" />
                  </div>
                  <span className="relative z-10">{cat.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Module Cards */}
      <section className="py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Indeks Semantik', desc: 'Telusuri 200 Juta+ jurnal dengan bahasa natural.', icon: <BookOpen className="w-5 h-5 text-foreground" /> },
              { title: 'Ringkasan Neural', desc: 'Dapatkan inti riset dalam hitungan detik.', icon: <Brain className="w-5 h-5 text-foreground" /> },
              { title: 'Akses Terbuka', desc: 'Akses PDF legal melalui jaringan Unpaywall.', icon: <Zap className="w-5 h-5 text-foreground" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 mono-card mono-card-hover space-y-5"
              >
                <div className="w-12 h-12 bg-background rounded-none flex items-center justify-center border border-border shadow-xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black">{feature.title}</h3>
                  <p className="opacity-40 text-[11px] font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TrendingSection />

      {/* Modern Footer */}
      <footer className="py-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-foreground rounded-none flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">JurnalStar</span>
          </div>
          <div className="flex items-center space-x-10 text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privasi</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">Syarat</Link>
            <Link href="/docs" className="hover:opacity-100 transition-opacity">Dokumen</Link>
          </div>
          <p className="text-[9px] font-bold opacity-20 uppercase tracking-widest">© 2026 JurnalStar AI. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </main>
  );
}

