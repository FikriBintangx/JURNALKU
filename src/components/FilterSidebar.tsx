'use client';

import { X, Calendar, BookOpen, Star, RefreshCcw, Cpu, Tag, Layers, Database, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { SearchFilters, JournalSource, SortBy, ResearchMethod, TopicCategory, ComplexityLevel, DocumentType } from '@/types/search';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (newFilters: SearchFilters) => void;
  onReset: () => void;
  resultCount?: number;
}

// ─── Reusable toggle button ──────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "w-11 h-6 rounded-full transition-all relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
        checked ? "right-1" : "left-1"
      )} />
    </button>
  );
}

// ─── Section wrapper with collapsible support ───────────────
function FilterSection({ title, icon: Icon, children, defaultOpen = true, action }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted/5">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-2 text-[11px] font-black text-card-foreground/50 uppercase tracking-[0.15em] hover:text-card-foreground transition-colors"
        >
          <Icon className="w-4 h-4" />
          {title}
          {open ? <ChevronUp className="w-3 h-3 opacity-30 ml-auto" /> : <ChevronDown className="w-3 h-3 opacity-30 ml-auto" />}
        </button>
        {action && <div className="ml-2">{action}</div>}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Pill button selector ─────────────────────────────────────
function PillSelector<T extends string>({
  options, value, onChange, multi = false,
}: {
  options: { value: T; label: string }[];
  value: T | T[] | undefined;
  onChange: (v: T | T[]) => void;
  multi?: boolean;
}) {
  const selected = multi ? (Array.isArray(value) ? value : []) : value;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = multi
          ? (selected as T[]).includes(opt.value)
          : selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              if (multi) {
                const cur = (selected as T[]);
                onChange(isSelected ? cur.filter(v => v !== opt.value) : [...cur, opt.value]);
              } else {
                onChange(isSelected ? '' as T : opt.value);
              }
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
              isSelected
                ? "bg-foreground text-background border-foreground shadow-md shadow-foreground/25"
                : "bg-muted/10 border-border/50 text-card-foreground/50 hover:border-card-foreground/50 hover:text-card-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function FilterSidebar({ isOpen, onClose, filters, onApply, onReset, resultCount }: FilterSidebarProps) {
  const currentYear = new Date().getFullYear();
  const [local, setLocal] = useState<SearchFilters>(filters);

  useEffect(() => { setLocal(filters); }, [filters, isOpen]);

  const set = (patch: Partial<SearchFilters>) => setLocal(prev => ({ ...prev, ...patch }));

  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  // Count active filters for badge
  const activeCount = [
    local.yearStart && local.yearStart > 1990,
    local.yearEnd && local.yearEnd < currentYear,
    local.openAccess,
    local.hasPdf,
    local.minCitations && local.minCitations > 0,
    local.sources && local.sources.length > 0,
    local.researchMethod,
    local.category,
    local.complexity,
    local.minRelevanceScore && local.minRelevanceScore > 0,
  ].filter(Boolean).length;

  const selectClass = "w-full rounded-xl px-3 py-2 text-sm font-black focus:ring-2 focus:ring-primary outline-none transition-all border border-border appearance-none cursor-pointer bg-muted/20 text-card-foreground";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] glass-card !rounded-none !border-y-0 !border-r-0 border-l border-border shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-card-foreground">Filter Cerdas</h2>
                  {activeCount > 0 && (
                    <span className="bg-card-foreground text-card text-[10px] font-black px-2.5 py-1 rounded-full">
                      {activeCount} AKTIF
                    </span>
                  )}
                </div>
                <p className="text-card-foreground/40 text-xs font-bold mt-1 uppercase tracking-widest">
                  {resultCount !== undefined ? `${resultCount} KARYA DITEMUKAN` : 'Saring dengan AI'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">

              {/* Sort By */}
              <FilterSection title="Urutkan" icon={RefreshCcw}>
                <PillSelector<SortBy>
                  options={[
                    { value: 'relevance', label: '🎯 Relevansi' },
                    { value: 'year', label: '📅 Tahun' },
                    { value: 'citations', label: '⭐ Sitasi' },
                  ]}
                  value={local.sortBy || 'relevance'}
                  onChange={v => set({ sortBy: v as SortBy })}
                />
              </FilterSection>

              {/* Year Range */}
              <FilterSection title="Tahun Publikasi" icon={Calendar}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold ml-1">MULAI</span>
                    <select
                      value={local.yearStart || 1990}
                      onChange={e => set({ yearStart: parseInt(e.target.value) })}
                      className={cn(selectClass, "bg-background text-foreground")}
                    >
                      <option value={1900} className="bg-background text-foreground">Semua</option>
                      {years.map(y => <option key={y} value={y} className="bg-background text-foreground">{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold ml-1">HINGGA</span>
                    <select
                      value={local.yearEnd || currentYear}
                      onChange={e => set({ yearEnd: parseInt(e.target.value) })}
                      className={cn(selectClass, "bg-background text-foreground")}
                    >
                      <option value={currentYear} className="bg-background text-foreground">Sekarang</option>
                      {years.map(y => <option key={y} value={y} className="bg-background text-foreground">{y}</option>)}
                    </select>
                  </div>
                </div>
              </FilterSection>

              {/* Source Provider */}
              <FilterSection 
                title="Sumber Database" 
                icon={Database}
                action={
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const allSources: JournalSource[] = ['openalex', 'semantic', 'crossref', 'core', 'arxiv' as any, 'pubmed' as any, 'doaj' as any, 'zenodo' as any];
                      const currentCount = local.sources?.length || 0;
                      if (currentCount === allSources.length) {
                        set({ sources: [] });
                      } else {
                        set({ sources: allSources });
                      }
                    }}
                    className="text-[9px] font-black text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md uppercase tracking-wider transition-all"
                  >
                    {(local.sources?.length || 0) === 8 ? 'Hapus Semua' : 'Pilih Semua'}
                  </button>
                }
              >
                <PillSelector<JournalSource>
                  options={[
                    { value: 'openalex', label: 'OpenAlex' },
                    { value: 'semantic', label: 'Semantic' },
                    { value: 'crossref', label: 'Crossref' },
                    { value: 'core', label: 'CORE' },
                    { value: 'arxiv' as any, label: 'arXiv' },
                    { value: 'pubmed' as any, label: 'PubMed' },
                    { value: 'doaj' as any, label: 'DOAJ' },
                    { value: 'zenodo' as any, label: 'Zenodo' },
                  ]}
                  value={local.sources || []}
                  onChange={v => set({ sources: v as JournalSource[] })}
                  multi
                />
              </FilterSection>

              {/* Access & Type */}
              <FilterSection title="Akses & Tipe" icon={BookOpen}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-card-foreground/80">Open Access Saja</span>
                    <Toggle checked={!!local.openAccess} onChange={() => set({ openAccess: !local.openAccess })} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-border/50">
                    <span className="text-sm font-semibold text-card-foreground/80">Ada PDF</span>
                    <Toggle checked={!!local.hasPdf} onChange={() => set({ hasPdf: !local.hasPdf })} />
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-bold ml-1">TIPE DOKUMEN</span>
                  <PillSelector<DocumentType>
                    options={[
                      { value: 'journal_article', label: 'Jurnal' },
                      { value: 'conference_paper', label: 'Konferensi' },
                      { value: 'thesis', label: 'Thesis' },
                      { value: 'review', label: 'Review' },
                      { value: 'preprint', label: 'Preprint' },
                    ]}
                    value={local.docType}
                    onChange={v => set({ docType: v as DocumentType })}
                  />
                </div>
              </FilterSection>

              {/* Citations */}
              <FilterSection title="Minimal Sitasi" icon={Star}>
                <input
                  type="range" min={0} max={1000} step={25}
                  value={local.minCitations || 0}
                  onChange={e => set({ minCitations: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                  <span>0</span>
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {local.minCitations || 0}+ sitasi
                  </span>
                  <span>1000+</span>
                </div>
              </FilterSection>

              {/* ── AI FILTERS ──────────────────────────────── */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> AI Filters
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* AI Relevance Score */}
              <FilterSection title="Skor Relevansi AI" icon={Cpu} defaultOpen={false}>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Filter berdasarkan skor relevansi AI (0–100). Aktifkan opsi "AI Enrich" di pencarian terlebih dahulu.
                </p>
                <input
                  type="range" min={0} max={90} step={10}
                  value={local.minRelevanceScore || 0}
                  onChange={e => set({ minRelevanceScore: parseInt(e.target.value) })}
                  className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                  <span>Semua</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-black",
                    (local.minRelevanceScore || 0) >= 70 ? "text-background bg-foreground" :
                    (local.minRelevanceScore || 0) >= 40 ? "text-foreground bg-muted" :
                    "text-foreground bg-muted/50"
                  )}>
                    {local.minRelevanceScore || 0}%+ relevan
                  </span>
                  <span>90+</span>
                </div>
              </FilterSection>

              {/* Research Method */}
              <FilterSection title="Metode Penelitian" icon={Layers} defaultOpen={false}>
                <p className="text-[11px] text-muted-foreground mb-2">Dideteksi AI dari abstrak jurnal.</p>
                <PillSelector<ResearchMethod>
                  options={[
                    { value: 'kuantitatif', label: '📊 Kuantitatif' },
                    { value: 'kualitatif', label: '💬 Kualitatif' },
                    { value: 'mixed_method', label: '🔀 Mixed Method' },
                    { value: 'literature_review', label: '📚 Lit. Review' },
                    { value: 'eksperimen', label: '🧪 Eksperimen' },
                  ]}
                  value={local.researchMethod}
                  onChange={v => set({ researchMethod: v as ResearchMethod || undefined })}
                />
              </FilterSection>

              {/* Topic Category */}
              <FilterSection title="Kategori Topik" icon={Tag} defaultOpen={false}>
                <p className="text-[11px] text-muted-foreground mb-2">Klasifikasi topik oleh AI.</p>
                <PillSelector<TopicCategory>
                  options={[
                    { value: 'teknologi', label: '💻 Teknologi' },
                    { value: 'bisnis', label: '💼 Bisnis' },
                    { value: 'pendidikan', label: '🎓 Pendidikan' },
                    { value: 'kesehatan', label: '🏥 Kesehatan' },
                    { value: 'sosial', label: '👥 Sosial' },
                    { value: 'ekonomi', label: '📈 Ekonomi' },
                    { value: 'marketing', label: '📣 Marketing' },
                    { value: 'sains', label: '🔬 Sains' },
                    { value: 'hukum', label: '⚖️ Hukum' },
                  ]}
                  value={local.category}
                  onChange={v => set({ category: v as TopicCategory || undefined })}
                />
              </FilterSection>

              {/* Complexity Level */}
              <FilterSection title="Tingkat Kompleksitas" icon={Sparkles} defaultOpen={false}>
                <p className="text-[11px] text-muted-foreground mb-2">Dianalisis AI berdasarkan gaya penulisan dan konten.</p>
                <PillSelector<ComplexityLevel>
                  options={[
                    { value: 'beginner', label: '🟢 Pemula' },
                    { value: 'intermediate', label: '🟡 Menengah' },
                    { value: 'expert', label: '🔴 Ahli' },
                  ]}
                  value={local.complexity}
                  onChange={v => set({ complexity: v as ComplexityLevel || undefined })}
                />
              </FilterSection>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card/90 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onReset();
                    setLocal({});
                  }}
                  className="px-4 py-3 bg-card-foreground/5 hover:bg-card-foreground/10 text-card-foreground/60 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border/50"
                >
                  Reset Semua
                </button>
                <button
                  onClick={() => { onApply(local); onClose(); }}
                  className="px-4 py-3 bg-card-foreground text-card hover:opacity-90 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5 relative overflow-hidden"
                >
                  {activeCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-card/50 rounded-full animate-pulse" />
                  )}
                  Terapkan{activeCount > 0 ? ` (${activeCount})` : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
