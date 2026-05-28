import { useCallback, useEffect, useRef, useState } from 'react';
import type { IncidentType } from '../../types/index';

export type AutoDemoStatus = 'idle' | 'playing' | 'paused';

export interface AutoDemoConfig {
  /** 每步之间的间隔（ms），默认 4000 */
  stepInterval: number;
  /** 场景结束后到下一个场景的间隔（ms），默认 3000 */
  scenarioGap: number;
  /** 是否循环播放所有场景 */
  loop: boolean;
}

const DEFAULT_CONFIG: AutoDemoConfig = {
  stepInterval: 4000,
  scenarioGap: 3000,
  loop: false,
};

const ALL_SCENARIOS: IncidentType[] = [
  'dosing_abnormal',
  'uf_clogging',
  'ro_fouling',
  'pump_overload',
];

interface UseAutoDemoDeps {
  triggerSimulationIncident: (type: IncidentType) => void;
  resetToNormal: () => void;
  setIsPlaying: (playing: boolean) => void;
  simulationActive: boolean;
  simulationStep: number;
}

export function useAutoDemo(deps: UseAutoDemoDeps, config?: Partial<AutoDemoConfig>) {
  const { triggerSimulationIncident, resetToNormal, setIsPlaying, simulationActive, simulationStep } = deps;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const [status, setStatus] = useState<AutoDemoStatus>('idle');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  const statusRef = useRef(status);
  const cfgRef = useRef(cfg);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { cfgRef.current = cfg; });

  const clearGapTimer = () => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
  };

  // 当 simulation 走完第 8 步时，处理场景结束逻辑
  useEffect(() => {
    if (statusRef.current !== 'playing') return;
    if (simulationStep !== 8) return;

    // 场景播完，等待 gap 后进入下一个或结束
    gapTimerRef.current = setTimeout(() => {
      if (statusRef.current !== 'playing') return;

      resetToNormal();

      const nextIndex = currentScenarioIndex + 1;
      if (nextIndex < ALL_SCENARIOS.length) {
        setCurrentScenarioIndex(nextIndex);
        setTimeout(() => {
          if (statusRef.current !== 'playing') return;
          triggerSimulationIncident(ALL_SCENARIOS[nextIndex]);
        }, 500);
      } else if (cfgRef.current.loop) {
        setCurrentScenarioIndex(0);
        setTimeout(() => {
          if (statusRef.current !== 'playing') return;
          triggerSimulationIncident(ALL_SCENARIOS[0]);
        }, 500);
      } else {
        setStatus('idle');
        setCurrentScenarioIndex(0);
      }
    }, cfgRef.current.scenarioGap);
  }, [simulationStep]);

  const startAutoDemo = useCallback((scenarioId?: IncidentType) => {
    if (simulationActive) return;

    clearGapTimer();
    const startIndex = scenarioId ? ALL_SCENARIOS.indexOf(scenarioId) : 0;
    const idx = startIndex >= 0 ? startIndex : 0;

    setCurrentScenarioIndex(idx);
    setStatus('playing');
    triggerSimulationIncident(ALL_SCENARIOS[idx]);
  }, [simulationActive, triggerSimulationIncident]);

  const pause = useCallback(() => {
    if (status !== 'playing') return;
    clearGapTimer();
    setIsPlaying(false);
    setStatus('paused');
  }, [status, setIsPlaying]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    setIsPlaying(true);
    setStatus('playing');
  }, [status, setIsPlaying]);

  const stop = useCallback(() => {
    clearGapTimer();
    setIsPlaying(false);
    setStatus('idle');
    setCurrentScenarioIndex(0);
    resetToNormal();
  }, [setIsPlaying, resetToNormal]);

  const replay = useCallback(() => {
    stop();
    setTimeout(() => {
      startAutoDemo();
    }, 300);
  }, [stop, startAutoDemo]);

  // 组件卸载时清理
  useEffect(() => {
    return () => clearGapTimer();
  }, []);

  return {
    status,
    currentScenarioIndex,
    currentScenario: ALL_SCENARIOS[currentScenarioIndex],
    totalScenarios: ALL_SCENARIOS.length,
    startAutoDemo,
    pause,
    resume,
    stop,
    replay,
  };
}
