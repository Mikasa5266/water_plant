import type { AgentId, CardState, AnomalySimulation } from '../types';

export const DEFAULT_CARDS: Record<AgentId, CardState> = {
  master: { x: 50, y: 15, isOpen: false, zIndex: 10 },
  dosing: { x: 12, y: 38, isOpen: false, zIndex: 10 },
  uf: { x: 35, y: 55, isOpen: false, zIndex: 10 },
  membrane: { x: 62, y: 38, isOpen: false, zIndex: 10 }
};

export const DEFAULT_SIMULATION: AnomalySimulation = {
  active: false,
  type: null,
  step: 0,
  title: '系统状态良好',
  description: '全厂工艺链路平稳。四大子智能体协同巡检中。',
  logs: [
    '系统在线自检测完成，网络波动 < 5ms',
    '监管总管智能体完成例行拓扑评估，未见工艺指标偏倚'
  ]
};

export const PIPE_PATHS = {
  in: [
    { x: -390, y: 0, z: -50 },
    { x: -280, y: 0, z: -50 },
    { x: -280, y: 0, z: -70 }
  ],
  dose: [
    { x: -180, y: -220, z: -70 },
    { x: -180, y: -150, z: -70 },
    { x: -245, y: -80, z: 15 },
    { x: -280, y: 0, z: 25 }
  ],
  coag: [
    { x: -210, y: 0, z: -10 },
    { x: -100, y: -40, z: -10 },
    { x: -70, y: -40, z: -25 }
  ],
  clari: [
    { x: 20, y: -40, z: -40 },
    { x: 20, y: 140, z: -40 },
    { x: 50, y: 180, z: -50 }
  ],
  uf: [
    { x: 50, y: 220, z: -50 },
    { x: 160, y: 220, z: -50 },
    { x: 210, y: 20, z: -40 }
  ],
  membrane: [
    { x: 350, y: 20, z: -30 },
    { x: 440, y: 20, z: -30 }
  ]
} as const;

export const AGENT_3D_ANCHORS = {
  master: { x: 20, y: -40, z: 110 },
  dosing: { x: -180, y: -220, z: 95 },
  uf: { x: 50, y: 220, z: 85 },
  membrane: { x: 280, y: 20, z: 100 }
} as const;

export const PARTICLE_ANIM_COORDS: Record<AgentId, { origin: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }> = {
  dosing: {
    origin: { x: -180, y: -220, z: -10 },
    target: { x: -180, y: -220, z: 95 }
  },
  uf: {
    origin: { x: 50, y: 220, z: 20 },
    target: { x: 50, y: 220, z: 85 }
  },
  membrane: {
    origin: { x: 280, y: 20, z: 20 },
    target: { x: 280, y: 20, z: 100 }
  },
  master: {
    origin: { x: 20, y: -40, z: 10 },
    target: { x: 20, y: -40, z: 110 }
  }
};
