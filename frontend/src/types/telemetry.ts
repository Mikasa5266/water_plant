export interface TelemetryState {
  inletFlow: number;
  outletFlow: number;
  inletTurbidity: number;
  outletTurbidity: number;
  dosingRate: number;
  chemicalLevel: number;
  ufPressure: number;
  membraneFlux: number;
  energyConsumption: number;
  healthScore: number;
  activeAgentsCount: number;
  onlineRate: number;
}
