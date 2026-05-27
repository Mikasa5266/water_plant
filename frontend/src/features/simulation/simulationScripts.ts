import type { AgentId, AgentLog, TelemetryState } from '../../types';

export interface StepPayload {
  title: string;
  description: string;
  logs: string[];
  telemetryPatch?: Partial<TelemetryState>;
  agentStatusPatch?: Partial<Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>>;
  agentLogsPatch?: Partial<Record<AgentId, AgentLog[]>>;
  stopPlaying?: boolean;
}

export type ScenarioType = 'dosing_abnormal' | 'uf_clogging' | 'membrane_decay';

export function getActiveAgentForStep(type: ScenarioType | null, step: number): AgentId {
  if (!type) return 'master';
  if (step === 3 || step === 4) return 'master';
  if (type === 'dosing_abnormal') return 'dosing';
  if (type === 'uf_clogging') return 'uf';
  if (type === 'membrane_decay') return 'membrane';
  return 'master';
}

export function getScenarioMeta(incidentType: ScenarioType): { title: string; detail: string } {
  if (incidentType === 'dosing_abnormal') {
    return {
      title: '加药浓度过度偏低阻碍反应',
      detail: '模拟前段混凝池加药浓度急剧降低，触发多维智能体联动配比。'
    };
  } else if (incidentType === 'uf_clogging') {
    return {
      title: '超滤跨膜压差过高堵塞处置',
      detail: '模拟中段超滤系统表面严重附着，TMP跃升超标，触发变频逆流自冲洗协调。'
    };
  }
  return {
    title: '终端过滤膜表面结晶极化',
    detail: '模拟高精终端过滤膜由于极化产水量大幅下降，触发错流剪切自洁补偿机制。'
  };
}
