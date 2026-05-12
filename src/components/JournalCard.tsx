'use client';

import { Journal } from '@/types/journal';
import { Calendar, Users, Star, Sparkles, Scale, BookX, Search, ArrowRight, Share2, Zap, Flame } from 'lucide-react';
import Link from 'next/link';
import BookmarkButton from './BookmarkButton';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import UnpaywallButton from './UnpaywallButton';
import { motion } from 'framer-motion';

interface Props {
  journal: Journal;
  index?: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export default function JournalCard({ journal, index = 0, isSelected = false, onSelect }: Props) {
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
        "mono-card p-8 md:p-10 flex flex-col h-full relative transition-all duration-500",
        isComparing && "ring-2 ring-foreground translate-y-[-8px]",
        isSelected && "ring-2 ring-foreground"
      )}>
        {/* Selection Dot */}
        {onSelect && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(journal.paperId);
            }}
            className={cn(
              "absolute top-6 left-6 md:top-8 md:left-8 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center z-20",
              isSelected 
                ? "bg-white border-foreground scale-110" 
                : "bg-white border-border hover:border-foreground"
            )}
          >
            {isSelected && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
          </button>
        )}

        {/* Floating Actions */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2 z-10">
          <button 
            onClick={toggleCompare}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
              isComparing 
                ? "bg-foreground text-background border-foreground shadow-lg" 
                : "bg-background/80 backdrop-blur-sm text-foreground-muted border-border hover:bg-foreground hover:text-background hover:border-foreground"
            )}
            title="Tambah ke Komparasi"
          >
            <Scale className="w-4 h-4" />
          </button>
          <div className="transition-opacity">
            <BookmarkButton journal={journal} />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-8 pr-20">
          {/* Source badge */}
          <div className="bg-foreground text-background px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
            {journal.source === 'googlescholar' ? 'Scholar' : (journal.source || 'Semantic')}
          </div>
          
          {/* NEW badge — current or last year */}
          {journal.isNew && (
            <div className="bg-foreground text-background px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ring-1 ring-foreground/20 animate-pulse">
              ✦ NEW
            </div>
          )}

          {/* RISING badge — high velocity, recent paper */}
          {journal.isRising && !journal.isNew && (
            <div className="bg-foreground/5 text-foreground border border-foreground/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-3 h-3 fill-current" />
              Rising
            </div>
          )}

          {/* ARIS score */}
          {journal.relevanceScore && (
            <div className="bg-transparent text-foreground border border-border-strong px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-foreground" />
              ARIS {journal.relevanceScore}%
            </div>
          )}

          {/* Trending — legacy trendScore signal */}
          {!journal.isRising && (journal.trendScore || 0) > 10 && (
            <div className="bg-foreground/5 text-foreground border border-border-strong px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3 fill-current" />
              Trending
            </div>
          )}

          {journal.isOpenAccess && (
            <div className="bg-transparent text-foreground-secondary border border-border px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Open Access
            </div>
          )}
        </div>

        {/* Title & Abstract */}
        <Link 
          href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`}
          className="space-y-4 flex-grow mb-8"
        >
          <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-[1.1] tracking-tighter text-foreground group-hover:opacity-70 transition-all">
            {journal.title}
          </h3>
          <p className="text-foreground text-sm md:text-base font-medium line-clamp-3 leading-relaxed">
            {journal.abstract || 'Deep neural research analysis required. Click to initialize AI summary and insight generation for this academic paper.'}
          </p>
        </Link>

        {/* Footer Metadata */}
        <div className="pt-8 border-t border-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                <Users className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] mb-0.5 font-bold text-foreground-muted uppercase tracking-widest">Contributors</span>
                <span className="text-xs font-bold truncate max-w-[140px] text-foreground">
                  {journal.authors && journal.authors.length > 0 
                    ? journal.authors.slice(0, 2).map(a => a.name).join(', ') + (journal.authors.length > 2 ? ' et al.' : '')
                    : 'Anonymous'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[9px] mb-0.5 font-bold text-foreground-muted uppercase tracking-widest block">Year</span>
                <span className={cn(
                  "text-xs font-black",
                  journal.isNew ? "text-foreground" : "text-foreground"
                )}>
                  {journal.year || 'N/A'}
                  {journal.isNew && <span className="ml-1 text-[8px] font-black opacity-60">●</span>}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] mb-0.5 font-bold text-foreground-muted uppercase tracking-widest block">Citations</span>
                <div className="flex items-center justify-end">
                  <Star className="w-3 h-3 mr-1 text-foreground-muted" />
                  <span className="text-xs font-bold text-foreground">{(journal.citationCount || journal.citations || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Link 
            href={`/journal/${journal.paperId}?source=${journal.source || 'semantic'}`}
            className="w-full btn-primary h-12 md:h-14 group/btn shadow-md"
          >
            <span className="text-[11px] tracking-[0.15em]">Analyze Intelligence</span>
            <Sparkles className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
