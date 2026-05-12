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
      className="mono-card p-8 flex flex-col h-full min-h-[280px] relative overflow-hidden group/aicolor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 glass-card !bg-white/5 !rounded-2xl flex items-center justify-center text-primary group-hover/aicolor:scale-110 transition-transform border border-white/10">
            <Icon size={22} />
          </div>
          <h3 className="font-black text-card-foreground tracking-tight text-base">{title}</h3>
        </div>
        {!data && (
          <button 
            onClick={generate}
            disabled={loading}
            className={cn(
              "btn-primary btn-fill-mewah h-10 px-6 !rounded-xl",
              loading && "opacity-50 cursor-not-allowed"
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
              <div className="flex-1 text-sm text-card-foreground/90 leading-relaxed max-h-[500px] overflow-y-auto pr-4 custom-scrollbar font-medium">
                <div className="relative p-7 glass-card !bg-white/5 border border-white/10 shadow-2xl rounded-[2.5rem] group/content overflow-hidden">
                  {/* ISAGI Branding & Fallback Badge */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {!String(data).includes('(Fallback)') && !intelligence?.fallback && (
                      <div className="flex items-center gap-2 py-1.5 px-4 bg-primary/10 border border-primary/20 rounded-full w-fit">
                        <Sparkles size={10} className="text-primary animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">ISAGI Intelligence Certified</span>
                      </div>
                    )}
                    {(intelligence?.fallback || String(data).includes('[FALLBACK MODE]')) && (
                      <div className="flex items-center gap-2 py-1.5 px-4 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
                        <AlertCircle size={10} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Autonomous Fallback Mode</span>
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
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                    prose-p:leading-relaxed prose-p:mb-4 prose-p:text-card-foreground/80
                    prose-strong:text-foreground prose-strong:font-bold
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
                        strong: ({node, ...props}) => <strong className="text-foreground font-black" {...props} />,
                      }}
                    >
                      {String(data)}
                    </ReactMarkdown>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleCopy}
                        className={cn(
                          "btn-fill-mewah flex items-center gap-2 text-[10px] font-bold transition-all px-3 py-1.5 rounded-xl border border-white/5 whitespace-nowrap",
                          copied ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-white/5 text-card-foreground/60 hover:text-primary"
                        )}
                      >
                        {copied ? <Check size={12} /> : <Clipboard size={12} />}
                        {copied ? 'Tersalin' : 'Salin Teks'}
                      </button>
                      <button 
                        onClick={handleShare}
                        className="btn-fill-mewah flex items-center gap-2 text-[10px] font-bold bg-white/5 text-card-foreground/60 hover:text-primary transition-all px-3 py-1.5 rounded-xl border border-white/5 whitespace-nowrap"
                      >
                        <Share2 size={12} />
                        Bagikan
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 py-1 px-3 glass-card !bg-white/5 border border-white/10 rounded-full group/badge transition-colors hover:border-primary/30">
                      <span className="text-[9px] font-black uppercase tracking-widest text-card-foreground/40 group-hover/badge:text-primary/70 transition-colors whitespace-nowrap">
                        {intelligence?.orchestrator || 'ISAGI Analysis'}
                      </span>
                      <CheckCircle2 size={10} className="text-primary/40 group-hover/badge:text-primary/70 transition-colors" />
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
              className="text-sm text-foreground-secondary leading-relaxed font-medium px-1"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
