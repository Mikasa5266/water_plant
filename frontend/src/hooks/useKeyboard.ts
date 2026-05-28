import { useEffect } from 'react';
import { ScenarioPhase, type AgentId, type IncidentType } from '../types/index';

const KEY_TO_INCIDENT: Record<string, IncidentType> = {
  '1': 'dosing_abnormal',
  '2': 'uf_clogging',
  '3': 'ro_fouling',
  '4': 'pump_overload',
};

function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

export interface UseKeyboardOptions {
  phase: ScenarioPhase;
  isHelpOpen: boolean;
  isSceneRunning: boolean;
  hasNotifications: boolean;
  activeWindowId: AgentId | null;
  onTriggerIncident: (incidentType: IncidentType) => void;
  onTerminateScene: () => void;
  onToggleHelp: () => void;
  onCloseHelp: () => void;
  onToggleDebugPanel: () => void;
  onReturnHome: () => void;
  onClearNotifications: () => void;
  onMinimizeWindow: (agentId: AgentId) => void;
  onCycleWindow: (direction: 'next' | 'prev') => void;
}

export function useKeyboard({
  phase,
  isHelpOpen,
  isSceneRunning,
  hasNotifications,
  activeWindowId,
  onTriggerIncident,
  onTerminateScene,
  onToggleHelp,
  onCloseHelp,
  onToggleDebugPanel,
  onReturnHome,
  onClearNotifications,
  onMinimizeWindow,
  onCycleWindow,
}: UseKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+1~4: trigger incidents
      if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        const incidentType = KEY_TO_INCIDENT[event.key];
        if (incidentType) {
          event.preventDefault();
          if (phase === ScenarioPhase.IDLE && !isSceneRunning) {
            onTriggerIncident(incidentType);
          }
          return;
        }
      }

      // Ctrl+Tab / Ctrl+Shift+Tab: cycle windows
      if (event.key === 'Tab' && event.ctrlKey) {
        event.preventDefault();
        onCycleWindow(event.shiftKey ? 'prev' : 'next');
        return;
      }

      // ? or Shift+/: toggle help (not in input fields)
      if ((event.key === '?' || (event.key === '/' && event.shiftKey)) && !isInputTarget(event.target)) {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      // Ctrl+Shift+D: toggle debug panel
      if (event.key.toLowerCase() === 'd' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        onToggleDebugPanel();
        return;
      }

      // Ctrl+Home: return home
      if (event.key === 'Home' && event.ctrlKey) {
        event.preventDefault();
        onReturnHome();
        return;
      }

      // Escape: hierarchical close
      if (event.key === 'Escape') {
        if (isHelpOpen) {
          event.preventDefault();
          onCloseHelp();
          return;
        }

        if (phase !== ScenarioPhase.IDLE || isSceneRunning) {
          event.preventDefault();
          onTerminateScene();
          return;
        }

        if (hasNotifications) {
          event.preventDefault();
          onClearNotifications();
          return;
        }

        if (activeWindowId) {
          event.preventDefault();
          onMinimizeWindow(activeWindowId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeWindowId,
    hasNotifications,
    isHelpOpen,
    isSceneRunning,
    onClearNotifications,
    onCloseHelp,
    onCycleWindow,
    onMinimizeWindow,
    onReturnHome,
    onTerminateScene,
    onToggleDebugPanel,
    onToggleHelp,
    onTriggerIncident,
    phase,
  ]);
}
