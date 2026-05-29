// 契约对齐类型 — 对应 contracts/openapi.yaml 和事件 schema

// ─── Plant ───

export type PlantStatus = 'normal' | 'warning' | 'fault' | 'maintenance';

export interface WaterQualitySnapshot {
  turbidity: number;
  ph: number;
  residualChlorine: number;
}

export interface PlantOverview {
  id: string;
  name: string;
  status: PlantStatus;
  waterQuality?: WaterQualitySnapshot;
  activeAlertCount?: number;
  updatedAt: string;
}

// ─── Devices ───

export type DeviceType = 'pump' | 'valve' | 'tank' | 'sensor' | 'dosing-unit' | 'filter' | 'other';

export type DeviceStatus = 'idle' | 'running' | 'warning' | 'fault' | 'maintenance';

export interface DeviceMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  updatedAt?: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  metrics?: DeviceMetric[];
  simulationNodeId?: string;
}

// ─── Alerts ───

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  status: AlertStatus;
  deviceId?: string;
  createdAt: string;
}

// ─── Agent Runs ───

export type AgentRunApiStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface CreateAgentRunRequest {
  goal: string;
  context?: Record<string, unknown>;
}

export interface AgentRun {
  id: string;
  status: AgentRunApiStatus;
  createdAt: string;
}

// ─── Agent Events (SSE/WebSocket) ───

export type AgentEventType =
  | 'run.started'
  | 'plan.created'
  | 'tool.called'
  | 'tool.succeeded'
  | 'tool.failed'
  | 'simulation.requested'
  | 'run.succeeded'
  | 'run.failed';

export type ToolCallStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export interface ToolCall {
  id: string;
  name: string;
  status: ToolCallStatus;
  argumentsSummary?: string;
  resultSummary?: string;
  durationMs?: number;
}

export interface AgentEvent {
  id: string;
  runId: string;
  type: AgentEventType;
  timestamp: string;
  message?: string;
  toolCall?: ToolCall;
  simulationEventId?: string;
  payload?: Record<string, unknown>;
}

// ─── Simulation Events ───

export type SimulationEventType =
  | 'device.status.changed'
  | 'flow.started'
  | 'flow.stopped'
  | 'alert.highlighted'
  | 'camera.focused'
  | 'maintenance.previewed';

export interface SimulationEvent {
  id: string;
  type: SimulationEventType;
  targetId: string;
  timestamp: string;
  status?: DeviceStatus;
  durationMs?: number;
  payload?: Record<string, unknown>;
}
