import type { Camera3D, Renderable } from '../utils/geometry3d';
import { helperHUDLabel } from '../utils/geometry3d';
import type { TelemetryState } from '../../types';

export function buildHUDLabels(camera: Camera3D, telemetry: TelemetryState): Renderable[] {
  const list: Renderable[] = [];

  const colorCoag = telemetry.inletTurbidity > 25 ? '#fbbf24' : '#22d3ee';
  const statCoag = telemetry.inletTurbidity > 25 ? '进水有机负荷偏高' : '水质稳定流转中';
  helperHUDLabel(-280, 0, 50, '1# 混凝沉淀池', `浊度指标: ${telemetry.inletTurbidity.toFixed(1)} NTU`, `工况: ${statCoag}`, colorCoag, camera, list);
  helperHUDLabel(-180, -220, 60, '2# 药品配制釜', `料位储量: ${telemetry.chemicalLevel}%`, `投加速率: ${telemetry.dosingRate.toFixed(1)} mg/L`, '#fbbf24', camera, list);
  helperHUDLabel(20, -40, 10, '3# 澄清自检环池', `出水浑浊: ${telemetry.outletTurbidity.toFixed(3)} NTU`, '评级: 优等 (98%)', '#0ea5e9', camera, list);

  const colorUf = telemetry.ufPressure > 150 ? '#f43f5e' : '#38bdf8';
  const statUf = telemetry.ufPressure > 150 ? '滤丝阻力偏高警告' : '在役稳态回收';
  helperHUDLabel(50, 220, 20, '4# 超滤反应釜组', `跨膜压差: ${telemetry.ufPressure} kPa`, `工况: ${statUf}`, colorUf, camera, list);
  helperHUDLabel(280, 20, 60, '5# 终端膜反应池', `膜组通量: ${telemetry.roFlux.toFixed(1)} LMH`, '净水出流: 0.04 NTU', '#10b981', camera, list);

  return list;
}
