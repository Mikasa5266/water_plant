import type { Alert } from '../../types/index';
import { isMockMode } from '../config';
import { request } from '../client';
import { MOCK_ALERTS_EMPTY } from '../mock/alertsMock';

export async function listAlerts(): Promise<Alert[]> {
  if (isMockMode()) {
    return [...MOCK_ALERTS_EMPTY];
  }
  return request<Alert[]>('/alerts');
}
