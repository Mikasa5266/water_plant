import type { Alert } from '../../types/index';

export const MOCK_ALERTS_EMPTY: Alert[] = [];

export const MOCK_ALERTS_ANOMALY: Alert[] = [
  {
    id: 'alert-001',
    severity: 'critical',
    title: '加药投加量异常偏低',
    status: 'active',
    deviceId: 'dosing-001',
    createdAt: new Date().toISOString(),
  },
];
