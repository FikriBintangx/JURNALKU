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
  const [showYearDropdown, setShowYearDropdown] = useState(false);
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
    <main className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans transition-colors duration-500 z-0">
      <Navbar />
      
      {/* Globe Grid Background Layer (Adaptive High Contrast Version) */}
      <div className="absolute top-0 left-0 right-0 h-[1000px] overflow-hidden pointer-events-none z-0 transition-colors duration-500">
        {/* Subtle CSS Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}>
        </div>
        
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[140%] aspect-square max-w-[1600px] opacity-40 dark:opacity-50">
          <svg viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[spin_120s_linear_infinite] rotate-[15deg] text-foreground opacity-40 dark:opacity-60">
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
      <section className="relative pt-28 md:pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-3 text-[11px] font-bold uppercase tracking-wider bg-foreground text-background px-4 py-1.5 border border-foreground"
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
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-foreground">
                Riset Tanpa Batas
              </h1>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl"
            >
              <p className="text-sm md:text-base text-foreground/60 font-medium leading-relaxed">
                Akses 200 juta+ jurnal akademik, ringkas riset kompleks secara instan, 
                dan temukan celah penelitian dengan kecerdasan buatan.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "relative max-w-3xl mx-auto transition-all duration-700 ease-premium z-20",
              isSearchFocused && "z-[10001] scale-[1.01] -translate-y-1"
            )}
          >
            <form 
              onSubmit={handleSearch} 
              className={cn(
                "flex items-center bg-background border border-border/50 rounded-full transition-all duration-700 ease-premium",
                isSearchFocused 
                  ? "bg-background/80 backdrop-blur-md shadow-2xl border-foreground/30" 
                  : "shadow-sm hover:shadow-md hover:border-border"
              )}
            >
              <div className="pl-6 pr-3">
                <Search className="w-5 h-5 text-foreground/40" />
              </div>
              <input
                type="text"
                value={query}
                autoFocus
                onFocus={() => {
                  setIsSearchFocused(true);
                  document.body.classList.add('is-search-focused');
                }}
                onBlur={() => {
                  // Small delay to allow clicking suggestions
                  setTimeout(() => {
                    setIsSearchFocused(false);
                    setShowYearDropdown(false);
                    document.body.classList.remove('is-search-focused');
                  }, 250);
                }}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari topik atau jurnal riset..."
                className="w-full bg-transparent border-none outline-none text-sm md:text-base font-medium text-foreground placeholder:text-foreground/40 py-4 min-w-0"
              />
              
              <div className="relative hidden md:flex items-center h-full border-l border-border/50 bg-foreground/[0.02]">
                <button
                  type="button"
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center h-full px-5 hover:bg-foreground/5 transition-colors gap-2"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted group-focus-within:text-foreground transition-colors">
                    {selectedYear || 'TAHUN'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-foreground/40" />
                </button>
                
                <AnimatePresence>
                  {showYearDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full right-0 mt-4 w-40 bg-card text-card-foreground rounded-2xl border border-border/50 shadow-xl overflow-hidden z-[90] flex flex-col p-2"
                    >
                      {[
                        { val: '', label: 'SEMUA' },
                        { val: '2026', label: '2026' },
                        { val: '2025', label: '2025' },
                        { val: '2020', label: '5 TAHUN' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setSelectedYear(opt.val);
                            setShowYearDropdown(false);
                          }}
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl text-left transition-all",
                            selectedYear === opt.val ? "bg-card-foreground text-card" : "hover:bg-card-foreground/5 text-card-foreground/70 hover:text-card-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                type="submit"
                className="bg-foreground text-background px-6 md:px-8 py-4 font-bold text-sm tracking-wide hover:bg-foreground/90 transition-colors shrink-0 rounded-r-full"
              >
                Cari
              </button>
            </form>

            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.99 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full mt-4 left-0 right-0 bg-card text-card-foreground rounded-3xl border border-border/50 p-4 shadow-xl z-[80] search-suggestions-panel"
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
              className="group flex items-center justify-center px-8 py-3.5 font-bold text-background bg-foreground rounded-full transition-all duration-300 hover:scale-105 shadow-md"
            >
              <span className="text-sm">Buka Personal Workspace</span>
              <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex flex-wrap justify-center items-center gap-3 px-4">
              {categories.map((cat) => (
                <button 
                  key={cat.name}
                  onClick={() => {
                    setQuery(cat.name);
                    router.push(`/search?q=${encodeURIComponent(cat.name)}`);
                  }}
                  className="flex items-center space-x-2.5 rounded-full px-5 py-2.5 text-xs font-semibold transition-all bg-background text-foreground border border-border/50 hover:bg-foreground/5 active:scale-95 shadow-sm group"
                >
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                    <cat.icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Module Cards */}
      <section className="relative z-10 py-24 border-t border-border/50 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Indeks Semantik', desc: 'Telusuri 200 Juta+ jurnal dengan bahasa natural.', icon: <BookOpen className="w-5 h-5 text-card-foreground" /> },
              { title: 'Ringkasan Neural', desc: 'Dapatkan inti riset dalam hitungan detik.', icon: <Brain className="w-5 h-5 text-card-foreground" /> },
              { title: 'Akses Terbuka', desc: 'Akses PDF legal melalui jaringan Unpaywall.', icon: <Zap className="w-5 h-5 text-card-foreground" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all space-y-5 group"
              >
                <div className="w-12 h-12 bg-card-foreground/10 rounded-xl flex items-center justify-center text-card-foreground group-hover:scale-110 group-hover:bg-card-foreground/20 transition-all">
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-card-foreground/70 text-sm leading-relaxed">{feature.desc}</p>
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
          <div className="flex items-center space-x-10 text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Syarat</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Dokumen</Link>
          </div>
          <p className="text-[11px] font-medium text-foreground-muted tracking-wider">© 2026 JurnalStar AI. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </main>
  );
}

