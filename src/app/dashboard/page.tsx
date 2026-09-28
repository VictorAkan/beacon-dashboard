'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlertStore } from '@/store/useAlertStore';
import DashboardMap from '@/components/Map';
import { LogOut, Bell, Shield, Activity, Flame, Users, MapPin, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { alerts, selectedEmergencyId, setSelectedEmergencyId } = useAlertStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'responders'>('dashboard');
  const previousAlertCount = useRef(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Request notification permission and handle incoming alerts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const currentCount = Object.keys(alerts).length;
    if (currentCount > previousAlertCount.current && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('New Emergency Alert!', {
          body: `A new ${user?.role || ''} emergency has been reported.`,
          icon: '/favicon.ico',
        });
      }
    }
    previousAlertCount.current = currentCount;
  }, [alerts, user?.role]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'FIRE': return <Flame className="text-red-500" />;
      case 'SECURITY': return <Shield className="text-blue-500" />;
      case 'MEDICAL': return <Activity className="text-green-500" />;
      default: return <Users />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Activity className="text-red-500" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Beacon</h1>
            <p className="text-xs text-white/50">Command Center</p>
          </div>
        </div>
        
        <div className="flex-1 py-4 flex flex-col space-y-1 overflow-hidden">
          <div className="px-6 mb-2">
            <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Overview</span>
          </div>
          <div className="px-4 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={clsx("w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors", activeTab === 'dashboard' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
            >
              <DashboardIcon /> Map View
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={clsx("w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors justify-between", activeTab === 'alerts' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
            >
              <div className="flex items-center gap-3"><Activity size={18} /> Active Alerts</div>
              {Object.keys(alerts).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{Object.keys(alerts).length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('responders')}
              className={clsx("w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors", activeTab === 'responders' ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
            >
              <Users size={18} /> Responders
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 mt-6">
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Incoming Incidents</h3>
                {Object.keys(alerts).length === 0 ? (
                  <div className="text-center py-6 text-white/40 text-sm flex flex-col items-center">
                    <CheckCircle size={24} className="mb-2 opacity-50" />
                    All Clear
                  </div>
                ) : (
                  Object.entries(alerts).map(([id, alert]) => (
                    <div 
                      key={id}
                      onClick={() => {
                        setSelectedEmergencyId(id);
                        setActiveTab('dashboard'); // switch to map view
                      }}
                      className={clsx("p-3 rounded-xl border cursor-pointer transition-all", selectedEmergencyId === id ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10")}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{alert.type || 'Emergency'}</span>
                      </div>
                      {alert.timestamp && (
                        <p className="text-[10px] text-white/50 mb-2">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-white/70">
                        <MapPin size={12} />
                        <span className="truncate">Lat: {alert.latitude.toFixed(4)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'responders' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Active Units</h3>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    {getRoleIcon()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name} (You)</p>
                    <p className="text-[10px] text-green-400 font-medium">On Duty • En Route</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              {getRoleIcon()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-white/50">{user.role} UNIT</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-white/70 transition-all text-sm font-medium"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-semibold">Live Map Tracking</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
            <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-white/70" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
            </button>
          </div>
        </header>

        {/* Map Area */}
        <div className="flex-1 p-6 relative">
          <DashboardMap />
        </div>
      </main>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  );
}
