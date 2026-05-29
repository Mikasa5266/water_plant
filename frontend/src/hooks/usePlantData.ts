import { useEffect, useRef } from 'react';
import { usePlantDataStore } from '../stores/usePlantDataStore';
import { isMockMode } from '../api/config';

const POLL_INTERVAL_MS = Number(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POLL_INTERVAL_MS) || 5000
);

export function usePlantData() {
  const refreshAll = usePlantDataStore((s) => s.refreshAll);
  const overview = usePlantDataStore((s) => s.overview);
  const devices = usePlantDataStore((s) => s.devices);
  const alerts = usePlantDataStore((s) => s.alerts);
  const isLoading = usePlantDataStore((s) => s.isLoading);
  const error = usePlantDataStore((s) => s.error);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    refreshAll();

    if (!isMockMode()) {
      intervalRef.current = setInterval(refreshAll, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshAll]);

  return { overview, devices, alerts, isLoading, error };
}
