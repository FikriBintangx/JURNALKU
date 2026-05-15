'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Command, 
  Layout, Loader2, Key, CheckCircle2 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase Auth belum dikonfigurasi.");
      }
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
          Pendaftaran berhasil! Silakan masuk.
        </motion.div>
      )}

      <div className="mono-card p-8 md:p-12 shadow-2xl shadow-foreground/5 relative overflow-hidden border-2 border-foreground/5">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Command className="w-24 h-24" />
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-foreground text-background mb-6 shadow-xl">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Masuk ke Akun</h1>
          <p className="text-muted-foreground mt-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            Selamat datang kembali di JurnalStar
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
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="nama@email.com"
                className="w-full bg-muted/50 border-2 border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:bg-background focus:border-foreground/20 transition-all placeholder:text-muted-foreground/30 font-bold text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Kata Sandi</label>
              <Link href="/forgot-password" className="text-[9px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Lupa?</Link>
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
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-foreground/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-4 text-muted-foreground font-black tracking-widest">Atau masuk dengan</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-background border-2 border-border text-foreground py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-foreground hover:text-background disabled:opacity-50 group"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        <p className="mt-12 text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          Belum punya akun? {' '}
          <Link href="/register" className="text-foreground border-b-2 border-foreground/20 hover:border-foreground transition-colors ml-2">Daftar di sini</Link>
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
