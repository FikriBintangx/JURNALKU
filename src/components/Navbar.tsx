'use client';

import Link from 'next/link';
import { Search, Library, Sparkles, BookMarked, ArrowRight, Command, LogIn, User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import SearchSuggestions from './SearchSuggestions';

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navTheme, setNavTheme] = useState<'light' | 'dark'>('dark');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null);

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
    <nav className="fixed top-0 left-0 right-0 z-[10001] w-full">
      <div className={cn(
        "transition-all duration-700 ease-premium px-6 flex items-center justify-between backdrop-blur-xl relative z-10",
        isScrolled 
          ? "py-2 bg-background/80 border-b border-foreground/10 shadow-2xl" 
          : "py-4 bg-transparent border-b border-transparent",
        isSearchFocused && "bg-background/60"
      )}>
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 flex items-center justify-center transition-all duration-500 shadow-[3px_3px_0px_rgba(37,99,235,1)] bg-foreground text-background">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-black text-xl tracking-tightest uppercase hidden md:block transition-colors duration-500 text-foreground">
              JurnalStar
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-10">
            <Link href="/workspace" className="group relative py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 transition-opacity">Workspace</span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/trending" className="group relative py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-500 text-foreground/50 group-hover:text-foreground">
                Trending
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/library" className="group relative py-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-500 text-foreground/50 group-hover:text-foreground">
                Koleksi
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div 
          className={cn(
            "flex items-center gap-4 flex-1 max-w-xl mx-2 md:mx-8 relative transition-all duration-700 ease-premium",
            isSearchFocused ? "search-focus-target" : "z-[70]"
          )} 
          ref={containerRef}
        >
          <form 
            onSubmit={handleSearch} 
            className={cn(
              "w-full relative group flex items-center transition-all duration-700 ease-premium overflow-hidden h-10 border-2",
              isSearchFocused 
                ? "bg-background/80 backdrop-blur-md border-foreground shadow-[0_30px_70px_-10px_rgba(0,0,0,0.3)]" 
                : "bg-foreground/5 border-foreground/10 hover:bg-foreground/10"
            )}
          >
            <div className="relative flex items-center px-4 h-full border-r-2 border-foreground/10 cursor-pointer hover:bg-foreground/5 transition-colors">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="" className="bg-background text-foreground">TAHUN</option>
                <option value="2026" className="bg-background text-foreground">2026</option>
                <option value="2025" className="bg-background text-foreground">2025</option>
                <option value="2020" className="bg-background text-foreground">2020+</option>
              </select>
              <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-[9px] font-black uppercase tracking-widest transition-colors text-foreground/40">
                  {selectedYear || 'THN'}
                </span>
                <ChevronDown className="w-3 h-3 text-foreground/40" />
              </div>
            </div>
            
            <div className="relative flex-1 h-full flex items-center min-w-0">
                <Search className="absolute left-3 md:left-4 w-3.5 h-3.5 text-foreground/20 group-focus-within:text-foreground transition-all" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={handleFocus}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="CARI RISET..."
                  className="w-full bg-transparent border-none outline-none text-[9px] sm:text-xs font-black pl-9 md:pl-11 pr-3 md:pr-4 min-w-0 uppercase tracking-widest transition-colors text-foreground placeholder:text-foreground/20"
                />
            </div>
          </form>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.99, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 10, scale: 0.99, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="absolute top-full mt-4 left-0 right-0 glass-dropdown !rounded-none !bg-background/70 !backdrop-blur-2xl border-2 border-foreground p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] search-suggestions-panel"
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
                className="w-9 h-9 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[3px_3px_0px_rgba(37,99,235,1)] bg-foreground text-background"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 bg-foreground text-background border-foreground hover:bg-foreground/90"
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
