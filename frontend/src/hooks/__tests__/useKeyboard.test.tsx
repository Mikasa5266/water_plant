import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useKeyboard, type UseKeyboardOptions } from '../useKeyboard';
import { ScenarioPhase } from '../../types/index';

function createMockOptions(overrides: Partial<UseKeyboardOptions> = {}): UseKeyboardOptions {
  return {
    phase: ScenarioPhase.IDLE,
    isHelpOpen: false,
    isSceneRunning: false,
    hasNotifications: false,
    activeWindowId: null,
    onTriggerIncident: vi.fn(),
    onTerminateScene: vi.fn(),
    onToggleHelp: vi.fn(),
    onCloseHelp: vi.fn(),
    onToggleDebugPanel: vi.fn(),
    onReturnHome: vi.fn(),
    onClearNotifications: vi.fn(),
    onMinimizeWindow: vi.fn(),
    onCycleWindow: vi.fn(),
    ...overrides,
  };
}

describe('useKeyboard', () => {
  let options: UseKeyboardOptions;

  beforeEach(() => {
    options = createMockOptions();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Ctrl+1 triggers dosing incident when IDLE', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    expect(options.onTriggerIncident).toHaveBeenCalledWith('dosing_abnormal');
  });

  it('Ctrl+2 triggers UF incident', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '2', ctrlKey: true });
    expect(options.onTriggerIncident).toHaveBeenCalledWith('uf_clogging');
  });

  it('Ctrl+3 triggers RO incident', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '3', ctrlKey: true });
    expect(options.onTriggerIncident).toHaveBeenCalledWith('ro_fouling');
  });

  it('Ctrl+4 triggers pump incident', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '4', ctrlKey: true });
    expect(options.onTriggerIncident).toHaveBeenCalledWith('pump_overload');
  });

  it('does NOT trigger incident when phase is not IDLE', () => {
    options.phase = ScenarioPhase.EXECUTING;
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    expect(options.onTriggerIncident).not.toHaveBeenCalled();
  });

  it('does NOT trigger incident when scene is running', () => {
    options.isSceneRunning = true;
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    expect(options.onTriggerIncident).not.toHaveBeenCalled();
  });

  it('Ctrl+Tab cycles to next window', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true });
    expect(options.onCycleWindow).toHaveBeenCalledWith('next');
  });

  it('Ctrl+Shift+Tab cycles to previous window', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Tab', ctrlKey: true, shiftKey: true });
    expect(options.onCycleWindow).toHaveBeenCalledWith('prev');
  });

  it('? toggles help', () => {
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: '?' });
    expect(options.onToggleHelp).toHaveBeenCalled();
  });

  it('Escape closes help when help is open', () => {
    options.isHelpOpen = true;
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(options.onCloseHelp).toHaveBeenCalled();
  });

  it('Escape terminates scene when scene is running', () => {
    options.phase = ScenarioPhase.EXECUTING;
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(options.onTerminateScene).toHaveBeenCalled();
  });

  it('Escape clears notifications when present', () => {
    options.hasNotifications = true;
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(options.onClearNotifications).toHaveBeenCalled();
  });

  it('Escape minimizes active window as last resort', () => {
    options.activeWindowId = 'dosing';
    renderHook(() => useKeyboard(options));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(options.onMinimizeWindow).toHaveBeenCalledWith('dosing');
  });
});
