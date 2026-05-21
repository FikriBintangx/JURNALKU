'use client';

import { Journal } from '@/types/journal';
import { Calendar, Users, Star, Sparkles, Scale, BookX, Search, ArrowRight, Share2, Zap, Flame, FileDown } from 'lucide-react';
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
        "bg-card p-8 md:p-10 flex flex-col h-full relative transition-all duration-500 rounded-3xl border border-border/50 shadow-sm",
        isComparing && "ring-2 ring-card-foreground translate-y-[-8px]",
        isSelected && "ring-2 ring-card-foreground"
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
                ? "bg-card-foreground text-card border-card-foreground shadow-lg" 
                : "bg-card/80 backdrop-blur-sm text-card-foreground/60 border-card-foreground/20 hover:bg-card-foreground hover:text-card hover:border-card-foreground"
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
          <div className="bg-card-foreground text-card px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
            {journal.source === 'googlescholar' ? 'Scholar' : (journal.source || 'Semantic')}
          </div>
          
          {/* NEW badge — current or last year */}
          {journal.isNew && (
            <div className="bg-card-foreground text-card px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ring-1 ring-card-foreground/20">
              ✦ NEW
            </div>
          )}

          {/* RISING badge — high velocity, recent paper */}
          {journal.isRising && !journal.isNew && (
            <div className="bg-card-foreground/5 text-card-foreground border border-card-foreground/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-3 h-3 fill-current" />
              Rising
            </div>
          )}

          {/* ARIS score */}
          {journal.relevanceScore && (
            <div className="bg-transparent text-card-foreground border border-card-foreground/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-card-foreground" />
              ARIS {journal.relevanceScore}%
            </div>
          )}

          {/* Trending — legacy trendScore signal */}
          {!journal.isRising && (journal.trendScore || 0) > 10 && (
            <div className="bg-card-foreground/5 text-card-foreground border border-card-foreground/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3 fill-current" />
              Trending
            </div>
          )}

          {journal.isOpenAccess && (
            <div className="bg-transparent text-card-foreground/80 border border-card-foreground/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Open Access
            </div>
          )}
        </div>

        {/* Title & Abstract */}
        <Link 
          href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`}
          className="space-y-4 flex-grow mb-8"
        >
          <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold leading-[1.1] tracking-tighter text-card-foreground group-hover:opacity-70 transition-all">
            {journal.title}
          </h3>
          <p className="text-card-foreground/80 text-sm md:text-base font-medium line-clamp-3 leading-relaxed">
            {journal.abstract || 'Analisis riset neural mendalam diperlukan. Klik untuk inisialisasi ringkasan AI dan pembuatan insight untuk jurnal akademik ini.'}
          </p>
        </Link>

        {/* Footer Metadata */}
        <div className="pt-8 border-t border-card-foreground/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-card-foreground/5 flex items-center justify-center shrink-0 border border-card-foreground/10">
                <Users className="w-4 h-4 text-card-foreground/60" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] mb-0.5 font-bold text-card-foreground/60 uppercase tracking-wider">Kontributor</span>
                <span className="text-xs font-bold truncate max-w-[140px] text-card-foreground">
                  {journal.authors && journal.authors.length > 0 
                    ? journal.authors.slice(0, 2).map(a => a.name).join(', ') + (journal.authors.length > 2 ? ' et al.' : '')
                    : 'Anonymous'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] mb-0.5 font-bold text-card-foreground/60 uppercase tracking-wider block">Tahun</span>
                <span className={cn(
                  "text-xs font-black",
                  journal.isNew ? "text-card-foreground" : "text-card-foreground"
                )}>
                  {journal.year || 'N/A'}
                  {journal.isNew && <span className="ml-1 text-[8px] font-black opacity-60">●</span>}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] mb-0.5 font-bold text-card-foreground/60 uppercase tracking-wider block">Sitasi</span>
                <div className="flex items-center justify-end">
                  <Star className="w-3 h-3 mr-1 text-card-foreground/60" />
                  <span className="text-xs font-bold text-card-foreground">{(journal.citationCount || journal.citations || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link 
              href={`/journal/${journal.id || journal.paperId}?source=${journal.source || 'semantic'}`}
              className="flex-grow flex items-center justify-center gap-2 bg-card-foreground text-card h-12 md:h-14 group/btn shadow-md rounded-2xl hover:opacity-90 transition-all font-black"
            >
              <span className="text-[11px] tracking-[0.15em] relative z-10 uppercase">Analisis Intelijen</span>
              <Sparkles className="w-4 h-4 group-hover/btn:rotate-12 transition-transform relative z-10" />
            </Link>

            {journal.pdfUrl && (
              <a 
                href={journal.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-12 md:h-14 rounded-2xl border border-card-foreground/20 flex items-center justify-center bg-card-foreground text-card hover:opacity-80 transition-all duration-300 group/pdf shadow-sm"
                title="Download PDF"
                onClick={(e) => e.stopPropagation()}
              >
                <FileDown className="w-5 h-5 group-hover/pdf:scale-110 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
