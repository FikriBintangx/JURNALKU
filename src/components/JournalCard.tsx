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
      "glass-card rounded-[2rem] p-6 flex flex-col h-full relative group/card",
      isComparing ? "border-primary/40 bg-primary/5 shadow-primary/5" : "border-border/40"
    )}>
      {/* Compare Selector - Simplified */}
      <button 
        onClick={toggleCompare}
        className={cn(
          "absolute -top-2 -right-2 p-2.5 rounded-xl transition-all shadow-xl z-10 border",
          isComparing 
            ? "bg-primary text-white border-primary/50" 
            : "bg-card text-muted-foreground border-border/50 hover:text-foreground opacity-0 group-hover/card:opacity-100"
        )}
        title="Bandingkan"
      >
        <Scale className="w-4 h-4" />
      </button>

      {/* Badges Row - Clean & Professional */}
      <div className="flex flex-wrap gap-2 mb-5">
        {journal.source && (
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm",
            journal.source === 'openalex' ? "bg-amber-500/5 text-amber-500/80 border-amber-500/10" : 
            journal.source === 'googlescholar' ? "bg-emerald-500/5 text-emerald-500/80 border-emerald-500/10" :
            "bg-primary/5 text-primary/80 border-primary/10"
          )}>
            {journal.source === 'openalex' ? <BookX className="w-3 h-3" /> : 
             journal.source === 'googlescholar' ? <Search className="w-3 h-3" /> : 
             <Sparkles className="w-3 h-3" />}
            {journal.source === 'googlescholar' ? 'Scholar' : journal.source}
          </div>
        )}
        {journal.isOpenAccess && (
          <div className="bg-emerald-500/5 text-emerald-500/80 border border-emerald-500/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
            Open Access
          </div>
        )}
        {/* Unpaywall PDF Finder */}
        {journal.doi && <UnpaywallButton doi={journal.doi} className="!py-1" />}
      </div>

      <Link href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`} className="group/title">
        <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover/title:text-primary transition-colors mb-3 leading-snug">
          {journal.title}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 font-medium leading-relaxed">
        {journal.abstract || 'Abstrak tidak tersedia. Klik untuk analisis AI mendalam.'}
      </p>

      {/* Metadata Section - Clean Layout */}
      <div className="mt-auto space-y-4 pt-5 border-t border-border/40">
        <div className="flex items-center text-[11px] font-bold text-muted-foreground">
          <Users className="w-3.5 h-3.5 mr-2 text-primary/50 shrink-0" />
          <span className="truncate italic">
            {journal.authors && journal.authors.length > 0 
              ? journal.authors.slice(0, 3).map(a => a.name).join(', ') + (journal.authors.length > 3 ? ' et al.' : '')
              : 'Penulis Anonim'}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase bg-muted/30 px-2 py-1 rounded-lg border border-border/30">
              <Calendar className="w-3 h-3 mr-1.5 opacity-50" />
              {journal.year || 'N/A'}
            </div>
            <div className="flex items-center text-[10px] font-black text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
              <Star className="w-3 h-3 mr-1.5" />
              {(journal.citationCount || journal.citations || 0).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <BookmarkButton journal={journal} />
            <Link 
              href={`/journal/${journal.paperId}?source=${journal.source || 'semantic'}`}
              className="bg-foreground text-background px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>AI</span>
              <Sparkles className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>

  );
}
