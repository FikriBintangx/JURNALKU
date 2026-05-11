'use client';

import Link from 'next/link';
import { Search, Library, User, Menu, Sparkles, X, BookMarked, ArrowRight, History, Trash2, Command, LogIn } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import SearchSuggestions from './SearchSuggestions';

function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('default');
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null);

  // Fetch user status
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {}
  };

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  // Sync state with URL but only on mount or URL change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const p = searchParams.get('provider') || 'default';
    setQuery(q);
    setProvider(p);
  }, [searchParams]);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveToHistory(query);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}&provider=${provider}`);
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  return (
    <nav className="fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-2xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-all duration-300">
            <Library className="text-white w-6 h-6 md:w-7 md:h-7" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-foreground hidden sm:block">
            Jurnal<span className="text-primary">Star</span>
          </span>
        </Link>

        {/* Dynamic Search Bar In Navbar - ULTRA ROUNDED */}
        <div className="flex-grow max-w-4xl relative" ref={containerRef}>
          <form 
            onSubmit={handleSearch}
            className="group relative"
          >
            <div className="flex items-center bg-muted border border-border rounded-full px-4 md:px-6 py-2 md:py-3 hover:border-primary/30 transition-all focus-within:border-primary/50 shadow-inner">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-focus-within:text-primary mr-3 md:mr-4 shrink-0" />
              <input 
                ref={inputRef}
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari riset terbaru..."
                className="bg-transparent border-none outline-none text-foreground text-sm md:text-base w-full font-medium placeholder:text-muted-foreground focus:ring-0"
              />
              
              {query && (
                <button 
                  type="button" 
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-foreground/10 rounded-full text-muted-foreground hover:text-foreground mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Provider Toggle Mini - Hidden on small mobile */}
              <div className="hidden sm:flex items-center bg-background/40 rounded-full p-1 border border-border ml-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setProvider('default')}
                  className={cn(
                    "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all",
                    provider === 'default' ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  STD
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('googlescholar')}
                  className={cn(
                    "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all",
                    provider === 'googlescholar' ? "bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  GS
                </button>
              </div>

              <button 
                type="submit"
                className="ml-2 md:ml-3 p-1.5 md:p-2 bg-primary hover:bg-primary/90 text-white rounded-full transition-all shadow-lg active:scale-90"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </form>

          {/* Combined Suggestions & History Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-black text-white dark:bg-white dark:text-black backdrop-blur-2xl border border-border rounded-[2rem] overflow-hidden shadow-2xl z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
              
              {query.length >= 3 && (
                <SearchSuggestions 
                  query={query} 
                  onSelect={(s) => {
                    setQuery(s);
                    saveToHistory(s);
                    setShowDropdown(false);
                    router.push(`/search?q=${encodeURIComponent(s)}&provider=${provider}`);
                  }}
                />
              )}

              {(query.length < 3 || history.length > 0) && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <History className="w-3 h-3" />
                      Pencarian Terakhir
                    </span>
                    {history.length > 0 && (
                      <button 
                        onClick={clearHistory}
                        className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    )}
                  </div>
                  {history.length > 0 ? (
                    <div className="py-2">
                      {history.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(h);
                            saveToHistory(h);
                            setShowDropdown(false);
                            router.push(`/search?q=${encodeURIComponent(h)}&provider=${provider}`);
                          }}
                          className="w-full text-left px-5 py-3 text-inherit hover:bg-primary/20 transition-all flex items-center gap-4 group rounded-xl"
                        >
                          <Search className="w-4 h-4 opacity-50 group-hover:text-primary" />
                          <span className="text-sm font-medium">{h}</span>
                        </button>
                      ))}
                    </div>
                  ) : query.length < 3 && (
                    <div className="px-5 py-8 text-center text-muted-foreground italic text-sm">
                      Ketik minimal 3 karakter untuk saran AI...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
          <ThemeToggle />
          
          <Link 
            href="/library"
            className="hidden md:flex items-center justify-center px-5 py-2.5 bg-muted/50 text-foreground rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-border hover:bg-muted active:scale-95"
          >
            <BookMarked className="w-4 h-4 text-primary mr-2" />
            <span className="hidden lg:inline">Koleksi</span>
          </Link>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 md:pl-4 md:pr-1 md:py-1 bg-primary/10 border border-primary/20 rounded-full hover:bg-primary/20 transition-all active:scale-95">
                <span className="hidden md:block text-[10px] font-black text-primary uppercase tracking-tighter max-w-[100px] truncate">
                  {user.name}
                </span>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {user.name?.[0].toUpperCase()}
                </div>
              </button>

              {/* DROPDOWN: BLACK IN LIGHT MODE, WHITE IN DARK MODE */}
              <div className="absolute top-full right-0 mt-3 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[120]">
                <div className="bg-black text-white dark:bg-white dark:text-black rounded-3xl p-2 shadow-2xl border border-white/10 dark:border-black/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 dark:border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Profil Riset</p>
                    <p className="text-sm font-bold truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    <Link href="/library" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-black/5 transition-colors">
                      <BookMarked className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-tight">Koleksi Saya</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-tight text-left">Keluar Akun</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </nav>

  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-20 bg-[#020617] border-b border-white/5 animate-pulse" />}>
      <NavbarContent />
    </Suspense>
  );
}
