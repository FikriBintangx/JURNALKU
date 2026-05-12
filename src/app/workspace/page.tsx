"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
 UploadCloud, FileText, Folder, Network, 
 Sparkles, BrainCircuit, Search, GitCompare, 
 ChevronRight, BookOpen, AlertCircle, FilePlus, Menu, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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
 retriever: 'Idle',
 critic: 'Idle',
 synthesizer: 'Idle',
 graph: 'Idle'
 });
 const [vectorStats, setVectorStats] = useState({ docs: 0, chunks: 0 });

 // Fetch Vector Stats on mount
 React.useEffect(() => {
 const initWorkspace = async () => {
 try {
 // 1. Get Logged in User
 const userRes = await fetch('/api/auth/me');
 const userData = await userRes.json();
 const activeUserId = userData?.user?.id || 'session_workspace';
 setUser(userData?.user || { id: 'session_workspace' });

 // 2. Fetch Stats & Documents
 const res = await fetch(`/api/workspace/stats?userId=${activeUserId}`);
 const data = await res.json();
 if (data.success) {
 setVectorStats({ docs: data.docs, chunks: data.chunks });
 if (data.documents) {
 setDocuments(data.documents);
 }
 // 3. Fetch Collections
 const colRes = await fetch(`/api/workspace/collections?userId=${activeUserId}`);
 const colData = await colRes.json();
 if (colData.collections) {
 setCollections(colData.collections);
 }
 }
 } catch (err) {}
 };
 initWorkspace();
 }, []);

 // Mock Upload Handler
 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsUploading(true);
 setStreamText("Menganalisis dokumen PDF: Ekstraksi struktur, metode, dan batas penelitian...");
 
 // Create FormData
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
 setStreamText("Dokumen berhasil diserap ke dalam Vector Memory. Memulai pemetaan Knowledge Graph lokal...");
 } else {
 setStreamText("Gagal memproses dokumen: " + data.error);
 }
 } catch (err) {
 setStreamText("Terjadi kesalahan jaringan.");
 } finally {
 setIsUploading(false);
 }
 };

 // SSE Chat Stream Handler
 const handleChatSubmit = async (e?: React.FormEvent) => {
 e?.preventDefault();
 if (!chatInput.trim() || isStreaming) return;

 setIsStreaming(true);
 setSynthesisOutput("");
 setStreamText("Memulai sirkuit Multi-Agent...");
 setAgentStatus({ retriever: 'Idle', critic: 'Idle', synthesizer: 'Idle', graph: 'Idle' });
 
 try {
 const response = await fetch('/api/workspace/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ query: chatInput, userId: 'session_workspace', mode: activeTab })
 });

 if (!response.body) throw new Error("No stream found");
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
 }
 };

 return (
 <div className="flex flex-col md:flex-row h-screen bg-[#FAFAFA] text-slate-900 overflow-hidden font-sans">
 
 {/* ========================================== */}
 {/* MOBILE OVERLAY */}
 {isMobileMenuOpen && (
 <div 
 className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
 onClick={() => setIsMobileMenuOpen(false)}
 />
 )}
 {/* LEFT PANEL: LIBRARY & MEMORY */}
 {/* ========================================== */}
 <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
 <div className="p-6 border-b border-slate-200 flex items-center justify-between">
 <div 
 onClick={() => router.push('/')}
 className="flex items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity"
 title="Kembali ke Menu Utama"
 >
 <BrainCircuit className="w-5 h-5 text-slate-900" />
 <h2 className="font-bold tracking-tight text-sm">ISAGI Workspace</h2>
 </div>
 <button 
 className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
 onClick={() => setIsMobileMenuOpen(false)}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 flex-1 overflow-y-auto space-y-6">
 {/* Upload Button */}
 <div className="relative group cursor-pointer">
 <input 
 type="file" 
 accept=".pdf" 
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 onChange={handleFileUpload}
 disabled={isUploading}
 />
 <div className="flex items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-100 hover:bg-slate-100 transition-all">
 {isUploading ? (
 <div className="flex items-center space-x-2 text-slate-900 ">
 <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
 <span className="text-sm font-medium">Processing RAG...</span>
 </div>
 ) : (
 <div className="flex items-center space-x-2 text-slate-900 ">
 <UploadCloud className="w-4 h-4" />
 <span className="text-sm font-medium">Upload PDF / DOCX</span>
 </div>
 )}
 </div>
 </div>

 {/* Library List */}
 <div>
 <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Personal Memory</h3>
 <ul className="space-y-1">
 {documents.length === 0 ? (
 <li className="text-sm text-slate-400 italic px-2">No documents yet</li>
 ) : (
 documents.map((doc, idx) => (
 <li key={idx} className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
 <FileText className="w-4 h-4 text-slate-700" />
 <span className="truncate">{doc.fileName || doc}</span>
 </li>
 ))
 )}
 </ul>
 </div>

 {/* Collections */}
 <div>
 <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Collections</h3>
 <ul className="space-y-1">
 {collections.length === 0 ? (
 <li className="text-sm text-slate-400 italic px-2">No collections yet</li>
 ) : (
 collections.map((col, idx) => (
 <li key={idx} className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group">
 <Folder className="w-4 h-4 text-slate-700" />
 <span className="truncate flex-1">{col.name}</span>
 <span className="text-[10px] font-bold opacity-0 group-hover:opacity-50 transition-opacity">
 {col._count?.documents || 0}
 </span>
 </li>
 ))
 )}
 <li onClick={() => router.push('/library')} className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors text-slate-400 mt-2">
 <FilePlus className="w-4 h-4" />
 <span>New Collection</span>
 </li>
 </ul>
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 bg-slate-50">
 <button onClick={() => router.push('/')} className="w-full flex items-center justify-center space-x-2 text-sm px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm font-medium">
 <span>← Kembali ke Menu Utama</span>
 </button>
 </div>
 </aside>

 {/* ========================================== */}
 {/* CENTER PANEL: ORCHESTRATOR & SYNTHESIS */}
 {/* ========================================== */}
 <main className="flex-1 flex flex-col relative bg-[#FAFAFA] ">
 {/* Top Navbar */}
 <header className="h-16 border-b border-slate-200 flex items-center px-4 md:px-6 justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10 gap-2">
 <div className="flex items-center gap-2 overflow-hidden flex-1 md:flex-none">
 <button 
 onClick={() => setIsMobileMenuOpen(true)}
 className="p-2 -ml-2 rounded-md hover:bg-slate-100 md:hidden text-slate-600 shrink-0"
 >
 <Menu className="w-5 h-5" />
 </button>
 <div className="flex space-x-1.5 bg-slate-100 p-1.5 rounded-full overflow-x-auto no-scrollbar w-full md:w-auto">
 <button onClick={() => setActiveTab('synthesis')} className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'synthesis' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>AI Synthesis</button>
 <button onClick={() => setActiveTab('review')} className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'review' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>Literature Review</button>
 <button onClick={() => setActiveTab('compare')} className={`whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full transition-all flex items-center space-x-2 ${activeTab === 'compare' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}>
 <GitCompare className="w-4 h-4" />
 <span>Compare</span>
 </button>
 </div>
 </div>
 <div className="hidden md:flex items-center space-x-3 pr-2 shrink-0">
 <div className="whitespace-nowrap flex items-center space-x-2 text-xs font-medium text-slate-500">
 <span>Vector Engine Ready ({vectorStats.docs} Docs / {vectorStats.chunks} Chunks)</span>
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
 </div>
 </div>
 </header>

 {/* Workspace Canvas */}
 <div className="flex-1 overflow-y-auto p-8 relative">
 
 <div className="max-w-4xl mx-auto space-y-8 pb-32">
 
 {/* Streaming Orchestrator Status */}
 <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4 flex items-start space-x-4">
 <div className="mt-1">
 <Sparkles className="w-5 h-5 text-slate-900" />
 </div>
 <div className="flex-1">
 <h4 className="text-sm font-semibold text-slate-900 mb-1">ISAGI Orchestrator</h4>
 <p className="text-sm text-slate-900 font-mono tracking-tight leading-relaxed">
 {streamText}
 </p>
 </div>
 </div>

 {/* AI Output Area */}
 <div className="prose prose-slate max-w-none">
 <h1 className="text-3xl font-bold tracking-tight mb-2">Synthesis Workspace</h1>
 <p className="text-slate-500 text-lg leading-relaxed mb-8">
 Ruang riset otonom Anda. Unggah PDF untuk mulai mengekstraksi metodologi, mendeteksi gap penelitian, dan membangun tinjauan pustaka secara otomatis.
 </p>

 {synthesisOutput || isStreaming ? (
 <motion.div 
 initial={{ opacity: 0, y: 20 }} 
 animate={{ opacity: 1, y: 0 }}
 className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
 >
 <h3 className="flex items-center space-x-2 text-lg font-semibold mb-4 border-b border-slate-100 pb-3">
 <BookOpen className="w-5 h-5 text-slate-700" />
 <span>Live AI Synthesis</span>
 {isStreaming && <span className="flex h-2 w-2 ml-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
 </h3>
 <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
 {synthesisOutput || "Menunggu data dari Multi-Agent..."}
 </div>
 </motion.div>
 ) : documents.length > 0 ? (
 <motion.div 
 initial={{ opacity: 0, y: 20 }} 
 animate={{ opacity: 1, y: 0 }}
 className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
 >
 <h3 className="flex items-center space-x-2 text-lg font-semibold mb-4 border-b border-slate-100 pb-3">
 <BookOpen className="w-5 h-5 text-slate-700" />
 <span>Auto-Generated Summary</span>
 </h3>
 <div className="space-y-4">
 <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
 <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
 <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
 </div>
 </motion.div>
 ) : null}
 </div>

 </div>
 </div>

 {/* Global Input Bar */}
 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
 <div className="max-w-3xl mx-auto relative group">
 <div className="absolute inset-0 bg-slate-100 blur-xl rounded-full group-hover:bg-slate-100 transition-all opacity-50"></div>
 <form onSubmit={handleChatSubmit} className="relative flex items-center bg-white border border-slate-200 rounded-full px-6 py-4 shadow-2xl">
 <Search className="w-5 h-5 text-slate-400 mr-3" />
 <input 
 type="text" 
 value={chatInput}
 onChange={(e) => setChatInput(e.target.value)}
 disabled={isStreaming}
 placeholder="Tanya memori Anda, suruh agen berdebat, atau minta tinjauan pustaka..." 
 className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 disabled:opacity-50"
 />
 <button type="submit" disabled={isStreaming} className="bg-slate-100 hover:bg-slate-100 text-white p-2 rounded-full transition-colors ml-3 shadow-md disabled:opacity-50">
 <ChevronRight className="w-4 h-4" />
 </button>
 </form>
 </div>
 </div>
 </main>

 {/* ========================================== */}
 {/* RIGHT PANEL: KNOWLEDGE & INSIGHTS */}
 {/* ========================================== */}
 <aside className="hidden lg:flex w-80 border-l border-slate-200 bg-white flex-col z-10">
 <div className="p-4 border-b border-slate-200 ">
 <h2 className="font-bold tracking-tight text-sm uppercase text-slate-500">Research Intelligence</h2>
 </div>

 <div className="p-4 space-y-6 overflow-y-auto">
 {/* Research Gap Detector */}
 <div>
 <div className="flex items-center space-x-2 mb-3">
 <AlertCircle className="w-4 h-4 text-rose-500" />
 <h3 className="text-sm font-semibold">Research Gap Detected</h3>
 </div>
 {documents.length > 0 ? (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 ">
 <p className="text-xs text-rose-800 leading-relaxed whitespace-pre-wrap">
 {researchGap || "Waiting for Methodology Critic to analyze..."}
 </p>
 </div>
 ) : (
 <p className="text-xs text-slate-400 italic">No gaps detected yet. Upload a paper.</p>
 )}
 </div>

 {/* Knowledge Graph Preview */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center space-x-2">
 <Network className="w-4 h-4 text-slate-800" />
 <h3 className="text-sm font-semibold">Knowledge Graph</h3>
 </div>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 ">BETA</span>
 </div>
 <div className="aspect-square w-full rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
 {documents.length > 0 ? (
 <>
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 
 {knowledgeGraph ? (
 <div className="absolute inset-0 z-10 p-4 text-[10px] text-slate-800 font-mono overflow-y-auto whitespace-pre-wrap">
 {knowledgeGraph}
 </div>
 ) : (
 <div className="w-8 h-8 rounded-full bg-slate-200 shadow-lg shadow-purple-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
 <span className="text-white text-[10px] font-bold">{documents.length}</span>
 </div>
 )}
 {/* Decorative nodes */}
 <div className="w-3 h-3 rounded-full bg-blue-400 absolute top-10 left-10"></div>
 <div className="w-4 h-4 rounded-full bg-slate-200 absolute bottom-12 right-12"></div>
 <div className="w-2 h-2 rounded-full bg-rose-400 absolute top-20 right-10"></div>
 
 {/* Decorative lines connecting to center (simulated via SVG) */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-slate-500">
 <line x1="40" y1="40" x2="160" y2="160" strokeWidth="2" />
 <line x1="260" y1="210" x2="160" y2="160" strokeWidth="2" />
 <line x1="280" y1="80" x2="160" y2="160" strokeWidth="2" />
 </svg>
 </>
 ) : (
 <div className="text-center p-4">
 <Network className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
 <p className="text-xs text-slate-400">Upload papers to generate relationship map</p>
 </div>
 )}
 </div>
 </div>

 {/* Multi-Agent Panel */}
 <div>
 <div className="flex items-center space-x-2 mb-3">
 <BrainCircuit className="w-4 h-4 text-orange-500" />
 <h3 className="text-sm font-semibold">Agent Swarm Activity</h3>
 </div>
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100 ">
 <span className="flex items-center space-x-2"><span className={`w-1.5 h-1.5 rounded-full ${agentStatus.retriever !== 'Idle' ? 'bg-slate-200 animate-ping' : 'bg-slate-400'}`}></span><span>Retriever Agent</span></span>
 <span className="text-slate-400 truncate max-w-[120px]" title={agentStatus.retriever}>{agentStatus.retriever}</span>
 </div>
 <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100 ">
 <span className="flex items-center space-x-2"><span className={`w-1.5 h-1.5 rounded-full ${agentStatus.critic !== 'Idle' ? 'bg-orange-500 animate-ping' : 'bg-slate-400'}`}></span><span>Methodology Critic</span></span>
 <span className="text-slate-400 truncate max-w-[120px]" title={agentStatus.critic}>{agentStatus.critic}</span>
 </div>
 <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100 ">
 <span className="flex items-center space-x-2"><span className={`w-1.5 h-1.5 rounded-full ${agentStatus.graph !== 'Idle' ? 'bg-slate-200 animate-ping' : 'bg-slate-400'}`}></span><span>Graph Extractor</span></span>
 <span className="text-slate-400 truncate max-w-[120px]" title={agentStatus.graph}>{agentStatus.graph}</span>
 </div>
 <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100 ">
 <span className="flex items-center space-x-2"><span className={`w-1.5 h-1.5 rounded-full ${agentStatus.synthesizer !== 'Idle' ? 'bg-blue-500 animate-ping' : 'bg-slate-400'}`}></span><span>Synthesizer</span></span>
 <span className="text-slate-400 truncate max-w-[120px]" title={agentStatus.synthesizer}>{agentStatus.synthesizer}</span>
 </div>
 </div>
 </div>
 </div>
 </aside>

 </div>
 );
}
