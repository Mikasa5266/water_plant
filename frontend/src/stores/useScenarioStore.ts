import { create } from 'zustand';
import type {
  ScenarioPhase,
  AgentId,
  AgentUIStatus,
  AgentRunStatus,
  IncidentType,
  ThinkingContent,
  DecisionStep,
  CameraFocusTarget,
  ParticleIntent,
} from '../types/index';
import { ScenarioPhase as Phase } from '../types/index';
import { DEVICE_CENTERS, FOCUS_OFFSET } from '../simulation3d/config';
import { toThreePosTuple } from '../simulation3d/utils/coordinates';

// ─── Phase → Agent UI 四态映射 ───

const PHASE_TO_UI_STATUS: Record<ScenarioPhase, AgentUIStatus> = {
  [Phase.IDLE]: 'normal',
  [Phase.ANOMALY_DETECTED]: 'pending',
  [Phase.SUPERVISOR_ANALYZING]: 'alarm',
  [Phase.DISPATCHING]: 'alarm',
  [Phase.AGENT_ANALYZING]: 'alarm',
  [Phase.EXECUTING]: 'alarm',
  [Phase.DEVICE_OPERATING]: 'alarm',
  [Phase.RECOVERING]: 'recovering',
  [Phase.RECOVERED]: 'recovering',
};

// ─── 决策链模板 ───

const DEFAULT_DECISION_STEPS: DecisionStep[] = [
  { index: 0, label: '异常感知', active: false, completed: false },
  { index: 1, label: '数据上送', active: false, completed: false },
  { index: 2, label: 'AI 分析', active: false, completed: false },
  { index: 3, label: '智能体分发', active: false, completed: false },
  { index: 4, label: '执行恢复', active: false, completed: false },
];

// ─── Store 接口 ───

export interface ScenarioState {
  // 核心状态
  phase: ScenarioPhase;
  incidentType: IncidentType | null;
  activeAgentId: AgentId | null;
  targetAgentId: AgentId | null;

  // Agent 状态
  agentRunStatuses: Record<AgentId, AgentRunStatus>;
  agentUIStatus: AgentUIStatus;

  // 思考气泡
  thinking: ThinkingContent | null;
  thinkingAgentId: AgentId | null;

  // 决策链
  decisionSteps: DecisionStep[];

  // 3D 动画控制
  particleIntent: ParticleIntent | null;
  cameraFocus: CameraFocusTarget | null;
  deviceFlashing: AgentId | null;

  // 时间戳
  phaseStartTime: number;
}

export interface ScenarioActions {
  // A 写入（状态转换逻辑）
  startIncident: (type: IncidentType) => void;
  advancePhase: () => void;
  forceIdle: () => void;
  setThinking: (agentId: AgentId, content: ThinkingContent) => void;
  clearThinking: () => void;
  setCameraFocus: (target: CameraFocusTarget | null) => void;
  setActiveAgent: (agentId: AgentId | null) => void;
  setTargetAgent: (agentId: AgentId | null) => void;
  updateDecisionStep: (index: number, patch: Partial<DecisionStep>) => void;

  // B 只读消费（computed helpers）
  getAgentUIStatus: () => AgentUIStatus;
  getParticleIntent: () => ParticleIntent | null;
  isPhaseActive: () => boolean;
}

const INITIAL_RUN_STATUSES: Record<AgentId, AgentRunStatus> = {
  supervisor: 'monitoring',
  dosing: 'monitoring',
  uf: 'monitoring',
  ro: 'monitoring',
  pump: 'monitoring',
};

// ─── Phase 推进顺序 ───

const PHASE_ORDER: ScenarioPhase[] = [
  Phase.IDLE,
  Phase.ANOMALY_DETECTED,
  Phase.SUPERVISOR_ANALYZING,
  Phase.DISPATCHING,
  Phase.AGENT_ANALYZING,
  Phase.EXECUTING,
  Phase.DEVICE_OPERATING,
  Phase.RECOVERING,
  Phase.RECOVERED,
];

const PHASE_TO_STEP_INDEX: Partial<Record<ScenarioPhase, number>> = {
  [Phase.ANOMALY_DETECTED]: 0,
  [Phase.SUPERVISOR_ANALYZING]: 2,
  [Phase.DISPATCHING]: 3,
  [Phase.AGENT_ANALYZING]: 3,
  [Phase.EXECUTING]: 4,
  [Phase.DEVICE_OPERATING]: 4,
  [Phase.RECOVERING]: 4,
  [Phase.RECOVERED]: 4,
};

// ─── 场景类型 → 目标 Agent 映射 ───

const INCIDENT_TO_AGENT: Record<IncidentType, AgentId> = {
  dosing_abnormal: 'dosing',
  uf_clogging: 'uf',
  ro_fouling: 'ro',
  pump_overload: 'pump',
};

