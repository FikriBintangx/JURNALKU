'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, LogIn, ArrowRight, Command, 
  Layout, Loader2, Key, CheckCircle2 
} from 'lucide-react';
import Navbar from '@/components/Navbar';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Email atau password salah');

      // Refresh page to update session
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {registered && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5" />
          Registration successful! Please log in.
        </motion.div>
      )}

      <div className="mono-card p-8 md:p-12 shadow-2xl shadow-foreground/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Command className="w-24 h-24" />
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-foreground text-background mb-6 shadow-xl">
            <Key className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Access Terminal</h1>
          <p className="text-muted-foreground mt-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            Initialize research session
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <LogIn className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Identity Endpoint</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="EMAIL@RESEARCH.IO"
                className="w-full bg-muted/50 border-2 border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:bg-background focus:border-foreground/20 transition-all placeholder:text-muted-foreground/30 font-bold text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Access Secret</label>
              <Link href="/forgot-password" className="text-[9px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Reset?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-muted/50 border-2 border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:bg-background focus:border-foreground/20 transition-all placeholder:text-muted-foreground/30 font-bold text-sm outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-50 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Execute Entry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-12 text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          No credentials? {' '}
          <Link href="/register" className="text-foreground border-b-2 border-foreground/20 hover:border-foreground transition-colors ml-2">Request Access</Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden flex items-center justify-center p-6">
      {/* Premium Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-foreground/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-foreground/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
          <LoginContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
