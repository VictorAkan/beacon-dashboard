import { create } from 'zustand';

export type Role = 'FIRE' | 'SECURITY' | 'MEDICAL' | null;

interface AuthState {
  user: { name: string; role: Role } | null;
  login: (name: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (name, role) => set({ user: { name, role } }),
  logout: () => set({ user: null }),
}));
