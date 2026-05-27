import type { TelemetryState } from '../types/index';
import { request } from './client';

export function fetchTelemetry(): Promise<TelemetryState> {
  return request<TelemetryState>('/telemetry');
}

export function updateTelemetry(patch: Partial<TelemetryState>): Promise<TelemetryState> {
  return request<TelemetryState>('/telemetry', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
