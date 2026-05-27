import type { AgentId, AgentLog, AgentStatusMap, IncidentType, TelemetryState } from '../../types/index';

export interface StepPayload {
  title: string;
  description: string;
  logs: string[];
  telemetryPatch?: Partial<TelemetryState>;
  agentStatusPatch?: Partial<AgentStatusMap>;
  agentLogsPatch?: Partial<Record<AgentId, AgentLog[]>>;
  stopPlaying?: boolean;
}

export function getActiveAgentForStep(type: IncidentType | null, step: number): AgentId {
  if (!type) return 'supervisor';
  if (step === 3 || step === 4) return 'supervisor';
  if (type === 'dosing_abnormal') return 'dosing';
  if (type === 'uf_clogging') return 'uf';
  if (type === 'ro_fouling') return 'ro';
  if (type === 'pump_overload') return 'pump';
  return 'supervisor';
}

export function getScenarioMeta(incidentType: IncidentType): { title: string; detail: string } {
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
  } else if (incidentType === 'pump_overload') {
    return {
      title: '泵组电流过载协同处置',
      detail: '模拟主泵电流与温升持续爬升，触发泵组智能体联动总控下发降速、切换备用泵与水力平衡方案。'
    };
  }
  return {
    title: '终端过滤膜表面结晶极化',
    detail: '模拟高精终端过滤膜由于极化产水量大幅下降，触发错流剪切自洁补偿机制。'
  };
}
