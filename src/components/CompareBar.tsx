'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  X,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function CompareBar() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const updateList = () => {
      try {
        const list = JSON.parse(
          localStorage.getItem('compare_list') || '[]'
        );

        setSelectedIds(Array.isArray(list) ? list : []);
      } catch {
        setSelectedIds([]);
      }
    };

    updateList();

    window.addEventListener('storage', updateList);

    return () => {
      window.removeEventListener('storage', updateList);
    };
  }, []);

  const clearAll = () => {
    localStorage.setItem('compare_list', '[]');
    window.dispatchEvent(new Event('storage'));
  };

  const removeId = (id: string) => {
    const updated = selectedIds.filter((i) => i !== id);

    localStorage.setItem(
      'compare_list',
      JSON.stringify(updated)
    );

    window.dispatchEvent(new Event('storage'));
  };

  const handleGoToCompare = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectedIds.length < 2) return;

    router.push(`/compare?ids=${selectedIds.join(',')}`);
  };

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[9999]
          flex
          justify-center
          p-4
          md:p-8
        "
      >
        <div
          className="
            relative
            w-full
            max-w-4xl
            bg-background/80
            backdrop-blur-md
            border-2
            border-foreground
            shadow-[0_20px_50px_rgba(0,0,0,0.2)]
            rounded-none
            overflow-hidden
            mb-4
          "
        >
          {/* Industrial Accent Line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-foreground/10" />

          <div
            className="
              relative
              flex
              flex-col
              md:flex-row
              items-stretch
              md:items-center
              justify-between
            "
          >
            {/* LEFT SECTION */}
            <div className="flex items-center gap-4 p-4 md:p-5 border-b md:border-b-0 md:border-r-2 border-foreground/10 flex-grow">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  bg-foreground
                  text-background
                "
              >
                <Scale className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h3
                  className="
                    truncate
                    text-sm
                    md:text-base
                    font-black
                    tracking-tightest
                    text-foreground
                    uppercase
                  "
                >
                  Antrean Neural
                </h3>

                <div className="flex items-center gap-2 mt-0.5">
                   <span className="inline-block w-1.5 h-1.5 bg-foreground animate-pulse" />
                   <p
                    className="
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.2em]
                      text-foreground/40
                    "
                  >
                    {selectedIds.length} JURNAL SIAP
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flex items-center justify-between md:justify-end gap-1 p-1 bg-foreground/5 md:bg-transparent">
              {/* Paper list */}
              <div className="flex items-center gap-1 px-3 overflow-x-auto no-scrollbar max-w-[150px] md:max-w-none border-r border-foreground/5 mr-2">
                {selectedIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => removeId(id)}
                    className="
                      group
                      relative
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      border
                      border-foreground/10
                      bg-background
                      hover:bg-red-500
                      hover:text-white
                      hover:border-red-500
                      transition-all
                      duration-200
                    "
                  >
                    <FileText className="h-3 w-3 group-hover:hidden" />
                    <X className="hidden group-hover:block h-3 w-3" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={clearAll}
                  className="
                    h-14
                    px-6
                    text-[9px]
                    font-black
                    uppercase
                    tracking-widest
                    text-foreground/40
                    hover:text-foreground
                    hover:bg-foreground/5
                    transition-all
                    hidden md:block
                  "
                >
                  HAPUS
                </button>

                <button
                  onClick={handleGoToCompare}
                  disabled={selectedIds.length < 2}
                  className={cn(
                    "h-14 px-8 md:px-12 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                    selectedIds.length >= 2
                      ? "bg-foreground text-background hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      : "bg-foreground/10 text-foreground/20 cursor-not-allowed"
                  )}
                >
                  <span>ANALISIS</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}