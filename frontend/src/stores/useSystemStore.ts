import { create } from 'zustand';
import type { AgentId, EventLogEntry, NotificationItem, LODLevel } from '../types/scenario';

// ─── 顶部 MetricsOverlay 指标 ───

export interface AlarmMetric {
  count: number;
  level: 'none' | 'low' | 'high';
}

export interface ProductionMetric {
  value: number;
  unit: string;
  status: 'normal' | 'warning';
}

export interface HealthMetric {
  label: string;
  level: 'good' | 'warning' | 'critical';
}

// ─── Store 接口 ───

export interface SystemState {
  // 顶部概览指标
  alarm: AlarmMetric;
  production: ProductionMetric;
  health: HealthMetric;

  // 事件日志（右侧面板）
  eventLog: EventLogEntry[];

  // 通知队列
  notifications: NotificationItem[];

  // 性能 / LOD
  currentFps: number;
  lodLevel: LODLevel;

  // 系统时钟
  systemTime: string;

  // Agent 在线统计
  onlineAgentCount: number;
  totalAgentCount: number;
}

export interface SystemActions {
  // 指标更新
  setAlarm: (alarm: AlarmMetric) => void;
  setProduction: (production: ProductionMetric) => void;
  setHealth: (health: HealthMetric) => void;

  // 事件日志
  pushEvent: (entry: Omit<EventLogEntry, 'id'>) => void;
  clearEvents: () => void;

  // 通知
  pushNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // 性能
  updateFps: (fps: number) => void;
  setLodLevel: (level: LODLevel) => void;

  // 时钟
  updateSystemTime: (time: string) => void;

  // Agent 在线
  setOnlineAgentCount: (count: number) => void;
}

let eventIdCounter = 0;
let notificationIdCounter = 0;

const MAX_EVENT_LOG_SIZE = 20;

export const useSystemStore = create<SystemState & SystemActions>((set, get) => ({
  // 初始状态
  alarm: { count: 0, level: 'none' },
  production: { value: 81, unit: '%', status: 'normal' },
  health: { label: '良好', level: 'good' },
  eventLog: [],
  notifications: [],
  currentFps: 60,
  lodLevel: 'full',
  systemTime: '',
  onlineAgentCount: 5,
  totalAgentCount: 5,

  // ─── Actions ───

  setAlarm: (alarm) => set({ alarm }),

  setProduction: (production) => set({ production }),

  setHealth: (health) => set({ health }),

  pushEvent: (entry) => {
    const id = `evt_${++eventIdCounter}_${Date.now()}`;
    set((state) => ({
      eventLog: [{ ...entry, id }, ...state.eventLog].slice(0, MAX_EVENT_LOG_SIZE),
    }));
  },

  clearEvents: () => set({ eventLog: [] }),

  pushNotification: (notification) => {
    const id = `notif_${++notificationIdCounter}_${Date.now()}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  updateFps: (fps) => {
    const prev = get().lodLevel;
    let lodLevel: LODLevel = prev;

    if (fps < 15) lodLevel = 'lod3';
    else if (fps < 20) lodLevel = 'lod2';
    else if (fps < 30) lodLevel = 'lod1';
    else lodLevel = 'full';

    set({ currentFps: fps, lodLevel });
  },

  setLodLevel: (level) => set({ lodLevel: level }),

  updateSystemTime: (time) => set({ systemTime: time }),

  setOnlineAgentCount: (count) => set({ onlineAgentCount: count }),
}));
