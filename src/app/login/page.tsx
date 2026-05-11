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
          className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5" />
          Pendaftaran berhasil! Silakan masuk ke akun Anda.
        </motion.div>
      )}

      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-500/20">
            <Key className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Masuk untuk sinkronisasi koleksi riset Anda.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-3"
          >
            <LogIn className="w-4 h-4" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com"
                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kata Sandi</label>
              <Link href="/forgot-password" className="text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-widest">Lupa?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>MASUK</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

          <p className="mt-10 text-center text-sm text-slate-500 font-medium">
            Belum punya akun? {' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline underline-offset-4 tracking-tight">Daftar Sekarang</Link>
          </p>
        </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative pt-32 pb-20 flex items-center justify-center px-4">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-indigo-600" />}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
