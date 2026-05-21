'use client';

import { useState, useEffect } from 'react';
import { modelRegistry, RegisteredModel } from '@/services/arai/modelRegistry';
import { providerHealth } from '@/services/arai/providerHealth';
import { Cpu, ChevronDown, Check, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModelSelector = () => {
  const [models, setModels] = useState<RegisteredModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('isagi-autonomous');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Standard static models + special ISAGI model
    const allModels = [
      { id: 'isagi-autonomous', name: 'ISAGI Autonomous Swarm', provider: 'gemini' as any, isAvailable: true } as RegisteredModel,
      ...modelRegistry.getModelsForProvider('gemini'),
      ...modelRegistry.getModelsForProvider('groq'),
      ...modelRegistry.getModelsForProvider('openrouter')
    ];
    setModels(allModels);

    const saved = localStorage.getItem('selected_ai_model');
    if (saved) setSelectedModel(saved);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem('selected_ai_model', id);
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('ai_model_changed', { detail: id }));
  };

  const currentModel = models.find(m => m.id === selectedModel) || models[0] || { name: 'ISAGI Autonomous', provider: 'gemini' };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-card hover:bg-card/90 border border-border rounded-2xl transition-all shadow-sm active:scale-95 group"
      >
        <div className="p-1.5 bg-card-foreground/10 rounded-lg group-hover:bg-card-foreground/20 transition-colors">
          <Cpu size={16} className="text-card-foreground/70" />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black text-card-foreground/40 uppercase tracking-widest leading-none mb-1">Intelijen AI</p>
          <p className="text-xs font-bold text-card-foreground flex items-center gap-2">
            {currentModel.name}
            <ChevronDown size={14} className={cn("opacity-40 transition-transform", isOpen && "rotate-180")} />
          </p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[120]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 md:right-auto md:left-0 mt-3 w-72 bg-card border border-border/50 rounded-2xl p-2 shadow-xl z-[130] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-border/50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-card-foreground/50">Pilih Model AI</h4>
              <p className="text-[9px] text-card-foreground/30 mt-1 font-medium italic">Gunakan model yang berbeda untuk variasi hasil & menghindari traffic tinggi.</p>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {models.map((model: RegisteredModel) => {
                const health = providerHealth.getStats(model.provider);
                const isHealthy = providerHealth.isHealthy(model.provider);
                
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group mb-1",
                      selectedModel === model.id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-card-foreground/5 text-card-foreground/70",
                      model.id === 'isagi-autonomous' && selectedModel !== model.id && "border border-primary/20 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        selectedModel === model.id ? "bg-white/20" : 
                        model.id === 'isagi-autonomous' ? "bg-primary/20" : "bg-card-foreground/5 group-hover:bg-card-foreground/10"
                      )}>
                        {model.id === 'isagi-autonomous' ? (
                          <Sparkles size={14} className={selectedModel === model.id ? "text-white" : "text-primary"} />
                        ) : (
                          <Zap size={14} className={selectedModel === model.id ? "text-white" : "text-card-foreground/40"} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold">{model.name}</p>
                          {!isHealthy && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        </div>
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-tighter">
                          {model.provider} {health?.state === 'cooldown' ? '• Cooldown' : ''}
                        </p>
                      </div>
                    </div>
                    {selectedModel === model.id && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
