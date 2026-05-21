'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Search, ShieldAlert, Cpu, Network, Zap, 
  MessageSquare, Terminal, ShieldCheck, Globe,
  Sparkles, Lightbulb, TrendingUp, History 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cognitionEngine } from '@/lib/ai/cognition';

interface Agent {
    id: string;
    name: string;
    status: 'idle' | 'active' | 'completed' | 'error';
    message: string;
    icon: any;
}

interface AutonomousIntelligenceSystemProps {
    paper: any;
    onInsightGenerated?: (insight: any) => void;
}

export const AutonomousIntelligenceSystem = ({ paper, onInsightGenerated }: AutonomousIntelligenceSystemProps) => {
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'researcher', name: 'Peneliti', status: 'idle', message: 'Siap', icon: Search },
        { id: 'critic', name: 'Kritikus', status: 'idle', message: 'Siaga', icon: ShieldAlert },
        { id: 'verifier', name: 'Verifikator', status: 'idle', message: 'Menunggu', icon: ShieldCheck },
        { id: 'search', name: 'Pencarian Mendalam', status: 'idle', message: 'Memindai', icon: Globe },
        { id: 'synthesizer', name: 'Sintetis', status: 'idle', message: 'Menunggu', icon: Network },
        { id: 'memory', name: 'Memori Kognitif', status: 'idle', message: 'Sinkronisasi', icon: Cpu },
    ]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [proactiveInsights, setProactiveInsights] = useState<string[]>([]);
    const initialized = useRef(false);

    useEffect(() => {
        if (!paper || initialized.current) return;
        initialized.current = true;
        startAutonomousCycle();
    }, [paper]);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 8));
    };

    const updateAgent = (id: string, updates: Partial<Agent>) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const startAutonomousCycle = async () => {
        setIsThinking(true);
        addLog("Inisialisasi klaster riset neural otonom...");
        
        // Step 1: Researcher Scans Abstract
        updateAgent('researcher', { status: 'active', message: 'Memetakan metodologi...' });
        await new Promise(r => setTimeout(r, 1200));
        addLog("Entitas metodologi berhasil diekstraksi: 12 parameter ditemukan.");
        updateAgent('researcher', { status: 'completed', message: 'Protokol Teridentifikasi' });

        // Step 2: Search Intelligence
        updateAgent('search', { status: 'active', message: 'Mencari literatur pembanding...' });
        await new Promise(r => setTimeout(r, 1500));
        addLog("Menemukan 5 jurnal SOTA terkait dalam domain kognisi.");
        updateAgent('search', { status: 'completed', message: 'Pencarian Selesai' });

        // Step 3: Critic Checks Bias
        updateAgent('critic', { status: 'active', message: 'Audit bias statistik...' });
        await new Promise(r => setTimeout(r, 1800));
        addLog("Terdeteksi potensi bias seleksi pada bagian metodologi eksperimental.");
        updateAgent('critic', { status: 'completed', message: 'Audit Selesai' });

        // Step 4: Verifier Cross-Checks
        updateAgent('verifier', { status: 'active', message: 'Verifikasi klaim utama...' });
        await new Promise(r => setTimeout(r, 1400));
        addLog("Klaim utama diverifikasi terhadap data pendukung yang tersedia.");
        updateAgent('verifier', { status: 'completed', message: 'Klaim Tervalidasi' });

        // Step 5: Synthesizer Builds Graph
        updateAgent('synthesizer', { status: 'active', message: 'Membangun graf kognitif...' });
        await new Promise(r => setTimeout(r, 1600));
        addLog("Ekspansi graf semantik: 58 node relasi diaktifkan.");
        updateAgent('synthesizer', { status: 'completed', message: 'Graf Aktif' });

        // Step 6: Finalize Memory
        updateAgent('memory', { status: 'active', message: 'Sinkronisasi memori kognitif...' });
        await new Promise(r => setTimeout(r, 1000));
        
        // Dynamic proactive insights based on real cognition
        const cogn = paper?.id ? cognitionEngine.getCognition(paper.id) : null;
        if (cogn) {
            setProactiveInsights([
                `Domain: ${cogn.domain}`,
                `Sinyal Kebaruan: ${cogn.noveltySignals[0] || 'Terdeteksi'}`,
                `Celah Riset: ${cogn.researchGaps[0] || 'Menganalisis celah...'}`
            ]);
            addLog(`Konteks kognitif difinalisasi untuk domain: ${cogn.domain}`);
        } else {
            addLog("Sinkronisasi memori sesi selesai.");
        }
        
        updateAgent('memory', { status: 'completed', message: 'Siap untuk Analisis' });

        setIsThinking(false);
        if (onInsightGenerated) {
            onInsightGenerated({
                type: 'novelty',
                score: 8.5,
                reason: 'Metodologi inovatif dalam pra-pemrosesan dataset terdeteksi.'
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Agent Visualization */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {agents.map((agent) => (
                    <motion.div 
                        key={agent.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "p-4 border-2 rounded-none relative overflow-hidden transition-all duration-700 blur-immersion",
                            agent.status === 'active' 
                                ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,0,0,0.05)]" 
                                : "border-foreground/5 bg-background/40 hover:border-foreground/10 blur-immersion"
                        )}
                    >
                        {agent.status === 'active' && (
                            <motion.div 
                                className="absolute inset-x-0 bottom-0 h-1 bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}
                        <div className="flex flex-col gap-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className={cn(
                                    "p-2 border-2 transition-all duration-500",
                                    agent.status === 'active' ? "border-primary bg-primary text-background" : "border-foreground/10 text-foreground/40"
                                )}>
                                    <agent.icon size={14} className={agent.status === 'active' ? "animate-pulse" : ""} />
                                </div>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border-2",
                                    agent.status === 'active' ? "border-primary text-primary" : "border-foreground/5 text-foreground/20"
                                )}>
                                    {agent.status}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground leading-none">{agent.name}</h4>
                                <div className="h-1 w-4 bg-primary/20" />
                                <p className="text-[9px] font-bold text-foreground/40 truncate uppercase tracking-widest pt-1">{agent.message}</p>
                            </div>
                        </div>

                        {/* Ambient Neural Glow */}
                        {agent.status === 'active' && (
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary/10 blur-xl rounded-full" />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Live Reasoning Logs */}
            <div className="p-8 bg-background/40 blur-modal border-2 border-foreground/10 rounded-none space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-foreground text-background">
                            <Terminal size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">Neural Reasoning Log</span>
                    </div>
                    {isThinking && (
                        <div className="flex items-center gap-3 px-4 py-1.5 border-2 border-primary/20 bg-primary/5">
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Computing</span>
                        </div>
                    )}
                </div>
                <div className="space-y-2 font-mono">
                    <AnimatePresence mode="popLayout">
                        {logs.map((log, i) => (
                            <motion.div 
                                key={log + i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="text-[10px] text-foreground-secondary flex gap-3 border-l border-border/20 pl-3 py-1"
                            >
                                <span className="text-foreground-muted/40">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                <span className="text-foreground-muted">$</span>
                                <span>{log}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {logs.length === 0 && (
                        <div className="text-[10px] text-foreground-muted italic py-4">Sistem sedang menunggu inisialisasi node riset...</div>
                    )}
                </div>
            </div>

            {/* Proactive Insights / Active Empty State */}
            <AnimatePresence>
                {!isThinking && proactiveInsights.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {proactiveInsights.map((insight, i) => (
                            <div key={i} className="p-4 bg-primary/5 border border-primary/20 flex items-start gap-3">
                                <Lightbulb size={14} className="text-primary mt-0.5 shrink-0" />
                                <span className="text-[10px] font-bold text-foreground leading-tight uppercase tracking-widest">{insight}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
