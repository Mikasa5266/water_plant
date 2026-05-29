import { create } from 'zustand';
import type { PlantOverview, Device, Alert } from '../types/index';
import { getPlantOverview, listDevices, listAlerts } from '../api/services';

export interface PlantDataState {
  overview: PlantOverview | null;
  devices: Device[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

export interface PlantDataActions {
  fetchOverview: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const usePlantDataStore = create<PlantDataState & PlantDataActions>((set, get) => ({
  overview: null,
  devices: [],
  alerts: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchOverview: async () => {
    try {
      const overview = await getPlantOverview();
      set({ overview });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch overview' });
    }
  },

  fetchDevices: async () => {
    try {
      const devices = await listDevices();
      set({ devices });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch devices' });
    }
  },

  fetchAlerts: async () => {
    try {
      const alerts = await listAlerts();
      set({ alerts });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch alerts' });
    }
  },

  refreshAll: async () => {
    set({ isLoading: true, error: null });
    const { fetchOverview, fetchDevices, fetchAlerts } = get();
    await Promise.all([fetchOverview(), fetchDevices(), fetchAlerts()]);
    set({ isLoading: false, lastFetchedAt: Date.now() });
  },
}));
