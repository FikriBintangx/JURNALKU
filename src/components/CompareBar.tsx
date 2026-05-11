'use client';

import { useState, useEffect } from 'react';
import { Scale, X, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function CompareBar() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const updateList = () => {
      try {
        const list = JSON.parse(localStorage.getItem('compare_list') || '[]');
        console.log("[CompareBar] Updated List:", list);
        setSelectedIds(list);
      } catch (e) {
        setSelectedIds([]);
      }
    };
    
    updateList();
    window.addEventListener('storage', updateList);
    return () => window.removeEventListener('storage', updateList);
  }, []);

  const clearAll = () => {
    localStorage.setItem('compare_list', '[]');
    window.dispatchEvent(new Event('storage'));
  };

  const removeId = (id: string) => {
    const list = selectedIds.filter(i => i !== id);
    localStorage.setItem('compare_list', JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
  };

  const handleGoToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedIds.length < 2) {
      console.warn("[CompareBar] Not enough IDs selected:", selectedIds.length);
      return;
    }
    
    const url = `/compare?ids=${selectedIds.join(',')}`;
    console.log("[CompareBar] Navigating to:", url);
    router.push(url);
  };

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl pointer-events-auto"
      >
        <div className="bg-card/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 pl-2">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-foreground font-black text-sm tracking-tight">Bandingkan Jurnal</p>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
                {selectedIds.length} Jurnal Terpilih
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex -space-x-3">
              {selectedIds.map((id) => (
                <button 
                  key={id}
                  onClick={() => removeId(id)}
                  className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-white hover:bg-red-500 transition-all hover:scale-110 group relative shadow-lg"
                >
                  <span className="text-[8px] font-black">PDF</span>
                  <X className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-border mx-1" />

            <button 
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors px-2"
            >
              Batal
            </button>

            <button 
              onClick={handleGoToCompare}
              disabled={selectedIds.length < 2}
              className={cn(
                "px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-2 transition-all active:scale-95 shadow-2xl relative z-[100]",
                selectedIds.length >= 2 
                  ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20 cursor-pointer opacity-100" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <span className="relative z-10">Bandingkan</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
