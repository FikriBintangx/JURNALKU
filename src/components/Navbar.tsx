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
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    const yearParam = selectedYear ? `&yearStart=${selectedYear}&sortBy=year` : '';
    router.push(`/search?q=${encodeURIComponent(query)}${yearParam}`);
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100]">
      <div className="glass-nav rounded-full px-5 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shadow-sm">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter uppercase hidden md:block text-foreground">JurnalStar</span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/workspace" className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors">Workspace</Link>
            <Link href="/trending" className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted hover:text-foreground transition-colors">Trending</Link>
            <Link href="/library" className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted hover:text-foreground transition-colors">Koleksi</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:max-w-xl mx-1 sm:mx-6 relative" ref={containerRef}>
          <form onSubmit={handleSearch} className="w-full relative group flex items-center bg-muted/30 border border-border rounded-full transition-all focus-within:bg-background focus-within:ring-4 focus-within:ring-foreground/5 focus-within:border-foreground-muted overflow-hidden h-11">
            <div className="relative flex items-center px-2 sm:px-4 h-full border-r border-border cursor-pointer hover:bg-muted transition-colors">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="" className="bg-background">Tahun</option>
                <option value="2026" className="bg-background">2026</option>
                <option value="2025" className="bg-background">2025</option>
                <option value="2024" className="bg-background">2024</option>
                <option value="2023" className="bg-background">2023</option>
                <option value="2020" className="bg-background">2020+</option>
              </select>
              <div className="flex items-center gap-1 sm:gap-2 pointer-events-none">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-foreground-muted whitespace-nowrap">
                  {selectedYear || 'YR'}
                </span>
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 h-3 text-foreground-muted" />
              </div>
            </div>
            
            <div className="relative flex-1 h-full">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full h-full bg-transparent pl-8 sm:pl-11 pr-2 sm:pr-4 text-[10px] sm:text-[13px] font-bold outline-none placeholder:text-foreground-muted placeholder:opacity-30"
              />
              <Search className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 h-4 text-foreground-muted/40 group-focus-within:text-foreground transition-all" />
            </div>
          </form>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-full mt-4 left-0 right-0 glass-dropdown p-3 shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <SearchSuggestions query={query} onSelect={(val) => {
                  setQuery(val);
                  router.push(`/search?q=${encodeURIComponent(val)}`);
                  setShowDropdown(false);
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <Link 
                href="/profile" 
                className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm group overflow-hidden"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="btn-primary !px-5 !py-2.5 !text-[10px]"
              >
                Masuk
              </Link>
            )}
          </div>
          {user && (
            <Link 
              href="/profile" 
              className="sm:hidden w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-all overflow-hidden"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl h-14 bg-muted rounded-full animate-pulse" />}>
      <NavbarContent />
    </Suspense>
  );
}
