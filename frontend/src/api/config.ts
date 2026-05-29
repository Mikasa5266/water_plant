/// <reference types="vite/client" />

export type ApiMode = 'mock' | 'live';

export const API_MODE: ApiMode =
  (import.meta.env.VITE_API_MODE as ApiMode) ?? 'mock';

export const isMockMode = () => API_MODE === 'mock';
