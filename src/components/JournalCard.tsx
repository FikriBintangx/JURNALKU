'use client';

import { Journal } from '@/types/journal';
import { Calendar, Users, Star, FileText, Sparkles, ExternalLink, Scale, Target, BookX, Search } from 'lucide-react';
import Link from 'next/link';
import BookmarkButton from './BookmarkButton';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RelevanceScore } from './AI/RelevanceScore';
import UnpaywallButton from './UnpaywallButton';

interface Props {
  journal: Journal;
}

export default function JournalCard({ journal }: Props) {
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const checkCompare = () => {
      const list = JSON.parse(localStorage.getItem('compare_list') || '[]');
      setIsComparing(list.includes(journal.paperId));
    };
    checkCompare();
    window.addEventListener('storage', checkCompare);
    return () => window.removeEventListener('storage', checkCompare);
  }, [journal.paperId]);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const list = JSON.parse(localStorage.getItem('compare_list') || '[]');
    let newList;
    if (isComparing) {
      newList = list.filter((id: string) => id !== journal.paperId);
    } else {
      if (list.length >= 3) {
        alert("Maksimal 3 jurnal untuk perbandingan.");
        return;
      }
      newList = [...list, journal.paperId];
    }
    localStorage.setItem('compare_list', JSON.stringify(newList));
    setIsComparing(!isComparing);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 md:p-6 flex flex-col h-full border transition-all hover:border-primary/50 relative group/card",
      isComparing ? "border-primary/40 bg-primary/5" : "border-border"
    )}>
      {/* Compare Selector */}
      <button 
        onClick={toggleCompare}
        className={cn(
          "absolute -top-2 -right-2 p-2 rounded-xl transition-all shadow-xl z-10 border",
          isComparing 
            ? "bg-primary text-white border-primary/50 scale-110" 
            : "bg-card text-muted-foreground border-border hover:text-foreground"
        )}
        title="Pilih untuk bandingkan"
      >
        <Scale className="w-4 h-4" />
      </button>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {journal.source && (
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border",
            journal.source === 'openalex' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : 
            journal.source === 'googlescholar' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
            "bg-primary/10 text-primary border-primary/20"
          )}>
            {journal.source === 'openalex' ? <BookX className="w-3 h-3" /> : 
             journal.source === 'googlescholar' ? <Search className="w-3 h-3" /> : 
             <Sparkles className="w-3 h-3" />}
            {journal.source === 'googlescholar' ? 'Google Scholar' : journal.source}
          </div>
        )}
        {journal.isOpenAccess && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm">
            Akses Terbuka
          </div>
        )}
        {/* Unpaywall PDF Finder */}
        {journal.doi && <UnpaywallButton doi={journal.doi} />}
        
        <div className="bg-muted text-muted-foreground px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-border shadow-sm truncate max-w-[120px]">
          {journal.venue || 'Journal'}
        </div>
      </div>

      <Link href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`} className="group/title flex-grow">
        <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover/title:text-primary transition-colors mb-3 leading-tight">
          {journal.title}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-grow leading-relaxed">
        {journal.abstract || 'Abstrak tidak tersedia. Klik untuk melihat detail lebih lanjut.'}
      </p>

      {/* Metadata Bottom Section */}
      <div className="space-y-4 pt-5 border-t border-border mt-auto">
        <div className="flex items-center text-xs text-foreground font-medium bg-muted p-2 rounded-xl border border-border">
          <Users className="w-3.5 h-3.5 mr-2 text-primary shrink-0" />
          <span className="truncate">
            {journal.authors?.map(a => a.name).join(', ') || 'Penulis Anonim'}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-muted-foreground font-bold">
            <div className="flex items-center bg-muted px-2 py-1 rounded-lg border border-border">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              {journal.year || 'N/A'}
            </div>
            <div className="flex items-center bg-muted px-2 py-1 rounded-lg border border-border">
              <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              {(journal.citationCount || journal.citations || 0).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton journal={journal} />
            <Link 
              href={`/journal/${journal.paperId}?source=${journal.source || 'semantic'}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
            >
              <span>AI</span>
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>

  );
}
