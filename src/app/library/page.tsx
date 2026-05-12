import { getBookmarks } from '@/lib/actions';
import JournalCard from '@/components/JournalCard';
import Navbar from '@/components/Navbar';
import { Library as LibraryIcon, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function LibraryPage() {
  const bookmarks = await getBookmarks();

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
            <p className="text-muted-foreground font-medium text-lg">
              Anda memiliki <span className="text-foreground font-bold">{bookmarks.length}</span> jurnal yang tersimpan.
            </p>
          </div>

          <Link 
            href="/library/literature-review"
            className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 hover:opacity-90 transition-all active:scale-95 shadow-xl"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Literature Review</span>
          </Link>
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookmarks.map((journal) => (
              <JournalCard key={journal.paperId} journal={journal} />
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
    </div>
  );
}
