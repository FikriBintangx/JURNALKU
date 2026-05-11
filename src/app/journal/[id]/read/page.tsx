'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { journalService } from '@/services/journalService';
import { Journal } from '@/types/journal';
import PDFViewer from '@/components/PDFViewer';
import { Send, Bot, User, ArrowLeft, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ReadJournal() {
  const { id } = useParams();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya asisten AI Anda untuk jurnal ini. Ada yang bisa saya bantu jelaskan hari ini?' }
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      setLoading(true);
      const data = await journalService.getDetail(id as string);
      setJournal(data);
      setLoading(false);
    }
    fetchDetail();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !journal) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          context: journal.abstract || "Tidak ada abstrak yang tersedia.",
          title: journal.title 
        }),
      });
      
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        throw new Error(data.error || 'Gagal mendapatkan jawaban');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Maaf, saya mengalami kesalahan saat menghubungkan ke Gemini API. Periksa kembali API Key Anda." 
      }]);
    }
  };

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!journal?.openAccessPdf?.url) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center text-white p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">PDF Tidak Tersedia</h2>
      <p className="text-slate-400 mb-8">Jurnal ini bukan akses terbuka atau tautan PDF dibatasi.</p>
      <Link href={`/journal/${id}`} className="bg-indigo-600 px-6 py-2 rounded-lg font-bold">
        Kembali ke Detail
      </Link>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 glass border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4 overflow-hidden">
          <Link href={`/journal/${id}`} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-sm truncate">{journal.title}</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Mode Pembaca</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
            AI AKTIF
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-grow flex overflow-hidden">
        {/* PDF Section */}
        <div className="flex-grow bg-black/40 p-4">
          <PDFViewer url={journal.openAccessPdf.url} />
        </div>

        {/* AI Chat Sidebar */}
        <aside className="w-[400px] border-l border-white/10 flex flex-col glass shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center">
              <Bot className="w-5 h-5 mr-2 text-indigo-400" />
              Asisten Riset AI
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya apapun tentang jurnal ini..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-500 mt-3 text-center flex items-center justify-center">
              <Sparkles className="w-3 h-3 mr-1" />
              Didukung oleh JurnalStar Intelligence
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
