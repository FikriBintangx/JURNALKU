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
    <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-4 py-3 md:py-4">
        <div className="glass-card rounded-[2rem] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4 shadow-sm border-border/40">
          <Link href="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-105 transition-all duration-500 overflow-hidden">
              <Library className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground hidden sm:block">
              Jurnal<span className="text-primary">Star</span>
            </span>
          </Link>

          {/* Premium Command-style Search Bar */}
          <div className="flex-grow max-w-2xl relative" ref={containerRef}>
            <form 
              onSubmit={handleSearch}
              className="group relative"
            >
              <div className="flex items-center bg-muted/40 border border-border/50 rounded-full px-4 md:px-6 py-2.5 hover:bg-muted/60 hover:border-primary/20 transition-all focus-within:bg-muted focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5">
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary mr-3 shrink-0 transition-colors" />
                <input 
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari riset atau tanya AI..."
                  className="bg-transparent border-none outline-none text-foreground text-sm md:text-base w-full font-medium placeholder:text-muted-foreground/60 focus:ring-0"
                />
                
                <div className="hidden md:flex items-center gap-2 ml-2">
                  {query && (
                    <button 
                      type="button" 
                      onClick={() => setQuery('')}
                      className="p-1 hover:bg-foreground/10 rounded-full text-muted-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="px-2 py-1 bg-background/50 border border-border/50 rounded-lg text-[10px] font-black text-muted-foreground/50 tracking-tighter select-none">
                    <Command className="inline w-2 h-2 mr-0.5" /> K
                  </div>
                </div>
              </div>
            </form>

            {/* Combined Suggestions & History Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-card backdrop-blur-3xl border border-border/60 rounded-[2rem] overflow-hidden shadow-2xl z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
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
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Pencarian Terakhir
                      </span>
                      {history.length > 0 && (
                        <button 
                          onClick={clearHistory}
                          className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                          Bersihkan
                        </button>
                      )}
                    </div>
                    {history.length > 0 ? (
                      <div className="py-2 px-2">
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQuery(h);
                              saveToHistory(h);
                              setShowDropdown(false);
                              router.push(`/search?q=${encodeURIComponent(h)}&provider=${provider}`);
                            }}
                            className="w-full text-left px-4 py-3 text-inherit hover:bg-primary/5 transition-all flex items-center justify-between group rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <Search className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
                              <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">{h}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                          </button>
                        ))}
                      </div>
                    ) : query.length < 3 && (
                      <div className="px-5 py-12 text-center space-y-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto border border-primary/10">
                          <Sparkles className="w-5 h-5 text-primary/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground/40">Menunggu ide risetmu...</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Ketik topik untuk saran AI</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="hidden lg:flex items-center bg-muted/30 border border-border/50 rounded-full p-1 gap-1">
              <Link 
                href="/library"
                className="flex items-center px-4 py-2 hover:bg-muted/50 text-foreground rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <BookMarked className="w-3.5 h-3.5 text-primary mr-2" />
                Library
              </Link>
              <div className="w-px h-4 bg-border/50" />
              <ThemeToggle />
            </div>

            <div className="lg:hidden">
              <ThemeToggle />
            </div>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 bg-primary/5 border border-primary/10 rounded-full hover:bg-primary/10 transition-all active:scale-95">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-md">
                    {user.name?.[0].toUpperCase()}
                  </div>
                </button>

                <div className="absolute top-full right-0 mt-3 w-64 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[120]">
                  <div className="bg-card backdrop-blur-3xl border border-border/60 rounded-[2rem] p-2 shadow-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/40">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Information</p>
                      <p className="text-sm font-bold truncate mt-1 text-foreground">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link href="/library" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-colors group">
                        <BookMarked className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <span className="text-xs font-bold uppercase tracking-tight">Koleksi Saya</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors group"
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
                className="flex items-center gap-2 px-6 py-2.5 md:py-3 bg-foreground text-background hover:opacity-90 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
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
