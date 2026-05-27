import type { TelemetryState } from '../types/index';

export const DEFAULT_TELEMETRY: TelemetryState = {
  inletFlow: 1240,
  outletFlow: 1210,
  inletTurbidity: 18.5,
  outletTurbidity: 0.04,
  dosingRate: 4.8,
  chemicalLevel: 72,
  ufPressure: 82,
  roPressureDiff: 0.45,
  roFlux: 75.2,
  roConductivity: 18,
  roFlushMode: 'ready',
  roRecoveryTime: 0,
  pumpSpeed: 1480,
  pumpCurrent: 28,
  pumpTemperature: 55,
  pumpStatus: 'normal',
  energyConsumption: 0.22,
  healthScore: 98,
  activeAgentsCount: 5,
  onlineRate: 99.2
};
