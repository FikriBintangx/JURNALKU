'use client';

import { Journal } from '@/types/journal';
import { Calendar, User, TrendingUp, Sparkles, Scale, ShieldCheck, Share2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import BookmarkButton from './BookmarkButton';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative h-full"
    >
      {/* Premium Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className={cn(
        "glass-card rounded-[2.5rem] p-7 md:p-9 flex flex-col h-full transition-all duration-500 relative z-10",
        isComparing ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5" : "border-border/40 hover:border-primary/30"
      )}>
        {/* Compare Selector */}
        <button 
          onClick={toggleCompare}
          className={cn(
            "absolute -top-2 -right-2 p-2.5 rounded-xl transition-all shadow-xl z-20 border",
            isComparing 
              ? "bg-primary text-white border-primary/50 scale-110" 
              : "bg-card text-muted-foreground border-border/50 hover:text-foreground opacity-0 group-hover:opacity-100"
          )}
          title="Bandingkan"
        >
          <Scale className="w-4 h-4" />
        </button>

        {/* Header: Source & Citations */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm flex items-center gap-1.5",
              journal.source === 'openalex' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
              journal.source === 'googlescholar' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
              "bg-primary/10 border-primary/20 text-primary"
            )}>
              <Sparkles className="w-2.5 h-2.5" />
              {journal.source || 'Aggregator'}
            </div>
            {journal.isOpenAccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg text-emerald-500" title="Open Access">
                <ShieldCheck className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
            <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
            <span className="text-[10px] font-mono font-black text-foreground/70">
              {(journal.citations || journal.citationCount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow space-y-4">
          <Link href={`/journal/${journal.paperId || journal.id}?source=${journal.source || 'semantic'}`} className="block group/title">
            <h3 className="text-xl font-black text-foreground leading-[1.2] tracking-tight group-hover/title:text-primary transition-colors line-clamp-3">
              {journal.title}
            </h3>
          </Link>
          
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-muted-foreground group/meta">
              <User className="w-3.5 h-3.5 opacity-50" />
              <span className="text-[11px] font-bold truncate max-w-[150px] tracking-tight italic">
                {journal.authors?.[0]?.name || 'Unknown Author'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground group/meta">
              <Calendar className="w-3.5 h-3.5 opacity-50" />
              <span className="text-[11px] font-mono font-black tracking-tighter">{journal.year || 'N/A'}</span>
            </div>
          </div>
          
          {journal.abstract && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-3 md:line-clamp-4">
              {journal.abstract}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookmarkButton journal={journal} className="!p-2.5 !rounded-xl" />
            <button className="p-2.5 bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-xl text-muted-foreground hover:text-foreground transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {journal.pdfUrl && (
              <a 
                href={journal.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-premium flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </a>
            )}
            <Link 
              href={`/journal/${journal.paperId || journal.id}?source=${journal.source || 'semantic'}`}
              className="btn-premium flex items-center justify-center w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>

  );
}
