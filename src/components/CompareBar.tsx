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
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          fixed
          bottom-4
          left-1/2
          z-[9999]
          w-[92%]
          max-w-2xl
          -translate-x-1/2
        "
      >
        <div
          className="
            relative
            overflow-hidden
            rounded-full
            border
            border-white/10
            bg-[#050505]/92
            backdrop-blur-xl
            shadow-[0_20px_60px_rgba(0,0,0,0.45)]
          "
        >
          {/* subtle gradient */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-br
              from-white/[0.025]
              via-transparent
              to-white/[0.01]
            "
          />

          <div
            className="
              relative
              flex
              items-center
              justify-between
              gap-3
              px-4
              py-3
            "
          >
            {/* LEFT */}
            <div className="flex items-center gap-3 min-w-0">
              {/* icon */}
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.05]
                "
              >
                <Scale className="h-4 w-4 text-white" />
              </div>

              {/* text */}
              <div className="min-w-0">
                <h3
                  className="
                    truncate
                    text-[13px]
                    font-black
                    tracking-tight
                    text-white
                  "
                >
                  Compare Research
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-white/55
                  "
                >
                  {selectedIds.length} Papers Selected
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              {/* file icons */}
              <div className="hidden items-center -space-x-2 md:flex">
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
                      rounded-full
                      border
                      border-white/10
                      bg-white/[0.05]
                      transition-all
                      duration-300
                      hover:-translate-y-0.5
                      hover:border-red-500/30
                      hover:bg-red-500/10
                    "
                  >
                    <FileText
                      className="
                        h-3.5
                        w-3.5
                        text-white/70
                        transition-all
                        duration-200
                        group-hover:scale-0
                        group-hover:opacity-0
                      "
                    />

                    <X
                      className="
                        absolute
                        h-3.5
                        w-3.5
                        scale-0
                        text-red-400
                        opacity-0
                        transition-all
                        duration-200
                        group-hover:scale-100
                        group-hover:opacity-100
                      "
                    />
                  </button>
                ))}
              </div>

              {/* clear */}
              <button
                onClick={clearAll}
                className="
                  hidden
                  rounded-full
                  px-3
                  py-2
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-white/45
                  transition-all
                  duration-300
                  hover:bg-white/[0.05]
                  hover:text-white

                  md:block
                "
              >
                Clear
              </button>

              {/* analyze */}
              <button
                onClick={handleGoToCompare}
                disabled={selectedIds.length < 2}
                className={cn(
                  `
                  group
                  relative
                  flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  overflow-hidden
                  rounded-full
                  px-6
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-widest
                  transition-all
                  duration-300
                  active:scale-[0.98]
                `,
                  selectedIds.length >= 2
                    ? `
                      bg-foreground
                      text-background
                      hover:opacity-90
                    `
                    : `
                      cursor-not-allowed
                      bg-muted
                      text-foreground-muted
                    `
                )}
              >
                <span className="relative z-10">Analyze</span>
                <ArrowRight className="relative z-10 h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}