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
      const yearParam = selectedYear ? `&yearStart=${selectedYear}` : '';
      router.push(`/search?q=${encodeURIComponent(query)}${yearParam}`);
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
              <span>Lapisan Intelijen untuk Penelitian Akademik</span>
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
              Akses 200 Juta+ jurnal akademik. Ringkas riset kompleks secara instan, 
              prediksi tren masa depan, dan buka akses PDF secara global.
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
                "rounded-full p-2.5 md:p-3.5 flex items-center transition-all duration-700 shadow-[0_0_80px_rgba(255,255,255,0.05)]",
                "saturated-bar", // Custom high-contrast utility
                isSearchFocused ? "scale-[1.05] ring-[40px] dark:ring-black/5 ring-white/5" : "hover:scale-[1.02]"
              )}>
                <div className="pl-6 pr-4">
                  <Search className="w-7 h-7 text-foreground" />
                </div>
                <input
                  type="text"
                  value={query}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="APA YANG INGIN ANDA TEMUKAN HARI INI?"
                  className="flex-grow bg-transparent border-none outline-none text-base md:text-3xl font-black text-foreground placeholder:text-foreground/20 py-3 md:py-6 min-w-0 uppercase tracking-tighter"
                />
                <div className="hidden sm:flex items-center gap-2 px-6 border-l border-foreground/10 h-14 my-auto">
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-[11px] font-black uppercase tracking-[0.25em] outline-none cursor-pointer pr-2 text-foreground appearance-none"
                  >
                    <option value="" className="bg-background text-foreground">ALL TIME</option>
                    <option value="2026" className="bg-background text-foreground">2026</option>
                    <option value="2025" className="bg-background text-foreground">2025</option>
                    <option value="2020" className="bg-background text-foreground">LAST 5Y</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="h-12 md:h-20 px-8 md:px-20 rounded-full text-xs md:text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 mr-2 shrink-0 transition-all bg-foreground text-background hover:brightness-125"
                >
                  SEARCH
                </button>
              </div>

              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-full mt-4 left-0 right-0 glass-card p-4 shadow-2xl z-50 overflow-hidden rounded-[2.5rem] border border-white/10"
                  >
                    <SearchSuggestions query={query} onSelect={(val) => {
                      setQuery(val);
                      router.push(`/search?q=${encodeURIComponent(val)}`);
                      setIsSearchFocused(false);
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center mt-12 mb-4"
          >
            <Link 
              href="/workspace"
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:scale-105 shadow-xl shadow-indigo-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <Brain className="w-5 h-5 mr-3 relative z-10 group-hover:animate-pulse" />
              <span className="tracking-wide relative z-10">Buka Personal Workspace (AI OS)</span>
              <ArrowRight className="w-5 h-5 ml-3 opacity-70 group-hover:translate-x-1 transition-transform relative z-10" />
            </Link>
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
              { title: 'Indeks Semantik', desc: 'Telusuri 200 Juta+ jurnal dengan bahasa alami.', icon: <BookOpen className="w-6 h-6 text-foreground" /> },
              { title: 'Ringkasan Neural', desc: 'Dapatkan inti riset dalam hitungan detik.', icon: <Brain className="w-6 h-6 text-foreground" /> },
              { title: 'Akses Terbuka', desc: 'Akses PDF legal melalui jaringan Unpaywall.', icon: <Zap className="w-6 h-6 text-foreground" /> },
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
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privasi</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">Syarat</Link>
            <Link href="/docs" className="hover:opacity-100 transition-opacity">Dokumen</Link>
          </div>
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest">© 2026 JurnalStar AI. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </main>
  );
}

