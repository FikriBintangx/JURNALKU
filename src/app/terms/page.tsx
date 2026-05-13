'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-48 px-6 pb-24">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-muted/50 border border-border px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Legal & Kebijakan</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Syarat.</h1>
          
          <div className="prose prose-invert max-w-none opacity-60">
            <p className="text-xl font-medium leading-relaxed">
              Syarat dan Ketentuan Penggunaan Layanan JurnalStar AI.
            </p>
            <div className="mt-12 space-y-12">
              <section>
                <h3 className="text-foreground font-black uppercase tracking-widest text-sm mb-4">1. Penggunaan Layanan</h3>
                <p className="text-sm font-bold leading-relaxed">
                  Layanan ini disediakan untuk tujuan riset akademis dan personal. Penggunaan bot atau scraping otomatis tanpa izin tertulis dilarang keras untuk menjaga integritas provider data kami.
                </p>
              </section>
              <section>
                <h3 className="text-foreground font-black uppercase tracking-widest text-sm mb-4">2. Hak Kekayaan Intelektual</h3>
                <p className="text-sm font-bold leading-relaxed">
                  Semua jurnal dan publikasi yang diakses melalui JurnalStar adalah milik masing-masing penulis dan penerbit. JurnalStar hanya menyediakan indeks dan akses sesuai dengan kebijakan Open Access.
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
