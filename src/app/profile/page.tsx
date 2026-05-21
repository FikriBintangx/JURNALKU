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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

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
            <div className="bg-card text-card-foreground rounded-3xl border border-border/50 shadow-sm p-8 text-center space-y-6">
              <div className="relative inline-block group">
                <div className="w-32 h-32 bg-card-foreground/5 rounded-[2.5rem] flex items-center justify-center border-2 border-card-foreground/10 overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 opacity-20" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-card-foreground text-card rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-4 border-card">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tighter uppercase">{user?.name || 'Peneliti'}</h1>
                <p className="text-[10px] font-black text-card-foreground/60 uppercase tracking-[0.3em]">Peneliti Aktif</p>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-3xl border border-border/50 shadow-sm overflow-hidden p-2 space-y-1">
              {[
                { id: 'account', label: 'Profil Saya', icon: User },
                { id: 'security', label: 'Keamanan', icon: Shield },
                { id: 'notifications', label: 'Notifikasi', icon: Bell },
                { id: 'settings', label: 'Pengaturan', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative w-full flex items-center justify-between p-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl group overflow-hidden",
                    activeTab === tab.id ? "text-card" : "hover:bg-card-foreground/5 text-card-foreground/60 hover:text-card-foreground"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-card-foreground shadow-2xl z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <tab.icon className={cn("w-4 h-4 transition-colors", activeTab === tab.id ? "text-card" : "text-card-foreground/40 group-hover:text-card-foreground")} />
                    <span>{tab.label}</span>
                  </div>
                  
                  <div className="relative z-10">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-500", 
                      activeTab === tab.id ? "bg-card scale-150" : "bg-card-foreground/10 group-hover:bg-card-foreground/40"
                    )} />
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all rounded-2xl border-2 border-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card text-card-foreground rounded-3xl border border-border/50 shadow-sm p-12 space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {activeTab === 'account' ? 'Pengaturan Profil' : 
                   activeTab === 'security' ? 'Keamanan Akun' :
                   activeTab === 'notifications' ? 'Notifikasi & Berita' : 'Konfigurasi Sistem'}
                </h2>
                <p className="text-card-foreground/60 text-sm font-medium">
                  Kelola informasi akun dan preferensi riset Anda di sini.
                </p>
              </div>

              <div className="space-y-8">
                {activeTab === 'account' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-card-foreground/60 ml-1">Nama Lengkap</label>
                        <input 
                          type="text" 
                          defaultValue={user?.name}
                          className="w-full bg-card-foreground/5 border-2 border-card-foreground/10 rounded-2xl px-6 py-4 text-sm font-bold text-card-foreground focus:bg-card focus:border-card-foreground/20 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-card-foreground/60 ml-1">Alamat Email</label>
                        <input 
                          type="email" 
                          defaultValue={user?.email}
                          className="w-full bg-card-foreground/5 border-2 border-card-foreground/10 rounded-2xl px-6 py-4 text-sm font-bold text-card-foreground focus:bg-card focus:border-card-foreground/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-card-foreground/60 ml-1">Bio Singkat</label>
                      <textarea 
                        rows={4}
                        placeholder="Ceritakan sedikit tentang fokus riset Anda..."
                        className="w-full bg-card-foreground/5 border-2 border-card-foreground/10 rounded-2xl px-6 py-4 text-sm font-bold text-card-foreground focus:bg-card focus:border-card-foreground/20 transition-all outline-none resize-none placeholder:text-card-foreground/30"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="p-8 bg-card-foreground/5 rounded-3xl border-2 border-card-foreground/10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase text-card-foreground">Multi-Factor Authentication</p>
                          <p className="text-xs text-card-foreground/60">Add an extra layer of biometric security.</p>
                        </div>
                        <div className="w-12 h-6 bg-card-foreground rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-card rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-card-foreground/60 ml-1">Update Password</label>
                      <button className="w-full text-left bg-card-foreground/5 border-2 border-card-foreground/10 rounded-2xl px-6 py-4 text-sm font-bold text-card-foreground hover:bg-card-foreground/10 transition-all flex items-center justify-between">
                        <span>Change Access Secret</span>
                        <ArrowRight className="w-4 h-4 opacity-20" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-card-foreground/10 flex justify-end">
                <button className="bg-card-foreground text-card px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
