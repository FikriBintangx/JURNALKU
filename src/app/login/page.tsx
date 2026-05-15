'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Command, 
  Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function LoginContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logoSrc = mounted && resolvedTheme === 'light' ? '/logo-light.png' : '/logo-dark.png';
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

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth belum dikonfigurasi.");
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google login failed');

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background relative z-10">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md"
      >
        {registered && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            Pendaftaran berhasil! Silakan masuk.
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <div className="space-y-12">
          <div className="text-left">
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
              Masuk <br /> Ke Akun
            </h1>
            <p className="text-muted-foreground mt-6 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
              Selamat datang kembali di JurnalStar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Alamat Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="NAMA@EMAIL.COM"
                  className="w-full bg-foreground border-2 border-foreground rounded-none py-6 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Kata Sandi</label>
                <Link href="#" onClick={(e) => e.preventDefault()} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest transition-colors opacity-50 cursor-not-allowed pointer-events-none">Lupa?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••••••"
                  className="w-full bg-foreground border-2 border-foreground rounded-none py-6 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-6 rounded-none font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-foreground/10"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase">
              <span className="bg-background px-6 text-muted-foreground font-black tracking-[0.4em]">Atau</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-background border-2 border-foreground text-foreground py-6 rounded-none font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:bg-foreground hover:text-background disabled:opacity-50 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>

          <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            Belum punya akun? {' '}
            <Link href="/register" className="text-foreground border-b-2 border-foreground/20 hover:border-foreground transition-colors ml-2">Daftar di sini</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden selection:bg-foreground selection:text-background">
      {/* Visual Side (40%) */}
      <div className="hidden md:flex md:w-[40%] bg-foreground relative overflow-hidden items-center justify-center border-r border-foreground/10">
        {/* Cinematic Animated Marquee Background */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none select-none">
          <div className="absolute inset-0 flex flex-col justify-around py-20 -space-y-16">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: i % 2 === 0 ? "-10%" : "-30%" }}
                animate={{ x: i % 2 === 0 ? "-30%" : "-10%" }}
                transition={{
                  duration: 25 + i * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "linear",
                }}
                className="whitespace-nowrap flex gap-16 rotate-[-15deg] font-black"
              >
                {[...Array(6)].map((_, j) => (
                  <span 
                    key={j} 
                    className={cn(
                      "text-[10rem] tracking-tightest uppercase leading-none px-4",
                      j % 2 === 0 
                        ? "text-background" 
                        : "text-transparent [-webkit-text-stroke:4px_rgba(255,255,255,0.6)]"
                    )}
                  >
                    JURNALKU
                  </span>
                ))}
              </motion.div>
            ))}
          </div>
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-transparent to-foreground opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground via-transparent to-foreground opacity-80" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-background w-28 h-28 flex items-center justify-center rounded-[3.5rem] mb-12 mx-auto shadow-[0_0_60px_rgba(255,255,255,0.15)] overflow-hidden p-6 relative">
              <Image 
                src={logoSrc} 
                alt="JurnalStar Logo" 
                fill 
                className="object-contain p-6"
                priority
              />
            </div>
            <h2 className="text-background text-7xl font-black uppercase tracking-tighter leading-[0.75] italic">Jurnal<br/>Star</h2>
            <div className="h-[3px] w-20 bg-background/20 mx-auto mt-12 mb-8" />
            <p className="text-background/40 text-[10px] uppercase tracking-[0.7em] font-black">Intelligence Engine</p>
          </motion.div>
        </div>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
