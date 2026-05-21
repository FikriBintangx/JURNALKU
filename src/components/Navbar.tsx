'use client';

import Link from 'next/link';
import { Search, Library, Sparkles, BookMarked, ArrowRight, Command, LogIn, User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import SearchSuggestions from './SearchSuggestions';
import { useTheme } from 'next-themes';

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<'light' | 'dark'>('dark');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === 'light' 
    ? '/assets/logo/logojurnalkulightmode.png' 
    : '/assets/logo/logojurnalkudarkmode.png';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (err) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const yStart = searchParams.get('yearStart') || '';
    setQuery(q);
    setSelectedYear(yStart);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Simple section detection (Hero is usually at top and dark in this app)
      if (window.scrollY > 600) {
        setNavTheme('light');
      } else {
        setNavTheme('dark');
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsSearchFocused(false);
        setShowYearDropdown(false);
        document.body.classList.remove('is-search-focused');
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setIsSearchFocused(true);
    setShowDropdown(true);
    document.body.classList.add('is-search-focused');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    const yearParam = selectedYear ? `&yearStart=${selectedYear}&sortBy=year` : '';
    router.push(`/search?q=${encodeURIComponent(query)}${yearParam}`);
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-[10001] w-full flex justify-center pointer-events-none px-4 md:px-0">
      <div className={cn(
        "pointer-events-auto w-full transition-all duration-700 ease-premium flex items-center justify-between backdrop-blur-xl relative z-10",
        isScrolled && !isSearchFocused
          ? "max-w-5xl mt-4 rounded-full border border-border/50 bg-background/90 shadow-2xl py-2 px-4 md:px-6" 
          : "max-w-[100vw] mt-0 rounded-none border-b border-border/50 bg-transparent py-4 px-6",
        isSearchFocused && "bg-background/95"
      )}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="w-14 h-14 flex items-center justify-center transition-all duration-300 overflow-hidden rounded-xl"
            >
              <img src={logoSrc} alt="JurnalStar Logo" className="w-full h-full object-contain" />
            </motion.div>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-10">
            <Link href="/workspace" className="group relative py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/70 hover:text-foreground transition-colors duration-300">Workspace</span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/search?q=trending" className="group relative py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-300 text-foreground/50 group-hover:text-foreground">
                Trending
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div 
          className={cn(
            "flex items-center gap-4 flex-1 max-w-xl mx-2 md:mx-8 relative transition-all duration-700 ease-premium z-[70]",
            isSearchFocused && "z-[10001] scale-[1.01] -translate-y-1"
          )} 
          ref={containerRef}
        >
          <form 
            onSubmit={handleSearch} 
            className={cn(
              "w-full relative group flex items-center transition-all duration-700 ease-premium h-12 border rounded-full",
              isSearchFocused 
                ? "bg-background/80 backdrop-blur-md border-foreground/30 shadow-xl" 
                : "bg-foreground/5 border-border/50 hover:bg-foreground/10 shadow-sm"
            )}
          >
            <div className="relative flex items-center h-full border-r border-border/50 transition-colors">
              <button
                type="button"
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 px-4 h-full hover:bg-foreground/5 transition-colors rounded-l-full"
              >
                <span className="text-[9px] font-black uppercase tracking-widest transition-colors text-foreground/80 group-focus-within:text-foreground">
                  {selectedYear || 'THN'}
                </span>
                <ChevronDown className="w-3 h-3 text-foreground/40 group-focus-within:text-foreground/80" />
              </button>
              
              <AnimatePresence>
                {showYearDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-4 w-32 bg-card text-card-foreground rounded-2xl border border-border/50 shadow-xl overflow-hidden z-[90] flex flex-col p-2"
                  >
                    {[
                      { val: '', label: 'SEMUA' },
                      { val: '2026', label: '2026' },
                      { val: '2025', label: '2025' },
                      { val: '2020', label: '2020+' }
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
            
            <div className="relative flex-1 h-full flex items-center min-w-0">
                <Search className="absolute left-3 md:left-4 w-3.5 h-3.5 text-foreground/20 group-focus-within:text-foreground transition-all" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={handleFocus}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsSearchFocused(false);
                      setShowDropdown(false);
                      document.body.classList.remove('is-search-focused');
                    }, 300);
                  }}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="CARI RISET..."
                  className="w-full bg-transparent border-none outline-none text-[9px] sm:text-xs font-black pl-9 md:pl-11 pr-8 md:pr-10 min-w-0 uppercase tracking-widest transition-colors text-foreground placeholder:text-foreground/20"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 text-foreground/30 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
            </div>
          </form>

          <AnimatePresence>
            {showDropdown && (
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
                  setShowDropdown(false);
                  setIsSearchFocused(false);
                  document.body.classList.remove('is-search-focused');
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Link 
                href="/profile" 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm border border-border/50 bg-foreground/5 text-foreground hover:bg-foreground/10"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="px-6 py-2.5 text-xs font-bold transition-all border border-border/50 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </div>

    </nav>
    <AnimatePresence>
      {isSearchFocused && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="search-active-overlay"
          style={{ pointerEvents: 'auto' }}
          onClick={() => {
            setIsSearchFocused(false);
            setShowDropdown(false);
            document.body.classList.remove('is-search-focused');
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl h-14 bg-muted rounded-full animate-pulse" />}>
      <NavbarContent />
    </Suspense>
  );
}
