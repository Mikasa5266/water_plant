import type { AgentId } from './agent';

export interface AnomalySimulation {
  active: boolean;
  type: 'dosing_abnormal' | 'uf_clogging' | 'membrane_decay' | null;
  step: number;
  title: string;
  description: string;
  logs: string[];
}

export interface ActiveAnimation {
  agentId: AgentId;
  type: 'step_transition' | 'manual_calibration';
  targetStep?: number;
  startTick: number;
  duration: number;
}
