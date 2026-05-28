import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../useWindowStore';

describe('useWindowStore', () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: {
        supervisor: { agentId: 'supervisor', isOpen: false, isMinimized: false, position: { x: 200, y: 100 }, size: { width: 420, height: 520 }, zIndex: 10 },
        dosing: { agentId: 'dosing', isOpen: false, isMinimized: false, position: { x: 260, y: 140 }, size: { width: 420, height: 520 }, zIndex: 10 },
        uf: { agentId: 'uf', isOpen: false, isMinimized: false, position: { x: 320, y: 180 }, size: { width: 420, height: 520 }, zIndex: 10 },
        ro: { agentId: 'ro', isOpen: false, isMinimized: false, position: { x: 380, y: 120 }, size: { width: 420, height: 520 }, zIndex: 10 },
        pump: { agentId: 'pump', isOpen: false, isMinimized: false, position: { x: 440, y: 160 }, size: { width: 420, height: 520 }, zIndex: 10 },
      },
      activeWindowId: null,
      maxZIndex: 10,
    });
  });

  it('opens a window and sets it active', () => {
    useWindowStore.getState().openWindow('dosing');
    const state = useWindowStore.getState();
    expect(state.windows.dosing.isOpen).toBe(true);
    expect(state.windows.dosing.isMinimized).toBe(false);
    expect(state.activeWindowId).toBe('dosing');
    expect(state.windows.dosing.zIndex).toBe(11);
  });

  it('focuses an already open window by incrementing zIndex', () => {
    useWindowStore.getState().openWindow('dosing');
    useWindowStore.getState().openWindow('uf');
    useWindowStore.getState().focusWindow('dosing');
    const state = useWindowStore.getState();
    expect(state.activeWindowId).toBe('dosing');
    expect(state.windows.dosing.zIndex).toBeGreaterThan(state.windows.uf.zIndex);
  });

  it('minimizes a window and selects next active', () => {
    useWindowStore.getState().openWindow('dosing');
    useWindowStore.getState().openWindow('uf');
    useWindowStore.getState().minimizeWindow('uf');
    const state = useWindowStore.getState();
    expect(state.windows.uf.isMinimized).toBe(true);
    expect(state.activeWindowId).toBe('dosing');
  });

  it('closes a window', () => {
    useWindowStore.getState().openWindow('ro');
    useWindowStore.getState().closeWindow('ro');
    const state = useWindowStore.getState();
    expect(state.windows.ro.isOpen).toBe(false);
    expect(state.activeWindowId).toBeNull();
  });

  it('cycles to next window', () => {
    useWindowStore.getState().openWindow('dosing');
    useWindowStore.getState().openWindow('uf');
    useWindowStore.getState().openWindow('ro');
    // active is 'ro' (last opened)
    useWindowStore.getState().cycleWindow('next');
    const state = useWindowStore.getState();
    // should cycle to the window after 'ro' in z-order
    expect(state.activeWindowId).not.toBe('ro');
  });

  it('cycles to previous window', () => {
    useWindowStore.getState().openWindow('dosing');
    useWindowStore.getState().openWindow('uf');
    useWindowStore.getState().cycleWindow('prev');
    const state = useWindowStore.getState();
    expect(state.activeWindowId).toBe('dosing');
  });

  it('closeAllWindows resets state', () => {
    useWindowStore.getState().openWindow('dosing');
    useWindowStore.getState().openWindow('uf');
    useWindowStore.getState().closeAllWindows();
    const state = useWindowStore.getState();
    expect(state.activeWindowId).toBeNull();
    expect(state.windows.dosing.isOpen).toBe(false);
    expect(state.windows.uf.isOpen).toBe(false);
  });
});
