import type { TelemetryState } from '../../types';

export const DEFAULT_TELEMETRY: TelemetryState = {
  inletFlow: 1240,
  outletFlow: 1210,
  inletTurbidity: 18.5,
  outletTurbidity: 0.04,
  dosingRate: 4.8,
  chemicalLevel: 72,
  ufPressure: 82,
  membraneFlux: 74.5,
  energyConsumption: 0.22,
  healthScore: 98,
  activeAgentsCount: 4,
  onlineRate: 99.2,
};

export async function mockFetchTelemetry(): Promise<TelemetryState> {
  return { ...DEFAULT_TELEMETRY };
}

export async function mockUpdateTelemetry(
  current: TelemetryState,
  patch: Partial<TelemetryState>
): Promise<TelemetryState> {
  return { ...current, ...patch };
}
