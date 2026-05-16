'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle, Search, 
  Library, Sparkles, Moon, Sun
} from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import Image from 'next/image';
import { useTheme } from 'next-themes';

function LoginContent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
      if (!res.ok) throw new Error(data.message || 'Email atau kata sandi salah');

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
      if (!res.ok) throw new Error(data.message || 'Login Google gagal');

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = resolvedTheme || theme || 'light';

  if (!mounted) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background overflow-hidden selection:bg-foreground selection:text-background text-foreground">
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 60px white inset !important;
          -webkit-text-fill-color: black !important;
        }
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover, 
        .dark input:-webkit-autofill:focus, 
        .dark input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 60px #0a0a0a inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>

      {/* Theme Toggle */}
      <div className="absolute top-10 right-10 z-50">
        <button
          onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
          className="p-4 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-full transition-all active:scale-90"
        >
          {currentTheme === 'dark' ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* LEFT PANEL */}
      <div className="hidden md:flex md:w-[42%] bg-background relative overflow-hidden flex-col items-center justify-center border-r border-foreground/10">
        <div className="absolute inset-0 opacity-[0.08] select-none pointer-events-none">
          <div className="absolute inset-0 flex flex-col justify-around py-20 -space-y-16">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: "-10%" }}
                animate={{ x: "-30%" }}
                transition={{ duration: 50, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                className="whitespace-nowrap flex gap-16 rotate-[-15deg] font-black text-[14rem] tracking-tighter uppercase text-foreground"
              >
                {[...Array(6)].map((_, j) => (
                  <span key={j} className="[-webkit-text-stroke:6px_currentColor]">JURNALKU</span>
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-16"
        >
          <div className="w-full max-w-[640px] px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTheme}
                initial={{ opacity: 0, filter: "blur(20px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(20px)" }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={currentTheme === "dark" ? "/assets/logo/logojurnalkudarkmode.png" : "/assets/logo/logojurnalkulightmode.png"}
                  alt="JURNALKU Logo"
                  width={800}
                  height={800}
                  priority
                  unoptimized
                  className="object-contain w-full h-auto select-none pointer-events-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[14px] font-black tracking-[1.2em] uppercase opacity-40">STAR.CO</span>
            <span className="text-[11px] font-black tracking-[1em] uppercase opacity-10">GEN 2.0</span>
          </div>
        </motion.div>

        <div className="absolute bottom-16 left-0 w-full flex justify-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-foreground">
          <div className="flex items-center gap-3"><Search className="w-3 h-3" /> CARI</div>
          <div className="flex items-center gap-3"><Library className="w-3 h-3" /> PERPUSTAKAAN</div>
          <div className="flex items-center gap-3"><Sparkles className="w-3 h-3" /> MESIN AI</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 lg:p-32 relative bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-lg space-y-16"
        >
          <div className="space-y-6">
            <h1 className="text-6xl font-black uppercase tracking-tightest italic leading-tight text-foreground">Selamat <br /> Datang</h1>
            <p className="text-muted-foreground text-[12px] uppercase tracking-[0.5em] font-black opacity-40 italic">Lanjutkan perjalanan riset Anda</p>
          </div>

          <div className="space-y-10">
            <AnimatePresence mode="wait">
              {registered && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-500/5 border border-emerald-500/10 p-6 flex items-center gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest italic">Berhasil! Anda sekarang dapat masuk.</p>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/5 border border-red-500/10 p-6 flex items-center gap-4"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-500 text-[10px] uppercase font-black tracking-widest italic">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 ml-2 text-foreground">Alamat Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 transition-all group-focus-within:text-foreground group-focus-within:scale-110 z-10" />
                    <input 
                      type="email"
                      placeholder="MASUKKAN EMAIL ANDA"
                      className="w-full bg-background border-2 border-foreground/10 px-14 py-6 outline-none transition-all focus:border-foreground/40 font-black text-[12px] placeholder:text-muted-foreground/20 tracking-widest text-foreground shadow-sm relative z-0"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 text-foreground">Kata Sandi</label>
                    <Link href="#" onClick={(e) => e.preventDefault()} className="text-[10px] font-black uppercase tracking-[0.2em] opacity-20 hover:opacity-100 transition-opacity text-foreground">Lupa?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 transition-all group-focus-within:text-foreground group-focus-within:scale-110 z-10" />
                    <input 
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-background border-2 border-foreground/10 px-14 py-6 outline-none transition-all focus:border-foreground/40 font-black text-[12px] placeholder:text-muted-foreground/20 tracking-widest text-foreground shadow-sm relative z-0"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-foreground border-2 border-foreground py-7 font-black text-[12px] uppercase tracking-[0.8em] transition-all disabled:opacity-50 text-background flex items-center justify-center gap-4 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-3 duration-300" />
                  </>
                )}
              </button>
            </form>

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-foreground/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-8 text-muted-foreground font-black tracking-[0.5em] opacity-40">atau</span></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-background border-2 border-foreground/10 text-foreground py-7 font-black text-[12px] uppercase tracking-[0.5em] flex items-center justify-center gap-5 transition-all active:scale-[0.97] hover:bg-foreground/[0.03] disabled:opacity-50 group">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Akun Google</span>
            </button>

            <p className="text-center text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-60">Belum punya akun? <Link href="/register" className="text-foreground border-b-2 border-foreground/20 hover:border-foreground transition-colors ml-3 pb-1">Buat Akun</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
