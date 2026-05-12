'use client';

import { useState, useEffect } from 'react';
import { Scale, X, ArrowRight, Loader2, FileText } from 'lucide-react';
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl pointer-events-auto"
      >
        <div className="glass-card rounded-[2.5rem] p-3 md:p-4 flex items-center justify-between border-primary/20 shadow-2xl">
          <div className="flex items-center space-x-4 pl-4">
            <div className="w-11 h-11 glass-card rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-foreground font-black text-sm tracking-tight">Compare Research</p>
              <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em]">
                {selectedIds.length} Papers Selected
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex -space-x-3 mr-4">
              {selectedIds.map((id) => (
                <button 
                  key={id}
                  onClick={() => removeId(id)}
                  className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all hover:scale-110 group relative shadow-md"
                >
                  <FileText className="w-4 h-4 group-hover:opacity-0 transition-opacity" />
                  <X className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            <button 
              onClick={clearAll}
              className="hidden md:block text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors px-4"
            >
              Clear
            </button>

            <button 
              onClick={handleGoToCompare}
              disabled={selectedIds.length < 2}
              className={cn(
                "px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center space-x-3 transition-all active:scale-95 shadow-xl relative z-[100]",
                selectedIds.length >= 2 
                  ? "bg-foreground text-background hover:opacity-90 shadow-foreground/10 cursor-pointer" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
