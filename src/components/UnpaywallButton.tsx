'use client';

import { useState, useEffect } from 'react';
import { FileDown, Loader2, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnpaywallButtonProps {
  doi?: string;
  className?: string;
  showIconOnly?: boolean;
}

export default function UnpaywallButton({ doi, className, showIconOnly = false }: UnpaywallButtonProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!doi || tried) return;

    const checkPdf = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/unpaywall?doi=${encodeURIComponent(doi)}`);
        const data = await res.json();
        if (data.success && data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
        }
      } catch (err) {
        console.error("Unpaywall check failed", err);
      } finally {
        setLoading(false);
        setTried(true);
      }
    };

    checkPdf();
  }, [doi, tried]);

  if (!doi || (!pdfUrl && !loading)) return null;

  if (loading) {
    return (
      <div className={cn("inline-flex items-center gap-2 text-muted-foreground animate-pulse text-[10px] font-bold uppercase", className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        {!showIconOnly && "Mencari PDF..."}
      </div>
    );
  }

  if (pdfUrl) {
    return (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm transition-all active:scale-95",
          className
        )}
        title="Buka PDF Gratis (Legal)"
      >
        <Unlock className="w-3 h-3" />
        {!showIconOnly && "PDF Gratis"}
        <FileDown className="w-3 h-3 ml-0.5" />
      </a>
    );
  }

  return null;
}
