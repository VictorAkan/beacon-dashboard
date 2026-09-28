'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, Role } from '@/store/useAuthStore';
import { Shield, Flame, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null; // Let the router do its thing
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedRole) {
      login(name, selectedRole);
      router.push('/dashboard');
    }
  };

  const roles: { value: Role; icon: any; label: string; color: string }[] = [
    { value: 'FIRE', icon: Flame, label: 'Fire Dept', color: 'text-red-500 bg-red-500/10 border-red-500/30' },
    { value: 'SECURITY', icon: Shield, label: 'Security', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { value: 'MEDICAL', icon: Activity, label: 'Medical', color: 'text-green-500 bg-green-500/10 border-green-500/30' },
  ];

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div className="w-full max-w-md bg-[#121212] p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <Activity className="text-red-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Beacon Web</h1>
          <p className="text-white/50 mt-2">Emergency Response Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Responder Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Select Unit
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                    selectedRole === r.value 
                      ? r.color + " border-opacity-100" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  )}
                >
                  <r.icon size={24} className="mb-2" />
                  <span className="text-xs font-semibold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || !selectedRole}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-red-500/25"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
