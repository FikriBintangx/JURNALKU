'use client';

import Link from 'next/link';
import { Search, Library, Sparkles, BookMarked, ArrowRight, Command, LogIn, User } from 'lucide-react';
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
    setQuery(q);
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
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100]">
      <div className="glass-nav border border-border rounded-full px-6 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase hidden sm:block">JurnalStar</span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            <Link href="/trending" className="hover:opacity-100 transition-opacity">Trending</Link>
            <Link href="/library" className="hover:opacity-100 transition-opacity">Library</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-xl mx-8 relative" ref={containerRef}>
          <form onSubmit={handleSearch} className="w-full relative group">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search research..."
              className="w-full bg-muted/50 border border-border/50 rounded-full py-2.5 px-10 text-xs font-bold transition-all outline-none focus:bg-background focus:border-foreground/20"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 opacity-20 group-focus-within:opacity-40 transition-opacity">
              <Command className="w-3 h-3" />
              <span className="text-[10px] font-black">K</span>
            </div>
          </form>

          <AnimatePresence>
            {showDropdown && query.length > 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-full mt-4 left-0 right-0 mono-card p-2 shadow-2xl z-[110] overflow-hidden"
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link 
                href="/profile" 
                className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform" />
                <User className="w-5 h-5 relative z-10" />
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="bg-foreground text-background px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
          <button className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-muted border border-border">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-xl -z-10"
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
