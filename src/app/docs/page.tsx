'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-48 px-6 pb-24">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-muted/50 border border-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Dokumentasi Sistem</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Dokumen.</h1>
          
          <div className="prose prose-invert max-w-none opacity-60">
            <p className="text-xl font-medium leading-relaxed">
              Selamat datang di pusat dokumentasi JurnalStar AI. Kami sedang memperbarui panduan penggunaan untuk memberikan pengalaman riset yang lebih baik.
            </p>
            <div className="mt-12 p-8 border border-border rounded-[2rem] bg-muted/20">
              <h3 className="text-foreground font-black uppercase tracking-widest text-sm mb-4">Segera Hadir</h3>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-wider list-none p-0">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> Panduan API Semantik</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> Integrasi Workspace</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> Tutorial Ringkasan Neural</li>
              </ul>
            </div>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-primary transition-colors mt-12">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
