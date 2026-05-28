import { useEffect } from 'react';
import { ScenarioPhase, type AgentId, type IncidentType } from '../types/index';

const KEY_TO_INCIDENT: Record<string, IncidentType> = {
  F1: 'dosing_abnormal',
  F2: 'uf_clogging',
  F3: 'ro_fouling',
  F4: 'pump_overload',
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
}: UseKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const incidentType = KEY_TO_INCIDENT[event.key];
      if (incidentType) {
        event.preventDefault();
        if (phase === ScenarioPhase.IDLE && !isSceneRunning) {
          onTriggerIncident(incidentType);
        }
        return;
      }

      if ((event.key === '?' || (event.key === '/' && event.shiftKey)) && !isInputTarget(event.target)) {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      if (event.key === 'F12') {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      if (event.key.toLowerCase() === 'd' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        onToggleDebugPanel();
        return;
      }

      if (event.key === 'Home' && event.ctrlKey) {
        event.preventDefault();
        onReturnHome();
        return;
      }

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
    onMinimizeWindow,
    onReturnHome,
    onTerminateScene,
    onToggleDebugPanel,
    onToggleHelp,
    onTriggerIncident,
    phase,
  ]);
}
