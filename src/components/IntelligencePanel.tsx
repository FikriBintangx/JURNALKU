'use client';

import { motion } from 'framer-motion';
import { Sparkles, Target, Zap, Lightbulb, Compass, BarChart3 } from 'lucide-react';
import { ResearchIntelligence } from '@/types/search';
import { cn } from '@/lib/utils';

interface IntelligencePanelProps {
  intelligence?: ResearchIntelligence;
  loading?: boolean;
}

export default function IntelligencePanel({ intelligence, loading }: IntelligencePanelProps) {
  if (!intelligence && !loading) return null;

  const intentMap: Record<string, { icon: any, label: string, color: string }> = {
    exploratory: { icon: Compass, label: 'Eksplorasi Akademik', color: 'text-blue-400' },
    methodological: { icon: Target, label: 'Fokus Metodologi', color: 'text-purple-400' },
    review: { icon: Zap, label: 'Analisis Literatur', color: 'text-orange-400' },
    comparative: { icon: BarChart3, label: 'Studi Komparatif', color: 'text-green-400' },
    generic: { icon: Lightbulb, label: 'Pencarian Umum', color: 'text-zinc-400' },
  };

  const currentIntent = intelligence?.intent ? intentMap[intelligence.intent] : intentMap.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 md:p-8 rounded-none border border-border-strong bg-card overflow-hidden relative shadow-md"
    >
      <div className="flex flex-col lg:flex-row gap-10 relative z-10">
        {/* Left Section: Intent & Domains */}
        <div className="flex-[1.2]">
          <div className="flex items-center gap-2 mb-6 text-[10px] font-bold tracking-[0.2em] uppercase text-foreground-muted">
            <Sparkles className="w-3.5 h-3.5" />
            Intelijen Riset AI
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-none bg-foreground text-background shrink-0">
              <currentIntent.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight tracking-tight">
                {currentIntent.label}
              </h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {intelligence?.domains.map((domain, i) => (
                  <span key={i} className="text-[10px] font-bold px-3 py-1 rounded-none border border-border text-foreground-secondary uppercase tracking-wider">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] mb-4">Ekspansi Konteks AI</h3>
            <div className="flex flex-wrap gap-2">
              {intelligence?.keywords.map((kw, i) => (
                <span key={i} className="text-sm font-medium px-4 py-1.5 rounded-none bg-muted border border-border text-foreground transition-all hover:border-foreground-muted cursor-default">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Suggested Questions */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-border pt-8 lg:pt-0 lg:pl-10">
          <h3 className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] mb-6">Saran Jalur Riset</h3>
          <div className="space-y-4">
            {intelligence?.questions.map((q, i) => (
              <div 
                key={i} 
                className="group flex gap-4 p-4 rounded-none hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border"
              >
                <div className="text-xs font-bold text-foreground-muted group-hover:text-foreground transition-colors">0{i+1}</div>
                <p className="text-sm font-semibold text-foreground group-hover:opacity-70 transition-all leading-relaxed">
                  {q}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
