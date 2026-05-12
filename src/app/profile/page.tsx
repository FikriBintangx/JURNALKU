'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Settings, LogOut, Camera, Save, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch (err) {}
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-20">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-8">
            <div className="mono-card p-8 text-center space-y-6">
              <div className="relative inline-block group">
                <div className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center border-2 border-border overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 opacity-20" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-4 border-background">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tighter uppercase">{user?.name || 'Researcher'}</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Level 4 Academic Intelligence</p>
              </div>
            </div>

            <div className="mono-card overflow-hidden">
              {[
                { id: 'account', label: 'Account Systems', icon: User },
                { id: 'security', label: 'Security Layer', icon: Shield },
                { id: 'notifications', label: 'Signal Feed', icon: Bell },
                { id: 'settings', label: 'Core Config', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 text-[10px] font-black uppercase tracking-widest transition-all border-b border-border/50 last:border-0",
                    activeTab === tab.id ? "bg-foreground text-background" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  <div className={cn("w-1.5 h-1.5 rounded-full", activeTab === tab.id ? "bg-background" : "bg-foreground/20")} />
                </button>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-3 p-5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all rounded-2xl border-2 border-red-500/10">
              <LogOut className="w-4 h-4" />
              <span>Terminate Session</span>
            </button>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mono-card p-12 space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {activeTab === 'account' ? 'Identity Management' : 
                   activeTab === 'security' ? 'Access Credentials' :
                   activeTab === 'notifications' ? 'Intelligence Alerts' : 'Interface Configuration'}
                </h2>
                <p className="text-muted-foreground text-sm font-medium opacity-60">
                  Update your research environment parameters and authentication tokens.
                </p>
              </div>

              <div className="space-y-8">
                {activeTab === 'account' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Legal Identifier</label>
                        <input 
                          type="text" 
                          defaultValue={user?.name}
                          className="w-full bg-muted/50 border-2 border-border rounded-2xl px-6 py-4 text-sm font-bold focus:bg-background focus:border-foreground/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Communication Endpoint</label>
                        <input 
                          type="email" 
                          defaultValue={user?.email}
                          className="w-full bg-muted/50 border-2 border-border rounded-2xl px-6 py-4 text-sm font-bold focus:bg-background focus:border-foreground/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Research Biography</label>
                      <textarea 
                        rows={4}
                        placeholder="State your primary research objectives..."
                        className="w-full bg-muted/50 border-2 border-border rounded-2xl px-6 py-4 text-sm font-bold focus:bg-background focus:border-foreground/20 transition-all outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="p-8 bg-muted rounded-3xl border-2 border-foreground/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase">Multi-Factor Authentication</p>
                          <p className="text-xs text-muted-foreground">Add an extra layer of biometric security.</p>
                        </div>
                        <div className="w-12 h-6 bg-foreground rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Update Password</label>
                      <button className="w-full text-left bg-muted/50 border-2 border-border rounded-2xl px-6 py-4 text-sm font-bold hover:bg-muted transition-all flex items-center justify-between">
                        <span>Change Access Secret</span>
                        <ArrowRight className="w-4 h-4 opacity-20" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-border/50 flex justify-end">
                <button className="bg-foreground text-background px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <Save className="w-4 h-4" />
                  <span>Sync Parameters</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
