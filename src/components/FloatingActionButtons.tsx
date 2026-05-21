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
    <div className="fixed bottom-6 left-4 right-4 z-[90] flex justify-center md:hidden pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="flex items-center justify-between w-full max-w-md p-2 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-full shadow-2xl pointer-events-auto"
          >
            <Link href="/profile" className="flex-1 flex justify-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-foreground">
                <User className="w-5 h-5" />
              </div>
            </Link>

            <button
              onClick={scrollToTop}
              className="flex-1 flex justify-center w-12 h-12 items-center rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-foreground"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            <button
              onClick={() => router.push('/workspace')}
              className="flex-1 flex justify-center w-12 h-12 items-center rounded-full hover:bg-foreground/10 active:scale-95 transition-all"
            >
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </button>

            <Link href="/library" className="flex-1 flex justify-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-foreground">
                <BookMarked className="w-5 h-5" />
              </div>
            </Link>

            <button
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => searchInput.focus(), 300);
                }
              }}
              className="flex-1 flex justify-center w-12 h-12 items-center rounded-full hover:bg-foreground/10 active:scale-95 transition-all text-foreground"
            >
              <Search className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
