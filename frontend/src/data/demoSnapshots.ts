import { ScenarioPhase } from '../types/index';
import type {
  AgentId,
  AgentStatusMap,
  DecisionStep,
  EventLogEntry,
  IncidentType,
  NotificationItem,
  TelemetryState,
  ThinkingContent,
} from '../types/index';

export type DemoState = 'normal' | 'abnormal' | 'recovered';

export interface DemoSnapshot {
  telemetry: Partial<TelemetryState>;
  agentStatuses: Partial<AgentStatusMap>;
  phase: ScenarioPhase;
  incidentType: IncidentType | null;
  thinking: ThinkingContent | null;
  decisionSteps: DecisionStep[];
  events: Omit<EventLogEntry, 'id'>[];
  notification: Omit<NotificationItem, 'id'> | null;
}

const DECISION_LABELS = [
  '异常检测',
  '数据上报',
  'AI 分析',
  '智能体调度',
  '执行恢复',
];

function buildSteps(completedUpTo: number, activeIndex: number): DecisionStep[] {
  return DECISION_LABELS.map((label, i) => ({
    index: i,
    label,
    active: i === activeIndex,
    completed: i < completedUpTo,
  }));
}

export const DEMO_SNAPSHOTS: Record<DemoState, DemoSnapshot> = {
  normal: {
    telemetry: {
      inletTurbidity: 18.5,
      outletTurbidity: 0.04,
      dosingRate: 4.8,
      chemicalLevel: 72,
      healthScore: 98,
      energyConsumption: 0.22,
    },
    agentStatuses: {
      supervisor: 'monitoring',
      dosing: 'monitoring',
      uf: 'monitoring',
      ro: 'monitoring',
      pump: 'monitoring',
    },
    phase: ScenarioPhase.IDLE,
    incidentType: null,
    thinking: null,
    decisionSteps: buildSteps(0, -1),
    events: [],
    notification: null,
  },

  abnormal: {
    telemetry: {
      inletTurbidity: 58,
      outletTurbidity: 2.1,
      dosingRate: 4.8,
      chemicalLevel: 72,
      healthScore: 85,
      energyConsumption: 0.28,
    },
    agentStatuses: {
      supervisor: 'processing',
      dosing: 'warning',
      uf: 'monitoring',
      ro: 'monitoring',
      pump: 'monitoring',
    },
    phase: ScenarioPhase.SUPERVISOR_ANALYZING,
    incidentType: 'dosing_abnormal',
    thinking: {
      title: '监管智能体正在分析',
      summary: '检测到进水浊度异常飙升至 58 NTU，超出安全阈值 200%。正在关联加药系统历史数据与当前工况，定位根因并生成补偿方案...',
      points: [
        '读取实时遥测：进水浊度 58 NTU，出水浊度 2.1 NTU',
        '对照阈值：进水浊度正常范围 10-25 NTU，当前严重超标',
        '关联分析：加药量 4.8 mg/L 未随浊度变化自适应调整',
        '初步判断：混凝剂投加量不足，需提升至 6.0 mg/L 以上',
      ],
    },
    decisionSteps: buildSteps(2, 2),
    events: [
      { time: '', text: '加药智能体检测到进水浊度异常（58 NTU），监管智能体接入分析。', type: 'warning' },
      { time: '', text: '数据已上报至云端管理平台，等待 AI 分析结果。', type: 'info' },
      { time: '', text: '监管智能体正在执行根因定位与方案生成...', type: 'info' },
    ],
    notification: {
      title: '系统异常告警',
      description: '加药智能体检测到进水浊度异常（58 NTU），点击查看详情。',
      time: '',
      agentId: 'dosing' as AgentId,
      level: 'error',
      autoDismissMs: 5000,
    },
  },

  recovered: {
    telemetry: {
      inletTurbidity: 20,
      outletTurbidity: 0.04,
      dosingRate: 6.0,
      chemicalLevel: 70,
      healthScore: 99,
      energyConsumption: 0.22,
    },
    agentStatuses: {
      supervisor: 'monitoring',
      dosing: 'monitoring',
      uf: 'monitoring',
      ro: 'monitoring',
      pump: 'monitoring',
    },
    phase: ScenarioPhase.RECOVERED,
    incidentType: null,
    thinking: null,
    decisionSteps: buildSteps(5, -1),
    events: [
      { time: '', text: '加药智能体检测到进水浊度异常（58 NTU），监管智能体接入分析。', type: 'warning' },
      { time: '', text: 'AI 分析完成：混凝剂投加量不足，建议提升至 6.0 mg/L。', type: 'info' },
      { time: '', text: '监管智能体已调度加药智能体执行补偿方案。', type: 'info' },
      { time: '', text: '加药智能体执行完毕，PLC 寄存器已写入新参数。', type: 'success' },
      { time: '', text: '系统恢复稳定，出水浊度回归 0.04 NTU。', type: 'success' },
    ],
    notification: {
      title: '异常已恢复',
      description: '加药智能体处置完成，系统恢复稳定巡检。',
      time: '',
      agentId: 'dosing' as AgentId,
      level: 'success',
      autoDismissMs: 3000,
    },
  },
};
