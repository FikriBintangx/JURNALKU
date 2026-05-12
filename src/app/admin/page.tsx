"use client";

import React, { useState } from 'react';
import { ShieldAlert, Key, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleInjectKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !apiKey) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password, apiKey })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, type: 'success' });
        setApiKey(''); // Kosongkan setelah berhasil
      } else {
        setMessage({ text: data.error || 'Terjadi kesalahan sistem', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Koneksi ke server gagal', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-slate-900 font-sans">
      <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-bold tracking-widest uppercase">Kembali</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl"
      >
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-2">Admin Terminal</h1>
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase">Emergency API Key Injector</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-start space-x-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleInjectKey} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Sandi Sistem (Admin)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan sandi akses..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Google API Key Baru</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-slate-900"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2 ml-2">Key baru akan dimasukkan ke dalam rotasi kunci sistem secara otomatis.</p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !password || !apiKey}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-widest uppercase rounded-xl py-4 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Inject API Key System</span>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
