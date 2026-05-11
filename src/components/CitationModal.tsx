'use client';

import { useState } from 'react';
import { Journal } from '@/types/journal';
import { generateCitation } from '@/lib/citations';
import { Copy, Check, Quote, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  journal: Journal;
  isOpen: boolean;
  onClose: () => void;
}

export default function CitationModal({ journal, isOpen, onClose }: Props) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const formats: ('APA' | 'MLA' | 'IEEE')[] = ['APA', 'MLA', 'IEEE'];

  const handleCopy = (format: 'APA' | 'MLA' | 'IEEE') => {
    const text = generateCitation(journal, format);
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Quote className="w-5 h-5 mr-3 text-indigo-400" />
            Buat Sitasi
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {formats.map((format) => {
            const citation = generateCitation(journal, format);
            return (
              <div key={format} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{format}</span>
                  <button 
                    onClick={() => handleCopy(format)}
                    className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedFormat === format ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-slate-300 leading-relaxed italic">
                  {citation}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-6 bg-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            Selalu periksa kembali akurasi sitasi Anda
          </p>
        </div>
      </div>
    </div>
  );
}
