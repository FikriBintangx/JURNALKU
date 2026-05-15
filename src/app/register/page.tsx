'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, ArrowRight, Command, 
  Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Pendaftaran gagal');

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden selection:bg-foreground selection:text-background">
      {/* Visual Side (40%) */}
      <div className="hidden md:flex md:w-[40%] bg-foreground relative overflow-hidden items-center justify-center border-r border-foreground/10">
        {/* Cinematic Animated Marquee Background */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none">
          <div className="absolute inset-0 flex flex-col justify-around py-10 -space-y-32">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: i % 2 === 0 ? "-20%" : "-40%" }}
                animate={{ x: i % 2 === 0 ? "-40%" : "-20%" }}
                transition={{
                  duration: 20 + i * 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="whitespace-nowrap flex gap-12 rotate-[-20deg] font-black"
              >
                {[...Array(8)].map((_, j) => (
                  <span 
                    key={j} 
                    className={`text-[12rem] tracking-tightest uppercase leading-none ${
                      j % 2 === 0 ? "text-background" : "text-transparent border-white/40 border-[3px] [-webkit-text-stroke:2px_rgba(255,255,255,0.5)]"
                    }`}
                  >
                    JURNALKU
                  </span>
                ))}
              </motion.div>
            ))}
          </div>
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-transparent to-foreground opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground via-transparent to-foreground opacity-60" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-background w-24 h-24 flex items-center justify-center rounded-[3rem] mb-12 mx-auto shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden p-5">
              <img src="/logo.png" alt="JurnalStar Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-background text-7xl font-black uppercase tracking-tighter leading-[0.75] italic">Jurnal<br/>Star</h2>
            <div className="h-[3px] w-20 bg-background/20 mx-auto mt-12 mb-8" />
            <p className="text-background/40 text-[10px] uppercase tracking-[0.7em] font-black">Intelligence Engine</p>
          </motion.div>
        </div>
      </div>

      {/* Form Side (60%) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}

          <div className="space-y-10">
            <div className="text-left">
              <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
                Daftar <br /> Akun Baru
              </h1>
              <p className="text-muted-foreground mt-6 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                Mulai perjalanan riset cerdas Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="NAMA PENELITI"
                    className="w-full bg-foreground border-2 border-foreground rounded-none py-5 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Alamat Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="EMAIL@RESEARCH.IO"
                    className="w-full bg-foreground border-2 border-foreground rounded-none py-5 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Kata Sandi</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                    <input 
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-foreground border-2 border-foreground rounded-none py-5 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Konfirmasi</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40 group-focus-within:text-background transition-colors z-10" />
                    <input 
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-foreground border-2 border-foreground rounded-none py-5 pl-12 pr-4 text-background focus:bg-foreground/90 transition-all placeholder:text-background/20 font-bold text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background py-6 rounded-none font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border-2 border-foreground hover:bg-background hover:text-foreground disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Daftar Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
              Sudah punya akun? {' '}
              <Link href="/login" className="text-foreground border-b-2 border-foreground/20 hover:border-foreground transition-colors ml-2">Masuk di sini</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
