export type { AgentId, AgentStatusType, AgentLog, AgentMetric, AgentData } from './agent';
export type { TelemetryState } from './telemetry';
export type { AnomalySimulation, ActiveAnimation } from './simulation';
export type { CardState, FlowPoint } from './ui';

// 新共享契约类型
export { ScenarioPhase } from './scenario';
export type {
  AgentId as ScenarioAgentId,
  AgentUIStatus,
  AgentRunStatus,
  IncidentType,
  ParticleIntent,
  ThinkingContent,
  DecisionStep,
  EventLogEntry,
  NotificationItem,
  NormalRange,
  MetricField,
  AgentMeta,
  CameraFocusTarget,
  ParticlePath,
  WindowState,
  LODLevel,
} from './scenario';
