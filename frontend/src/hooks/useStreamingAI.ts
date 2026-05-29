import { useCallback, useRef } from 'react';
import { streamAnalysis } from '../api/services/aiService';
import { useScenarioStore } from '../stores/useScenarioStore';
import type { AIAnalysisPhase } from '../types/ai';
import type { AgentId, IncidentType, TelemetryState } from '../types';

const TIMEOUT_MS = 30_000;

export function useStreamingAI() {
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startStream = useCallback(
    (params: {
      agentId: AgentId;
      incidentType: IncidentType;
      phase: AIAnalysisPhase;
      telemetry: TelemetryState;
      title: string;
      onDone?: () => void;
    }) => {
      abort();

      const { agentId, incidentType, phase, telemetry, title, onDone } = params;
      const store = useScenarioStore.getState();

      store.setThinking(agentId, { title, text: '', status: 'streaming' });

      const controller = new AbortController();
      abortRef.current = controller;

      timeoutRef.current = setTimeout(() => {
        controller.abort();
        const current = useScenarioStore.getState().thinking;
        if (current && current.status === 'streaming') {
          useScenarioStore.getState().setThinking(agentId, {
            ...current,
            text: current.text + '\n\n[分析超时，请检查网络连接]',
            status: 'error',
          });
        }
        onDone?.();
      }, TIMEOUT_MS);

      streamAnalysis(
        { incident_type: incidentType, phase, telemetry },
        (event) => {
          const state = useScenarioStore.getState();
          const current = state.thinking;
          if (!current) return;

          switch (event.type) {
            case 'token':
              state.setThinking(agentId, {
                ...current,
                text: current.text + event.content,
                status: 'streaming',
              });
              break;
            case 'done':
              clearTimeoutRef();
              state.setThinking(agentId, { ...current, status: 'done' });
              onDone?.();
              break;
            case 'error':
              clearTimeoutRef();
              state.setThinking(agentId, {
                ...current,
                text: current.text + `\n\n[错误: ${event.message}]`,
                status: 'error',
              });
              onDone?.();
              break;
          }
        },
        controller.signal,
      );
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearTimeoutRef();
  }, []);

  function clearTimeoutRef() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  return { startStream, abort };
}
