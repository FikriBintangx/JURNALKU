'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark, checkIsBookmarked } from '@/lib/actions';
import { Journal } from '@/types/journal';
import { cn } from '@/lib/utils';

interface Props {
  journal: Journal;
  variant?: 'icon' | 'full';
  className?: string;
}

export default function BookmarkButton({ journal, variant = 'icon', className }: Props) {
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
      alert("Gagal menyimpan bookmark.");
    }
  };

  if (variant === 'full') {
    return (
      <button 
        onClick={handleToggle}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-medium border flex items-center justify-center space-x-2 transition-all active:scale-95",
          isBookmarked 
            ? "bg-primary/20 text-primary border-primary/30" 
            : "bg-muted text-foreground border-border/50",
          className
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
        "p-2.5 rounded-xl transition-all border group backdrop-blur-md",
        isBookmarked 
          ? "bg-primary/10 text-primary border-primary/30" 
          : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground",
        className
      )}
      title={isBookmarked ? "Hapus dari Koleksi" : "Simpan ke Koleksi"}
    >
      <Bookmark className={cn("w-4 h-4 transition-transform group-hover:scale-110", isBookmarked && "fill-current")} />
    </button>
  );
}
