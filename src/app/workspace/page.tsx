"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileText, Folder, Network, 
  Sparkles, BrainCircuit, Search, GitCompare, 
  ChevronRight, BookOpen, AlertCircle, FilePlus, Menu, X,
  Database, Activity, Target, Cpu, CheckCircle2, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function WorkspacePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'compare' | 'review'>('synthesis');
  const [documents, setDocuments] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [streamText, setStreamText] = useState("Sistem AI siap menerima instruksi penelitian.");
  const [history, setHistory] = useState<any[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [synthesisOutput, setSynthesisOutput] = useState("");
  const [researchGap, setResearchGap] = useState("");
  const [knowledgeGraph, setKnowledgeGraph] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentStatus, setAgentStatus] = useState({
    retriever: 'Siap', critic: 'Siap', synthesizer: 'Siap', graph: 'Siap'
  });
  const [vectorStats, setVectorStats] = useState({ docs: 0, chunks: 0 });

  useEffect(() => {
    let isMounted = true;
    const initWorkspace = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('Auth failed');
        const userData = await userRes.json();
        if (!isMounted) return;
        const activeUserId = userData?.user?.id || 'session_workspace';
        setUser(userData?.user || { id: 'session_workspace' });

        const savedHistory = localStorage.getItem(`workspace_history_${activeUserId}`);
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        const [statsRes, colRes] = await Promise.all([
          fetch(`/api/workspace/stats?userId=${activeUserId}`),
          fetch(`/api/workspace/collections?userId=${activeUserId}`)
        ]);
        const statsData = await statsRes.json();
        const colData = await colRes.json();

        if (isMounted) {
          if (statsData.success) {
            setVectorStats({ docs: statsData.docs, chunks: statsData.chunks });
            if (statsData.documents) setDocuments(statsData.documents);
          }
          if (colData.collections) setCollections(colData.collections);
        }
      } catch (err) {
        console.warn("[WORKSPACE] Init gagal:", err);
      }
    };
    initWorkspace();
    return () => { isMounted = false; };
  }, []);

  const saveToHistory = (data: { title: string, content: string, type: string, gap?: string, graph?: string }) => {
    const userId = user?.id || 'session_workspace';
    const newItem = { id: Date.now().toString(), date: new Date().toISOString(), ...data };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem(`workspace_history_${userId}`, JSON.stringify(newHistory));
    setActiveHistoryId(newItem.id);
  };

  const loadHistoryItem = (item: any) => {
    setActiveHistoryId(item.id);
    setActiveTab(item.type);
    setSynthesisOutput(item.content);
    setResearchGap(item.gap || "");
    setKnowledgeGraph(item.graph || "");
    setStreamText(`Memuat Riwayat: ${item.title}`);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const userId = user?.id || 'session_workspace';
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem(`workspace_history_${userId}`, JSON.stringify(newHistory));
    if (activeHistoryId === id) {
      setSynthesisOutput(""); setResearchGap(""); setKnowledgeGraph(""); setActiveHistoryId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStreamText("Mengekstrak fitur vektor dari dokumen...");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'session_workspace');

    try {
      const res = await fetch('/api/workspace/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => [...prev, file.name]);
        setStreamText("Dokumen berhasil diserap ke memori vektor.");
      } else setStreamText("Gagal: " + data.error);
    } catch {
      setStreamText("Terjadi kesalahan jaringan.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    setIsStreaming(true);
    setSynthesisOutput("");
    setStreamText("Inisialisasi Swarm Intelligence...");
    setAgentStatus({ retriever: 'Aktif', critic: 'Aktif', synthesizer: 'Aktif', graph: 'Aktif' });
    
    try {
      const response = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatInput, userId: 'session_workspace', mode: activeTab })
      });
      if (!response.body) throw new Error("Stream missing");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false; let currentEvent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        const lines = chunkValue.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('event: ')) currentEvent = line.replace('event: ', '').trim();
          else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'status') setStreamText(data.message);
              else if (currentEvent === 'agent') setAgentStatus(prev => ({ ...prev, [data.agent]: data.activity }));
              else if (currentEvent === 'token') setSynthesisOutput(prev => prev + data.text);
              else if (currentEvent === 'gap') setResearchGap(data.message);
              else if (currentEvent === 'graph') setKnowledgeGraph(data.message);
            }
          }
        }
      }
      setTimeout(() => {
        setSynthesisOutput(prev => {
          if (prev) saveToHistory({ title: chatInput, content: prev, type: activeTab, gap: researchGap, graph: knowledgeGraph });
          return prev;
        });
      }, 500);
    } catch (err) {
      setStreamText("Koneksi ke orchestrator terputus.");
    } finally {
      setIsStreaming(false); setChatInput("");
      setAgentStatus({ retriever: 'Selesai', critic: 'Selesai', synthesizer: 'Selesai', graph: 'Selesai' });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-foreground selection:text-background transition-colors duration-500">
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR - LIBRARY & HISTORY */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-72 lg:w-80 border-r border-border/40 flex flex-col bg-background md:bg-transparent transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-20 px-6 flex items-center justify-between shrink-0">
          <div onClick={() => router.push('/')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-extrabold tracking-tight text-lg">ISAGI <span className="opacity-40">OS</span></span>
          </div>
          <button className="md:hidden opacity-50 hover:opacity-100" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 space-y-8 pb-8">
          
          <div className="space-y-3">
            <div className="px-2">
              <div className="relative group overflow-hidden rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 hover:border-foreground/20 transition-all">
                <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isUploading} />
                <div className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background shadow-sm border border-border flex items-center justify-center shrink-0">
                    {isUploading ? <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /> : <UploadCloud className="w-5 h-5 opacity-60" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Unggah Jurnal</h4>
                    <p className="text-xs text-foreground/50 font-medium">Format PDF (.pdf)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2">
              <Database className="w-3 h-3" /> Memori Vektor
            </h3>
            <div className="space-y-1">
              {documents.length === 0 ? (
                <div className="px-3 py-2 text-xs text-foreground/30 font-medium">Belum ada dokumen.</div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 cursor-pointer group transition-colors">
                    <FileText className="w-4 h-4 text-foreground/40 group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-semibold truncate flex-1">{doc.fileName || doc}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold text-foreground/40 uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center gap-2"><Activity className="w-3 h-3" /> Riwayat</div>
              <span>{history.length}/20</span>
            </h3>
            <div className="space-y-1">
              {history.length === 0 ? (
                <div className="px-3 py-2 text-xs text-foreground/30 font-medium">Belum ada aktivitas.</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} onClick={() => loadHistoryItem(item)} className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group transition-all", activeHistoryId === item.id ? "bg-foreground text-background shadow-md" : "hover:bg-muted/50")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.type === 'synthesis' ? "bg-blue-500" : item.type === 'compare' ? "bg-amber-500" : "bg-emerald-500")} />
                      <span className="text-xs font-semibold truncate">{item.title}</span>
                    </div>
                    <button onClick={(e) => deleteHistoryItem(e, item.id)} className={cn("opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-background/20 transition-all shrink-0", activeHistoryId === item.id ? "text-background" : "text-foreground")}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-background-secondary md:rounded-l-3xl md:border-l md:border-border/50 shadow-2xl overflow-hidden">
        
        {/* TOP NAV */}
        <header className="h-20 px-6 lg:px-10 flex items-center justify-between shrink-0 glass-nav z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-muted shrink-0"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/40 shadow-sm overflow-x-auto hide-scrollbar w-full max-w-[200px] sm:max-w-none">
              {[
                { id: 'synthesis', label: 'Sintesis', icon: Sparkles },
                { id: 'review', label: 'Tinjauan', icon: BookOpen },
                { id: 'compare', label: 'Komparasi', icon: GitCompare }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all", isActive ? "bg-foreground text-background shadow-sm" : "text-foreground/60 hover:text-foreground hover:bg-muted")}>
                    <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-background border border-border/40 rounded-xl shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">{vectorStats.docs} Dokumen Siap</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto hide-scrollbar relative">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 pb-40 space-y-12">
            
            {/* AGENT STATUS HERO */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shrink-0 shadow-xl shadow-foreground/10">
                <BrainCircuit className="w-6 h-6 text-background" />
              </div>
              <div className="pt-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                  {streamText}
                </h1>
                <p className="text-sm font-medium text-foreground/50 mt-2">
                  ISAGI Multi-Agent Swarm • Real-time Cognition Engine
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {(synthesisOutput || isStreaming) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                  className="space-y-8"
                >
                  <div className="p-8 md:p-10 bg-background rounded-[2rem] border border-border/40 shadow-xl shadow-foreground/[0.02]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Sparkles className="w-5 h-5" /></div>
                        <h3 className="font-bold text-sm">Hasil Sintesis Utama</h3>
                      </div>
                      {isStreaming && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                          <Activity className="w-3 h-3 animate-pulse" /> Memproses
                        </div>
                      )}
                    </div>
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-medium leading-relaxed">
                      {synthesisOutput}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-background rounded-[2rem] border border-border/40 shadow-xl shadow-foreground/[0.02]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500"><Target className="w-5 h-5" /></div>
                        <h3 className="font-bold text-sm">Celah Riset & Metodologi</h3>
                      </div>
                      <div className="text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {researchGap || (isStreaming ? "Menganalisis celah metodologi..." : "Belum ada analisis.")}
                      </div>
                    </div>
                    
                    <div className="p-8 bg-background rounded-[2rem] border border-border/40 shadow-xl shadow-foreground/[0.02] flex flex-col">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Network className="w-5 h-5" /></div>
                        <h3 className="font-bold text-sm">Grafik Pengetahuan</h3>
                      </div>
                      <div className="flex-1 bg-foreground/[0.02] rounded-xl border border-border/40 p-4 font-mono text-[10px] text-foreground/70 overflow-auto whitespace-pre-wrap">
                        {knowledgeGraph || (isStreaming ? "Memetakan entitas..." : "Belum ada peta grafik.")}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!synthesisOutput && !isStreaming && documents.length > 0 && (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-[2rem] opacity-60">
                <Sparkles className="w-8 h-8 mb-4 text-foreground/40" />
                <p className="text-sm font-semibold">Ruang sintesis siap.</p>
                <p className="text-xs text-foreground/50 mt-1">Ketikkan perintah riset di bawah.</p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM INPUT DOCK */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-secondary via-background-secondary/90 to-transparent pt-24 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleChatSubmit} className="relative group flex items-center bg-background border border-border/50 rounded-2xl p-2 shadow-2xl transition-all focus-within:ring-2 focus-within:ring-foreground/20 focus-within:border-foreground/30">
              <div className="p-3 text-foreground/40 shrink-0"><Search className="w-5 h-5" /></div>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isStreaming}
                placeholder="Tuliskan tujuan riset, komparasi jurnal, atau pencarian celah teori..." 
                className="flex-1 bg-transparent border-none outline-none text-sm font-semibold placeholder:text-foreground/30 disabled:opacity-50 min-w-0"
              />
              <button type="submit" disabled={isStreaming} className="bg-foreground text-background p-3 rounded-xl transition-all ml-2 hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 shadow-md">
                <ChevronRight className="w-5 h-5 stroke-[3px]" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR - SWARM STATUS */}
      <aside className="hidden xl:flex w-80 border-l border-border/40 bg-background flex-col z-20 shrink-0">
        <div className="h-20 px-6 flex items-center border-b border-border/40 shrink-0">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Metrik Agen AI
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6">
          <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold">Status Jaringan</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
              </span>
            </div>
            <div className="space-y-3 pt-2">
              {[
                { label: 'Retriever (Pencari)', status: agentStatus.retriever, activeColor: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' },
                { label: 'Critic (Evaluator)', status: agentStatus.critic, activeColor: 'bg-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500' },
                { label: 'Graph (Pemeta)', status: agentStatus.graph, activeColor: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500' },
                { label: 'Synthesizer (Penyusun)', status: agentStatus.synthesizer, activeColor: 'bg-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-500' }
              ].map((agent, idx) => {
                const isActive = agent.status !== 'Siap' && agent.status !== 'Selesai';
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{agent.label}</span>
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", isActive ? `${agent.bg} ${agent.text}` : "text-foreground/30")}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", isActive ? `${agent.activeColor} w-[80%] animate-pulse` : "bg-foreground/10 w-full")} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="p-5 rounded-2xl border border-border/50 border-dashed text-center space-y-2 opacity-60">
            <CheckCircle2 className="w-6 h-6 mx-auto text-foreground/40" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Enkripsi Vektor Aktif</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
