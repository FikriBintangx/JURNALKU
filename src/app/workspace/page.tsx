"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileText, Folder, Network, 
  Sparkles, BrainCircuit, Search, GitCompare, 
  ChevronRight, BookOpen, AlertCircle, FilePlus, Menu, X,
  Database, Activity, Target, Cpu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function WorkspacePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'compare' | 'review'>('synthesis');
  const [documents, setDocuments] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [streamText, setStreamText] = useState("Menunggu dokumen atau instruksi penelitian...");
  
  // SSE Streaming States
  const [chatInput, setChatInput] = useState("");
  const [synthesisOutput, setSynthesisOutput] = useState("");
  const [researchGap, setResearchGap] = useState("");
  const [knowledgeGraph, setKnowledgeGraph] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentStatus, setAgentStatus] = useState({
    retriever: 'Siap',
    critic: 'Siap',
    synthesizer: 'Siap',
    graph: 'Siap'
  });
  const [vectorStats, setVectorStats] = useState({ docs: 0, chunks: 0 });

  // Fetch Vector Stats on mount
  React.useEffect(() => {
    let isMounted = true;
    const initWorkspace = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) throw new Error('Auth failed');
        const userData = await userRes.json();
        
        if (!isMounted) return;
        
        const activeUserId = userData?.user?.id || 'session_workspace';
        setUser(userData?.user || { id: 'session_workspace' });

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStreamText("Menganalisis dokumen PDF: Ekstraksi struktur, metode, dan batas penelitian...");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'session_workspace');

    try {
      const res = await fetch('/api/workspace/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setDocuments(prev => [...prev, file.name]);
        setStreamText("Dokumen berhasil diserap ke dalam Memori Vektor. Memulai pemetaan grafik pengetahuan...");
      } else {
        setStreamText("Gagal memproses dokumen: " + data.error);
      }
    } catch (err) {
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
    setStreamText("Mengaktifkan sirkuit Multi-Agen...");
    setAgentStatus({ retriever: 'Aktif', critic: 'Aktif', synthesizer: 'Aktif', graph: 'Aktif' });
    
    try {
      const response = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatInput, userId: 'session_workspace', mode: activeTab })
      });

      if (!response.body) throw new Error("Stream tidak ditemukan");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentEvent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        const lines = chunkValue.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'status') {
                setStreamText(data.message);
              } else if (currentEvent === 'agent') {
                setAgentStatus(prev => ({ ...prev, [data.agent]: data.activity }));
              } else if (currentEvent === 'token') {
                setSynthesisOutput(prev => prev + data.text);
              } else if (currentEvent === 'gap') {
                setResearchGap(data.message);
              } else if (currentEvent === 'graph') {
                setKnowledgeGraph(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      setStreamText("Gagal menghubungi orchestrator.");
    } finally {
      setIsStreaming(false);
      setChatInput("");
      setAgentStatus({ retriever: 'Selesai', critic: 'Selesai', synthesizer: 'Selesai', graph: 'Selesai' });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div onClick={() => router.push('/')} className="flex items-center space-x-3 cursor-pointer group">
            <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12">
              <BrainCircuit className="w-6 h-6 text-background" />
            </div>
            <h2 className="font-black tracking-tighter text-lg uppercase">ISAGI OS</h2>
          </div>
          <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-10">
          {/* UPLOAD */}
          <div className="relative group">
            <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileUpload} disabled={isUploading} />
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-[2rem] bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-all group-hover:border-foreground/40">
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Proses RAG...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 mb-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">Unggah Dokumen Riset</span>
                </>
              )}
            </div>
          </div>

          {/* MEMORI */}
          <div>
            <h3 className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <Database className="w-3 h-3" /> Memori Personal
            </h3>
            <ul className="space-y-2">
              {documents.length === 0 ? (
                <li className="text-[11px] text-foreground-muted italic font-medium opacity-30">Belum ada dokumen yang diserap...</li>
              ) : (
                documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center space-x-3 text-xs font-bold p-3 rounded-xl hover:bg-foreground/[0.05] cursor-pointer transition-all border border-transparent hover:border-border">
                    <FileText className="w-4 h-4 opacity-40" />
                    <span className="truncate">{doc.fileName || doc}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* KOLEKSI */}
          <div>
            <h3 className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <Folder className="w-3 h-3" /> Koleksi Riset
            </h3>
            <ul className="space-y-2">
              {collections.length === 0 ? (
                <li className="text-[11px] text-foreground-muted italic font-medium opacity-30">Kosong...</li>
              ) : (
                collections.map((col, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/[0.05] cursor-pointer group border border-transparent hover:border-border">
                    <div className="flex items-center space-x-3 text-xs font-bold">
                      <Folder className="w-4 h-4 opacity-40" />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <span className="text-[9px] font-black opacity-20 group-hover:opacity-100">{col._count?.documents || 0}</span>
                  </li>
                ))
              )}
              <li className="flex items-center space-x-3 text-xs font-bold p-3 rounded-xl hover:bg-foreground/[0.05] cursor-pointer text-foreground-muted mt-2 border border-dashed border-border">
                <FilePlus className="w-4 h-4" />
                <span>Buat Koleksi Baru</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-foreground/[0.02]">
          <button onClick={() => router.push('/')} className="btn-primary btn-fill-mewah w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest px-6 py-4 !rounded-2xl bg-foreground text-background transition-all shadow-xl">
            <span>← Kembali ke Menu</span>
          </button>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* TOP NAV */}
        <header className="h-20 border-b border-border flex items-center px-8 justify-between glass-nav sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2"><Menu className="w-6 h-6" /></button>
            <div className="flex p-1 bg-muted/30 rounded-2xl border border-border">
              <button onClick={() => setActiveTab('synthesis')} className={cn("btn-fill-mewah px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'synthesis' ? "bg-foreground text-background shadow-lg" : "text-foreground-muted hover:text-foreground")}>Sintesis AI</button>
              <button onClick={() => setActiveTab('review')} className={cn("btn-fill-mewah px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", activeTab === 'review' ? "bg-foreground text-background shadow-lg" : "text-foreground-muted hover:text-foreground")}>Tinjauan Pustaka</button>
              <button onClick={() => setActiveTab('compare')} className={cn("btn-fill-mewah px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2", activeTab === 'compare' ? "bg-foreground text-background shadow-lg" : "text-foreground-muted hover:text-foreground")}>
                <GitCompare className="w-3.5 h-3.5" /> <span>Komparasi</span>
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-foreground/5 border border-border rounded-full">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Vektor Siap: {vectorStats.docs} Dokumen</span>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="max-w-4xl mx-auto space-y-12 pb-40">
            
            {/* STATUS ORCHESTRATOR */}
            <div className="rounded-[2.5rem] border-2 border-foreground bg-card p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/[0.02] rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-foreground/[0.05]" />
              <div className="flex items-start gap-6 relative z-10">
                <div className="p-4 bg-foreground text-background rounded-2xl shadow-2xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground-muted mb-3">Kernel ISAGI Aktif</h4>
                  <p className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
                    {streamText}
                  </p>
                </div>
              </div>
            </div>

            {/* OUTPUT AREA */}
            <div className="space-y-10">
              <div className="space-y-3">
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Ruang Sintesis</h1>
                <p className="text-foreground-muted text-lg font-medium leading-relaxed max-w-2xl">
                  Ekstraksi metodologi, deteksi celah riset, dan bangun landasan teori secara otonom dalam satu antarmuka terpadu.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {synthesisOutput || isStreaming ? (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mono-card p-10 shadow-2xl border-2 border-border-strong relative bg-card">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 opacity-40" />
                        <h3 className="text-xs font-black uppercase tracking-[0.25em]">Hasil Analisis Intelijen</h3>
                      </div>
                      {isStreaming && <div className="flex gap-1.5"><div className="w-2 h-2 bg-foreground rounded-full animate-bounce" /><div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:0.4s]" /></div>}
                    </div>
                    <div className="text-lg leading-relaxed font-bold whitespace-pre-wrap selection:bg-foreground selection:text-background">
                      {synthesisOutput || "Menunggu data dari Swarm Multi-Agen..."}
                    </div>
                  </motion.div>
                ) : documents.length > 0 ? (
                  <div className="p-12 border-2 border-dashed border-border rounded-[3rem] text-center space-y-4 opacity-40">
                    <Activity className="w-12 h-12 mx-auto animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Menunggu Input atau Perintah Penelitian...</p>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background/90 to-transparent pt-20">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-2 bg-foreground/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <form onSubmit={handleChatSubmit} className="relative flex items-center bg-card border-4 border-foreground rounded-full px-10 py-6 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] saturated-bar">
              <Search className="w-7 h-7 text-foreground mr-6" />
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isStreaming}
                placeholder="KENDALIKAN INTELIJEN..." 
                className="flex-1 bg-transparent border-none outline-none text-xl font-black text-foreground placeholder:text-foreground/10 disabled:opacity-50 uppercase tracking-tighter"
              />
              <button type="submit" disabled={isStreaming} className="bg-foreground text-background p-4 rounded-full transition-all ml-6 shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-50">
                <ChevronRight className="w-6 h-6 stroke-[4px]" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="hidden xl:flex w-96 border-l border-border bg-card flex-col z-20 overflow-y-auto">
        <div className="p-8 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
          <h2 className="font-black tracking-[0.2em] text-[10px] uppercase text-foreground-muted">Intelijen Riset</h2>
          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-foreground text-background">VERSI BETA V4</span>
        </div>

        <div className="p-8 space-y-12">
          {/* CEK CELAH RISET */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg"><AlertCircle className="w-4 h-4 text-rose-500" /></div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">Deteksi Celah Riset</h3>
            </div>
            {documents.length > 0 ? (
              <div className="p-6 rounded-3xl bg-rose-500/[0.03] border border-rose-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity"><Target className="w-10 h-10" /></div>
                <p className="text-xs font-bold text-rose-500 leading-relaxed whitespace-pre-wrap relative z-10">
                  {researchGap || "Menunggu analisis mendalam dari Methodology Critic..."}
                </p>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-border rounded-3xl text-center"><p className="text-[10px] font-black text-foreground-muted/30 uppercase">Unggah dokumen untuk deteksi celah</p></div>
            )}
          </div>

          {/* GRAFIK PENGETAHUAN */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Network className="w-4 h-4 text-indigo-500" /></div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">Grafik Pengetahuan</h3>
            </div>
            <div className="aspect-[4/5] w-full rounded-[2.5rem] border-2 border-border bg-foreground/[0.02] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-foreground/20 transition-all">
              {documents.length > 0 ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-foreground)_0%,transparent_70%)] opacity-[0.03] animate-pulse" />
                  {knowledgeGraph ? (
                    <div className="absolute inset-0 z-10 p-6 text-[10px] text-foreground font-mono overflow-y-auto whitespace-pre-wrap font-bold leading-relaxed">
                      {knowledgeGraph}
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-full border-4 border-foreground/10 border-t-foreground animate-spin mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Memetakan Hubungan...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-10 space-y-4 opacity-20">
                  <Network className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Unggah jurnal untuk memetakan hubungan konsep</p>
                </div>
              )}
            </div>
          </div>

          {/* STATUS AGEN */}
          <div className="space-y-5 pb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Cpu className="w-4 h-4 text-indigo-500" /></div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">Aktivitas Swarm Agen</h3>
            </div>
            <div className="grid gap-3">
              {[
                { label: 'Agen Pengambil', status: agentStatus.retriever, color: 'bg-emerald-500' },
                { label: 'Kritikus Metodologi', status: agentStatus.critic, color: 'bg-rose-500' },
                { label: 'Ekstraktor Grafik', status: agentStatus.graph, color: 'bg-indigo-500' },
                { label: 'Penyintesis AI', status: agentStatus.synthesizer, color: 'bg-indigo-500' }
              ].map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.03] border border-border transition-all hover:bg-foreground/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", agent.status !== 'Siap' && agent.status !== 'Selesai' ? `${agent.color} animate-ping` : "bg-foreground/20")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{agent.label}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase opacity-40">{agent.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
