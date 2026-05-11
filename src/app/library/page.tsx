import { getBookmarks } from '@/lib/actions';
import JournalCard from '@/components/JournalCard';
import Navbar from '@/components/Navbar';
import { Library as LibraryIcon, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function LibraryPage() {
  const bookmarks = await getBookmarks();

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center mb-2">
              <LibraryIcon className="w-8 h-8 mr-4 text-indigo-400" />
              Koleksi Saya
            </h1>
            <p className="text-slate-400">
              Anda memiliki {bookmarks.length} jurnal yang disimpan dalam koleksi.
            </p>
          </div>

          <Link 
            href="/library/literature-review"
            className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl font-bold flex items-center space-x-3 transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>AI Literature Review</span>
          </Link>
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((journal) => (
              <JournalCard key={journal.paperId} journal={journal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <BookOpen className="w-12 h-12 text-slate-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Koleksi Anda kosong</h2>
              <p className="text-slate-400 max-w-sm">
                Mulai cari dan simpan jurnal untuk membangun perpustakaan riset pribadi Anda.
              </p>
            </div>
            <a 
              href="/" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Mulai Menjelajah
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
