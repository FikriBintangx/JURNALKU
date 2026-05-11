'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark, checkIsBookmarked } from '@/lib/actions';
import { Journal } from '@/types/journal';
import { cn } from '@/lib/utils';

interface Props {
  journal: Journal;
  variant?: 'icon' | 'full';
}

export default function BookmarkButton({ journal, variant = 'icon' }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const bookmarked = await checkIsBookmarked(journal.paperId);
      setIsBookmarked(bookmarked);
      setLoading(false);
    }
    init();
  }, [journal.paperId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    setIsBookmarked(!isBookmarked);
    
    try {
      const result = await toggleBookmark(journal);
      setIsBookmarked(result.bookmarked);
    } catch (error) {
      // Revert if error
      setIsBookmarked(isBookmarked);
      alert("Gagal menyimpan bookmark. Pastikan database Anda sudah terhubung.");
    }
  };

  if (variant === 'full') {
    return (
      <button 
        onClick={handleToggle}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-medium border flex items-center justify-center space-x-2 transition-all active:scale-95",
          isBookmarked 
            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/5"
        )}
      >
        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      className={cn(
        "p-2 rounded-lg transition-all border group",
        isBookmarked 
          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
          : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/5 hover:text-white"
      )}
      title={isBookmarked ? "Hapus dari Koleksi" : "Simpan ke Koleksi"}
    >
      <Bookmark className={cn("w-4 h-4 transition-transform group-hover:scale-110", isBookmarked && "fill-current")} />
    </button>
  );
}
