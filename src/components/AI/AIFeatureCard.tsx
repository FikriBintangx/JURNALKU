'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, RotateCcw, Loader2, Brain, CheckCircle2, Clipboard, Share2, ChevronRight, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAIFeature } from '@/hooks/useAIFeature';
import { QueueStatus } from './QueueStatus';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AIFeatureCardProps {
  title: string;
  icon: React.ElementType;
  endpoint: string;
  paperId: string;
  abstract: string;
  paperTitle: string;
  description: string;
}

export const AIFeatureCard = ({
  title,
  icon: Icon,
  endpoint,
  paperId,
  abstract,
  paperTitle,
  description
}: AIFeatureCardProps) => {
  const { data, intelligence, loading, error, generate } = useAIFeature({
    endpoint,
    paperId,
    abstract,
    title: paperTitle
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    try {
      const cleanText = String(data)
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(#+)\s/g, '')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const shareData = {
      title: `${title}: ${paperTitle}`,
      text: String(data).replace(/[#*]/g, ''),
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await handleCopy();
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <motion.div 
      layout
      className="bg-card p-6 md:p-8 flex flex-col h-full min-h-[280px] relative overflow-hidden rounded-2xl border border-border/50 shadow-sm group/aicolor hover:border-foreground/20 hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-card-foreground/10 flex items-center justify-center text-card-foreground relative z-10 group-hover/aicolor:scale-110 transition-transform duration-500 ease-premium">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-card-foreground tracking-tight text-base relative z-10">{title}</h3>
        </div>
        {!data && (
          <button 
            onClick={generate}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg relative z-20 cursor-pointer text-[11px] font-bold transition-all shadow-sm border border-border/50",
              loading 
                ? "opacity-50 cursor-not-allowed bg-foreground/10 text-foreground/50"
                : "bg-background text-foreground hover:bg-foreground hover:text-background hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            )}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>{loading ? 'Menganalisis' : 'Buat'}</span>
          </button>
        )}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="relative mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="absolute inset-0 w-10 h-10 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              </div>
              <p className="label-caps !text-primary !opacity-100 animate-pulse">Memproses Intelijen...</p>
              <QueueStatus isVisible={true} />
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                <AlertCircle className="text-red-500 w-6 h-6" />
              </div>
              <p className="text-xs text-red-500/80 font-bold leading-tight max-w-[200px]">{error}</p>
              <button 
                onClick={generate}
                className="label-caps !text-white/60 hover:!text-white transition-all flex items-center gap-2"
              >
                <RotateCcw size={12} />
                Coba Lagi
              </button>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 text-sm text-card-foreground/80 leading-relaxed max-h-[500px] overflow-y-auto pr-4 custom-scrollbar font-medium">
                <div className="relative group/content overflow-hidden">
                  {/* ISAGI Branding & Fallback Badge */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {!String(data).includes('(Fallback)') && !intelligence?.fallback && (
                      <div className="flex items-center gap-2 py-1.5 px-4 bg-primary/10 border border-primary/20 rounded-full w-fit">
                        <Sparkles size={10} className="text-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sertifikasi Intelijen ISAGI</span>
                      </div>
                    )}
                    {(intelligence?.fallback || String(data).includes('[FALLBACK MODE]')) && (
                      <div className="flex items-center gap-2 py-1.5 px-4 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
                        <AlertCircle size={10} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Mode Cadangan Otonom</span>
                      </div>
                    )}
                  </div>

                  {/* Fallback Warning Box */}
                  {(intelligence?.fallback || String(data).includes('[FALLBACK MODE]')) && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/60 leading-relaxed italic">
                      Layanan AI utama sedang dalam pemulihan. Ringkasan ini dihasilkan secara otomatis menggunakan ekstraksi metadata literatur untuk menjaga kelangsungan riset Anda.
                    </div>
                  )}

                  {/* Premium Markdown Renderer */}
                  <div className="prose prose-invert prose-sm max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-card-foreground
                    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                    prose-p:leading-relaxed prose-p:mb-4 prose-p:text-card-foreground/80
                    prose-strong:text-card-foreground prose-strong:font-bold
                    prose-ul:my-4 prose-li:my-1
                    prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  ">
                    <ReactMarkdown
                      components={{
                        // Ensure no raw markers are shown by providing clean wrappers
                        h2: ({node, ...props}) => <h2 className="!m-0 !mb-4 pt-4 first:pt-0" {...props} />,
                        h3: ({node, ...props}) => <h3 className="!m-0 !mb-2 pt-2" {...props} />,
                        p: ({node, ...props}) => <p className="!m-0 !mb-5 last:mb-0" {...props} />,
                        li: ({node, ...props}) => <li className="!m-0 !mb-1.5 marker:text-primary" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-card-foreground font-black" {...props} />,
                      }}
                    >
                      {String(data)}
                    </ReactMarkdown>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-8 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopy}
                        className={cn(
                          "flex items-center gap-2 text-[11px] font-bold transition-all px-3 py-1.5 rounded-lg border whitespace-nowrap",
                          copied ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-background text-foreground/60 border-border/50 hover:text-foreground hover:bg-foreground/5"
                        )}
                      >
                        {copied ? <Check size={14} /> : <Clipboard size={14} />}
                        {copied ? 'Tersalin' : 'Salin Teks'}
                      </button>
                      <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 text-[11px] font-bold bg-background text-foreground/60 border-border/50 hover:text-foreground hover:bg-foreground/5 transition-all px-3 py-1.5 rounded-lg border whitespace-nowrap"
                      >
                        <Share2 size={14} />
                        Bagikan
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 py-1 px-3 bg-foreground/5 rounded-full group/badge transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 whitespace-nowrap">
                        {intelligence?.orchestrator || 'ISAGI Analysis'}
                      </span>
                      <CheckCircle2 size={12} className="text-foreground/40" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.p 
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-card-foreground/70 leading-relaxed font-medium px-1"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
