'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-48 px-6 pb-24">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-muted/50 border border-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Keamanan Data</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Privasi.</h1>
          
          <div className="prose prose-invert max-w-none opacity-60">
            <p className="text-xl font-medium leading-relaxed">
              Kebijakan Privasi JurnalStar AI dalam melindungi data riset Anda.
            </p>
            <div className="mt-12 space-y-12">
              <section>
                <h3 className="text-foreground font-black uppercase tracking-widest text-sm mb-4">1. Data yang Kami Kumpulkan</h3>
                <p className="text-sm font-bold leading-relaxed">
                  Kami mengumpulkan query pencarian untuk meningkatkan akurasi AI. Data identitas personal hanya disimpan jika Anda mendaftar akun untuk Workspace.
                </p>
              </section>
              <section>
                <h3 className="text-foreground font-black uppercase tracking-widest text-sm mb-4">2. Keamanan Riset</h3>
                <p className="text-sm font-bold leading-relaxed">
                  Semua bookmark dan history pencarian dalam Workspace bersifat privat dan tidak akan dibagikan kepada pihak ketiga.
                </p>
              </section>
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
