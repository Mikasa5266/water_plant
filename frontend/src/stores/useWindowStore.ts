import { create } from 'zustand';
import type { AgentId, WindowState } from '../types/scenario';

// ─── Store 接口 ───

export interface WindowManagerState {
  windows: Record<AgentId, WindowState>;
  activeWindowId: AgentId | null;
  maxZIndex: number;
}

export interface WindowManagerActions {
  openWindow: (agentId: AgentId) => void;
  closeWindow: (agentId: AgentId) => void;
  minimizeWindow: (agentId: AgentId) => void;
  restoreWindow: (agentId: AgentId) => void;
  focusWindow: (agentId: AgentId) => void;
  moveWindow: (agentId: AgentId, position: { x: number; y: number }) => void;
  resizeWindow: (agentId: AgentId, size: { width: number; height: number }) => void;
  closeAllWindows: () => void;
  getOpenWindows: () => WindowState[];
}

const DEFAULT_WINDOW_SIZE = { width: 420, height: 520 };

const DEFAULT_POSITIONS: Record<AgentId, { x: number; y: number }> = {
  supervisor: { x: 200, y: 100 },
  dosing: { x: 260, y: 140 },
  uf: { x: 320, y: 180 },
  ro: { x: 380, y: 120 },
  pump: { x: 440, y: 160 },
};

function createDefaultWindow(agentId: AgentId): WindowState {
  return {
    agentId,
    isOpen: false,
    isMinimized: false,
    position: DEFAULT_POSITIONS[agentId],
    size: { ...DEFAULT_WINDOW_SIZE },
    zIndex: 10,
  };
}

const INITIAL_WINDOWS: Record<AgentId, WindowState> = {
  supervisor: createDefaultWindow('supervisor'),
  dosing: createDefaultWindow('dosing'),
  uf: createDefaultWindow('uf'),
  ro: createDefaultWindow('ro'),
  pump: createDefaultWindow('pump'),
};

export const useWindowStore = create<WindowManagerState & WindowManagerActions>((set, get) => ({
  windows: { ...INITIAL_WINDOWS },
  activeWindowId: null,
  maxZIndex: 10,

  openWindow: (agentId) => {
    const { windows, maxZIndex } = get();
    const win = windows[agentId];

    if (win.isOpen && !win.isMinimized) {
      get().focusWindow(agentId);
      return;
    }

    const newZ = maxZIndex + 1;
    set({
      windows: {
        ...windows,
        [agentId]: { ...win, isOpen: true, isMinimized: false, zIndex: newZ },
      },
      activeWindowId: agentId,
      maxZIndex: newZ,
    });
  },

  closeWindow: (agentId) => {
    const { windows, activeWindowId } = get();
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], isOpen: false, isMinimized: false },
      },
      activeWindowId: activeWindowId === agentId ? null : activeWindowId,
    });
  },

  minimizeWindow: (agentId) => {
    const { windows, activeWindowId } = get();
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], isMinimized: true },
      },
      activeWindowId: activeWindowId === agentId ? null : activeWindowId,
    });
  },

  restoreWindow: (agentId) => {
    const { windows, maxZIndex } = get();
    const newZ = maxZIndex + 1;
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], isMinimized: false, zIndex: newZ },
      },
      activeWindowId: agentId,
      maxZIndex: newZ,
    });
  },

  focusWindow: (agentId) => {
    const { windows, maxZIndex } = get();
    const newZ = maxZIndex + 1;
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], zIndex: newZ },
      },
      activeWindowId: agentId,
      maxZIndex: newZ,
    });
  },

  moveWindow: (agentId, position) => {
    const { windows } = get();
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], position },
      },
    });
  },

  resizeWindow: (agentId, size) => {
    const { windows } = get();
    set({
      windows: {
        ...windows,
        [agentId]: { ...windows[agentId], size },
      },
    });
  },

  closeAllWindows: () => {
    const reset = Object.fromEntries(
      Object.entries(INITIAL_WINDOWS).map(([id, win]) => [id, { ...win }])
    ) as Record<AgentId, WindowState>;
    set({ windows: reset, activeWindowId: null });
  },

  getOpenWindows: () => {
    return (Object.values(get().windows) as WindowState[]).filter((w) => w.isOpen);
  },
}));
