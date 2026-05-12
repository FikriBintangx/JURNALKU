'use client';

import { useState, useEffect } from 'react';
import { AI_MODELS } from '@/services/openRouterService';
import { Cpu, ChevronDown, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModelSelector = () => {
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selected_ai_model');
    if (saved) setSelectedModel(saved);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem('selected_ai_model', id);
    setIsOpen(false);
    // Dispatch a custom event so other components know the model changed
    window.dispatchEvent(new CustomEvent('ai_model_changed', { detail: id }));
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-card hover:bg-muted border border-border rounded-2xl transition-all shadow-sm active:scale-95 group"
      >
        <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
          <Cpu size={16} className="text-primary" />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">AI Intelligence</p>
          <p className="text-xs font-bold text-foreground flex items-center gap-2">
            {currentModel.name}
            <ChevronDown size={14} className={cn("opacity-40 transition-transform", isOpen && "rotate-180")} />
          </p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[120]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-3 w-72 bg-card border border-border rounded-[2rem] shadow-2xl z-[130] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 border-b border-border bg-muted/30">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pilih Model AI</h4>
              <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Gunakan model yang berbeda untuk variasi hasil & menghindari traffic tinggi.</p>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group",
                    selectedModel === model.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      selectedModel === model.id ? "bg-foreground text-background" : "bg-muted group-hover:bg-border"
                    )}>
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{model.name}</p>
                      <p className="text-[10px] opacity-60 font-black uppercase tracking-tighter">{model.provider}</p>
                    </div>
                  </div>
                  {selectedModel === model.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
