import { create } from 'zustand';

interface AlertStore {
  alerts: Record<string, any>;
  selectedEmergencyId: string | null;
  setAlerts: (alerts: Record<string, any>) => void;
  setSelectedEmergencyId: (id: string | null) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: {},
  selectedEmergencyId: null,
  setAlerts: (alerts) => set({ alerts }),
  setSelectedEmergencyId: (id) => set({ selectedEmergencyId: id }),
}));
