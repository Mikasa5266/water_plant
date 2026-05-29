import type { TelemetryState } from '../../types/index';
import { DEFAULT_TELEMETRY } from '../../data/defaultTelemetry';

export { DEFAULT_TELEMETRY };

export async function mockFetchTelemetry(): Promise<TelemetryState> {
  return { ...DEFAULT_TELEMETRY };
}

export async function mockUpdateTelemetry(
  current: TelemetryState,
  patch: Partial<TelemetryState>
): Promise<TelemetryState> {
  return { ...current, ...patch };
}
