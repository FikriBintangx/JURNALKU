'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUp, Sparkles, BookMarked, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const FloatingActionButtons = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-3 md:hidden">
      <AnimatePresence>
        {isVisible && (
          <>
            <Link href="/profile">
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="w-12 h-12 bg-card/40 backdrop-blur-2xl border border-border/50 text-foreground rounded-full flex items-center justify-center shadow-2xl active:scale-90"
              >
                <User className="w-5 h-5" />
              </motion.div>
            </Link>

            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={scrollToTop}
              className="w-12 h-12 bg-card/40 backdrop-blur-2xl border border-border/50 text-foreground rounded-full flex items-center justify-center shadow-2xl active:scale-90"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => router.push('/workspace')}
              className="w-12 h-12 bg-card/40 backdrop-blur-2xl border border-border/50 text-foreground rounded-full flex items-center justify-center shadow-2xl active:scale-90"
            >
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </motion.button>

            <Link href="/library">
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="w-12 h-12 bg-card/40 backdrop-blur-2xl border border-border/50 text-foreground rounded-full flex items-center justify-center shadow-2xl active:scale-90"
              >
                <BookMarked className="w-5 h-5" />
              </motion.div>
            </Link>

            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => searchInput.focus(), 300);
                }
              }}
              className="w-14 h-14 bg-foreground/10 backdrop-blur-3xl border border-foreground/20 text-foreground rounded-2xl flex items-center justify-center shadow-2xl active:scale-90"
            >
              <Search className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
