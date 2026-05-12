'use client';

import { getBookmarks, addToWorkspaceCollection } from '@/lib/actions';
import JournalCard from '@/components/JournalCard';
import Navbar from '@/components/Navbar';
import { Library as LibraryIcon, BookOpen, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Journal } from '@/types/journal';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<Journal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchBookmarks() {
      setLoading(true);
      try {
        const data = await getBookmarks();
        setBookmarks(data);
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === bookmarks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookmarks.map(b => b.paperId));
    }
  };

  const handleAddToWorkspace = async () => {
    if (selectedIds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const result = await addToWorkspaceCollection(selectedIds);
      if (result.success) {
        setShowSuccess(true);
        setSelectedIds([]);
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/workspace');
        }, 2000);
      } else {
        alert(result.error || 'Gagal menambahkan ke Workspace');
      }
    } catch (error) {
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-36 pb-20 text-foreground">
      <Navbar />
      
      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-muted px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border/50">
              <LibraryIcon className="w-3 h-3 text-primary" />
              <span>Personal Library</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
              Koleksi Saya
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground font-medium text-lg">
                Anda memiliki <span className="text-foreground font-bold">{bookmarks.length}</span> jurnal yang tersimpan.
              </p>
              {bookmarks.length > 0 && (
                <button 
                  onClick={toggleSelectAll}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                >
                  {selectedIds.length === bookmarks.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleAddToWorkspace}
              disabled={selectedIds.length === 0 || isSubmitting}
              className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 hover:opacity-90 transition-all active:scale-95 shadow-xl disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{showSuccess ? 'Berhasil Masuk!' : 'Masukan ke Workspace'}</span>
              {selectedIds.length > 0 && !showSuccess && (
                <span className="ml-2 bg-background/20 px-2 py-0.5 rounded text-[10px]">
                  {selectedIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-primary/30" />
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookmarks.map((journal, i) => (
              <JournalCard 
                key={journal.paperId} 
                journal={journal} 
                index={i}
                isSelected={selectedIds.includes(journal.paperId)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-10 glass-card rounded-[3rem] border-dashed border-border/60">
            <div className="w-24 h-24 bg-muted/50 rounded-[2.5rem] flex items-center justify-center border border-border/50">
              <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Koleksi Anda Masih Kosong</h2>
              <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                Simpan jurnal yang relevan untuk membangun basis pengetahuan riset Anda sendiri.
              </p>
            </div>
            <Link 
              href="/" 
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Cari Jurnal Sekarang
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-foreground text-background px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{selectedIds.length} Jurnal berhasil diimpor ke Workspace!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
