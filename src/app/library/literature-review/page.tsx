'use client';

import { useState, useEffect } from 'react';
import { getBookmarks } from '@/lib/actions';
import { Journal } from '@/types/journal';
import Navbar from '@/components/Navbar';
import { BookOpen, Sparkles, Loader2, ArrowLeft, Brain, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function LiteratureReviewPage() {
  const [bookmarks, setBookmarks] = useState<Journal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchBookmarks() {
      setLoading(true);
      const data = await getBookmarks();
      // Ensure the return type matches Journal[] or transform it
      setBookmarks(data as unknown as Journal[]);
      setLoading(false);
    }
    fetchBookmarks();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    setGenerating(true);
    setReview(null);
    try {
      const papers = bookmarks.filter(b => selectedIds.includes(b.paperId));
      const res = await fetch('/api/literature-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers }),
      });
      const data = await res.json();
      setReview(data.review);
    } catch (e) {
      console.error(e);
      setReview("Gagal menghasilkan tinjauan pustaka. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 pt-24">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/library" className="p-2 hover:bg-white/5 rounded-full text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <GraduationCap className="w-8 h-8 mr-4 text-indigo-400" />
            AI Literature Review
          </h1>
        </div>

        {!review ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                  Cara Kerja
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pilih jurnal-jurnal dari koleksi Anda, dan AI akan mensintesis temuan mereka menjadi satu tinjauan pustaka formal dalam Bahasa Indonesia.
                </p>
                <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10px] text-indigo-300 font-bold uppercase tracking-widest text-center">
                  {selectedIds.length} Jurnal Terpilih
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={selectedIds.length === 0 || generating}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Buat Tinjauan Pustaka'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-white font-bold mb-4">Pilih dari Koleksi Anda</h3>
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
              ) : bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {bookmarks.map((book) => (
                    <button 
                      key={book.paperId}
                      onClick={() => toggleSelect(book.paperId)}
                      className={`flex items-start text-left p-4 rounded-2xl border transition-all ${
                        selectedIds.includes(book.paperId) 
                          ? 'bg-indigo-600/20 border-indigo-500/50' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`mt-1 mr-4 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedIds.includes(book.paperId) ? 'bg-indigo-600 border-indigo-400' : 'border-white/20'
                      }`}>
                        {selectedIds.includes(book.paperId) && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-grow">
                        <p className="text-white font-bold text-sm line-clamp-1">{book.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase mt-1">
                          {book.year} • {book.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-slate-500">Belum ada jurnal di koleksi Anda.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="glass-card p-10 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <GraduationCap className="w-32 h-32 text-indigo-400" />
               </div>
               
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Brain className="w-6 h-6 mr-3 text-indigo-400" />
                    Hasil Tinjauan Pustaka AI
                  </h2>
                  <button 
                    onClick={() => setReview(null)}
                    className="text-xs text-indigo-400 font-bold hover:text-indigo-300"
                  >
                    Ulangi Pemilihan
                  </button>
               </div>

               <div className="prose prose-invert max-w-none text-slate-300 leading-loose whitespace-pre-wrap text-lg">
                 {review}
               </div>

               <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest italic">
                    Analisis AI Berdasarkan {selectedIds.length} Paper Terpilih
                  </p>
                  <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all">
                    Salin Teks
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
