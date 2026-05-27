export type AgentId = 'master' | 'dosing' | 'uf' | 'membrane';

export type AgentStatusType = 'idle' | 'monitoring' | 'processing' | 'warning';

export interface AgentLog {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AgentMetric {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface AgentData {
  id: AgentId;
  name: string;
  englishName: string;
  role: string;
  status: AgentStatusType;
  x: number;
  y: number;
  desc: string;
  capabilities: string[];
  metrics: AgentMetric[];
  logs: AgentLog[];
}
