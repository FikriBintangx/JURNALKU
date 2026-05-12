'use client';

import { Journal } from '@/types/journal';
import { Calendar, Users, Star, Sparkles, Scale, BookX, Search, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import BookmarkButton from './BookmarkButton';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import UnpaywallButton from './UnpaywallButton';
import { motion } from 'framer-motion';

interface Props {
  journal: Journal;
  index?: number;
}

export default function JournalCard({ journal, index = 0 }: Props) {
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
        alert("Maximum 3 journals for comparison.");
        return;
      }
      newList = [...list, journal.paperId];
    }
    localStorage.setItem('compare_list', JSON.stringify(newList));
    setIsComparing(!isComparing);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div className={cn(
        "mono-card mono-card-hover p-8 flex flex-col h-full relative transition-all duration-500",
        isComparing && "ring-4 ring-foreground/10 translate-y-[-8px]"
      )}>
        {/* Floating Actions */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          <button 
            onClick={toggleCompare}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all border",
              isComparing 
                ? "bg-foreground text-background border-foreground" 
                : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-foreground hover:text-background opacity-0 group-hover:opacity-100"
            )}
          >
            <Scale className="w-4 h-4" />
          </button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <BookmarkButton journal={journal} />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6 pr-20">
          <div className="bg-foreground text-background px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
            {journal.source === 'googlescholar' ? 'Scholar' : (journal.source || 'Semantic')}
          </div>
          {journal.isOpenAccess && (
            <div className="bg-background text-foreground border border-border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Open Access
            </div>
          )}
          {journal.doi && <UnpaywallButton doi={journal.doi} className="!py-1 !px-3 !text-[9px]" />}
        </div>

        {/* Title & Abstract */}
        <Link 
          href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`}
          className="space-y-4 flex-grow mb-8"
        >
          <h3 className="text-xl md:text-2xl font-black leading-[1.1] tracking-tight transition-colors">
            {journal.title}
          </h3>
          <p className="opacity-40 text-xs md:text-sm font-medium line-clamp-3 leading-relaxed">
            {journal.abstract || 'Deep neural research analysis required. Click to initialize AI summary and insight generation for this academic paper.'}
          </p>
        </Link>

        {/* Footer Metadata */}
        <div className="pt-6 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50">
                <Users className="w-4 h-4 opacity-40" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-30">Contributors</span>
                <span className="text-[11px] font-bold truncate italic max-w-[140px]">
                  {journal.authors && journal.authors.length > 0 
                    ? journal.authors.slice(0, 2).map(a => a.name).join(', ') + (journal.authors.length > 2 ? ' et al.' : '')
                    : 'Anonymous'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-30 block">Year</span>
                <span className="text-[11px] font-bold">{journal.year || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-30 block">Citations</span>
                <div className="flex items-center justify-end">
                  <Star className="w-3 h-3 mr-1 opacity-50" />
                  <span className="text-[11px] font-black">{(journal.citationCount || journal.citations || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Link 
            href={`/journal/${journal.paperId}?source=${journal.source || 'semantic'}`}
            className="w-full mono-button py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group/btn"
          >
            <span>Analyze Intelligence</span>
            <Sparkles className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