export const useScenarioStore = create<ScenarioState & ScenarioActions>((set, get) => ({
  // 初始状态
  phase: Phase.IDLE,
  incidentType: null,
  activeAgentId: null,
  targetAgentId: null,
  agentRunStatuses: { ...INITIAL_RUN_STATUSES },
  agentUIStatus: 'normal',
  thinking: null,
  thinkingAgentId: null,
  decisionSteps: DEFAULT_DECISION_STEPS.map(s => ({ ...s })),
  particleIntent: null,
  cameraFocus: null,
  deviceFlashing: null,
  phaseStartTime: Date.now(),

  // ─── Actions ───

  startIncident: (type) => {
    if (get().phase !== Phase.IDLE) return;

    const targetAgent = INCIDENT_TO_AGENT[type];
    set({
      phase: Phase.ANOMALY_DETECTED,
      incidentType: type,
      activeAgentId: 'supervisor',
      targetAgentId: targetAgent,
      agentUIStatus: 'pending',
      particleIntent: 'anomaly',
      deviceFlashing: targetAgent,
      thinking: null,
      thinkingAgentId: null,
      decisionSteps: DEFAULT_DECISION_STEPS.map((s, i) =>
        i === 0 ? { ...s, active: true } : { ...s }
      ),
      phaseStartTime: Date.now(),
      agentRunStatuses: {
        ...INITIAL_RUN_STATUSES,
        [targetAgent]: 'warning',
      },
    });
  },

  advancePhase: () => {
    const { phase, targetAgentId } = get();
    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) return;

    const nextPhase = PHASE_ORDER[currentIndex + 1];
    const uiStatus = PHASE_TO_UI_STATUS[nextPhase];

    const patch: Partial<ScenarioState> = {
      phase: nextPhase,
      agentUIStatus: uiStatus,
      phaseStartTime: Date.now(),
    };

    const activeStepIndex = PHASE_TO_STEP_INDEX[nextPhase];
    if (activeStepIndex !== undefined) {
      patch.decisionSteps = get().decisionSteps.map((step, index) => ({
        ...step,
        active: index === activeStepIndex,
        completed: index < activeStepIndex || nextPhase === Phase.RECOVERED,
      }));
    }

    switch (nextPhase) {
      case Phase.ANOMALY_DETECTED:
        patch.particleIntent = 'anomaly';
        break;
      case Phase.SUPERVISOR_ANALYZING:
        patch.particleIntent = null;
        patch.activeAgentId = 'supervisor';
        break;
      case Phase.DISPATCHING:
        patch.particleIntent = 'dispatch';
        break;
      case Phase.AGENT_ANALYZING:
        patch.particleIntent = null;
        patch.activeAgentId = targetAgentId;
        break;
      case Phase.EXECUTING: {
        patch.particleIntent = 'execute';
        // 自动聚焦到目标设备本体中心，让人看清执行过程
        if (targetAgentId) {
          const dc = DEVICE_CENTERS[targetAgentId];
          if (dc) {
            const lookAt = toThreePosTuple(dc);
            const target: CameraFocusTarget = {
              position: [
                lookAt[0] + FOCUS_OFFSET.positionMul,
                lookAt[1] + FOCUS_OFFSET.heightMul,
                lookAt[2] + FOCUS_OFFSET.depthMul,
              ],
              lookAt: [lookAt[0], lookAt[1], lookAt[2]],
              duration: 2000,
            };
            patch.cameraFocus = target;
          }
        }
        break;
      }
      case Phase.DEVICE_OPERATING:
        patch.particleIntent = null;
        patch.deviceFlashing = null;
        break;
      case Phase.RECOVERING:
        patch.particleIntent = null;
        break;
      case Phase.RECOVERED:
        patch.particleIntent = null;
        patch.cameraFocus = null;
        break;
    }

    set(patch);
  },

  forceIdle: () => {
    set({
      phase: Phase.IDLE,
      incidentType: null,
      activeAgentId: null,
      targetAgentId: null,
      agentUIStatus: 'normal',
      agentRunStatuses: { ...INITIAL_RUN_STATUSES },
      thinking: null,
      thinkingAgentId: null,
      decisionSteps: DEFAULT_DECISION_STEPS.map(s => ({ ...s })),
      particleIntent: null,
      cameraFocus: null,
      deviceFlashing: null,
      phaseStartTime: Date.now(),
    });
  },

  setThinking: (agentId, content) => {
    set({ thinking: content, thinkingAgentId: agentId });
  },

  clearThinking: () => {
    set({ thinking: null, thinkingAgentId: null });
  },

  setCameraFocus: (target) => {
    set({ cameraFocus: target });
  },

  setActiveAgent: (agentId) => {
    set({ activeAgentId: agentId });
  },

  setTargetAgent: (agentId) => {
    set({ targetAgentId: agentId });
  },

  updateDecisionStep: (index, patch) => {
    const steps = get().decisionSteps.map((s, i) =>
      i === index ? { ...s, ...patch } : s
    );
    set({ decisionSteps: steps });
  },

  // ─── Computed helpers (B 消费) ───

  getAgentUIStatus: () => get().agentUIStatus,

  getParticleIntent: () => get().particleIntent,

  isPhaseActive: () => get().phase !== Phase.IDLE,
}));
