import type { Camera3D, Renderable } from '../utils/geometry3d';
import { mathProj, helperBox, helperCylinder } from '../utils/geometry3d';
import type { TelemetryState, AnomalySimulation } from '../../types';

export function buildTanks(
  camera: Camera3D,
  animationTick: number,
  telemetry: TelemetryState,
  simulation: AnomalySimulation
): Renderable[] {
  const list: Renderable[] = [];
  const isDosingMuddy = simulation.active && simulation.type === 'dosing_abnormal' && simulation.step >= 1 && simulation.step < 7;
  const isUfClogged = simulation.active && simulation.type === 'uf_clogging' && simulation.step >= 1 && simulation.step < 7;

  // 1. Coagulation Basin
  helperBox(-280, 0, -80, 140, 140, 115, 'rgba(15, 23, 42, 0.15)', '#0ea5e9', 0.9, 1.5, camera, list);
  const hCoagLiquid = 90 + Math.sin(animationTick * 0.05) * 2;
  const coagLColor = isDosingMuddy ? 'rgba(180, 83, 9, 0.45)' : 'rgba(14, 165, 233, 0.35)';
  helperBox(-280, 0, -80, 134, 134, hCoagLiquid, coagLColor, '#22d3ee', 0.8, 0.8, camera, list);

  // 2. Chemical storage / Dosing tank
  helperBox(-180, -220, -80, 72, 72, 8, 'rgba(15, 23, 42, 0.75)', '#475569', 0.95, 1.2, camera, list);
  for (const padX of [-180 - 24, -180 + 24]) {
    for (const padY of [-220 - 24, -220 + 24]) {
      const spGround = mathProj(padX, padY, -80, camera);
      const spBase = mathProj(padX, padY, -72, camera);
      list.push({
        type: 'line',
        x1: spGround.x, y1: spGround.y, x2: spBase.x, y2: spBase.y,
        depth: Math.max(spGround.depth, spBase.depth) - 2,
        stroke: '#475569', strokeWidth: 2, opacity: 0.9
      });
    }
  }
  helperCylinder(-180, -220, -72, 24, 110, 16, 'url(#tankBodyShading)', '#475569', 0.9, 1.2, camera, list);
  const hChemLevel = 110 * (telemetry.chemicalLevel / 100);
  helperCylinder(-180, -220, -72, 22.5, hChemLevel, 16, 'rgba(234, 179, 8, 0.55)', '#ffc029', 0.85, 0.8, camera, list);

  // Spinning propeller
  helperBox(-180, -220, 38, 12, 12, 10, '#334155', '#475569', 0.95, 1, camera, list);
  const motorA = animationTick * 0.082;
  const motorPC = mathProj(-180, -220, 48, camera);
  const motorPE1 = mathProj(-180 + 12 * Math.cos(motorA), -220 + 12 * Math.sin(motorA), 48, camera);
  const motorPE2 = mathProj(-180 - 12 * Math.cos(motorA), -220 - 12 * Math.sin(motorA), 48, camera);
  list.push({ type: 'line', x1: motorPC.x, y1: motorPC.y, x2: motorPE1.x, y2: motorPE1.y, depth: motorPC.depth - 3, stroke: '#fbbf24', strokeWidth: 1.5, opacity: 0.95 });
  list.push({ type: 'line', x1: motorPC.x, y1: motorPC.y, x2: motorPE2.x, y2: motorPE2.y, depth: motorPC.depth - 3, stroke: '#fbbf24', strokeWidth: 1.5, opacity: 0.95 });

  // 3. Central Clarifier
  helperCylinder(20, -40, -80, 95, 70, 20, 'rgba(2, 132, 199, 0.12)', '#334155', 0.8, 1.8, camera, list);
  helperCylinder(20, -40, -80, 90, 58, 20, 'rgba(56, 189, 248, 0.22)', '#0ea5e9', 0.8, 0.8, camera, list);
  helperCylinder(20, -40, -80, 32, 75, 16, 'rgba(15, 23, 42, 0.85)', '#38bdf8', 0.95, 1.2, camera, list);

  const clariA = (animationTick * 0.0055) % (2 * Math.PI);
  const clariPC = mathProj(20, -40, -10, camera);
  const clariPO = mathProj(20 + 86 * Math.cos(clariA), -40 + 86 * Math.sin(clariA), -10, camera);
  list.push({ type: 'line', x1: clariPC.x, y1: clariPC.y, x2: clariPO.x, y2: clariPO.y, depth: clariPC.depth - 4, stroke: '#94a3b8', strokeWidth: 3.5, opacity: 0.95 });
  list.push({ type: 'circle', cx: clariPO.x, cy: clariPO.y, r: 3.2, depth: clariPO.depth - 6, fill: '#00f5d4', stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.9 });

  // 4. Ultrafiltration Group
  helperBox(50, 220, -80, 145, 115, 12, 'rgba(15, 23, 42, 0.8)', '#334155', 0.9, 1.2, camera, list);
  const statusAColor = isUfClogged ? '#ef4444' : '#10b981';

  helperCylinder(18, 180, -68, 13, 100, 12, 'url(#steelColumnGrad)', '#64748b', 0.9, 1.2, camera, list);
  const topA = mathProj(18, 180, 32, camera);
  list.push({ type: 'circle', cx: topA.x, cy: topA.y, r: 3.5, depth: topA.depth - 5, fill: statusAColor, stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.95, filter: 'url(#glow)' });

  helperCylinder(50, 220, -68, 13, 100, 12, 'url(#steelColumnGrad)', '#64748b', 0.9, 1.2, camera, list);
  const topB = mathProj(50, 220, 32, camera);
  list.push({ type: 'circle', cx: topB.x, cy: topB.y, r: 3.5, depth: topB.depth - 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.95 });

  helperCylinder(82, 260, -68, 13, 100, 12, 'url(#steelColumnGrad)', '#64748b', 0.9, 1.2, camera, list);
  const topC = mathProj(82, 260, 32, camera);
  list.push({ type: 'circle', cx: topC.x, cy: topC.y, r: 3.5, depth: topC.depth - 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 0.5, opacity: 0.95 });

  const jointS = mathProj(18, 180, -50, camera);
  const jointE = mathProj(82, 260, -50, camera);
  list.push({ type: 'line', x1: jointS.x, y1: jointS.y, x2: jointE.x, y2: jointE.y, depth: jointS.depth - 5, stroke: '#475569', strokeWidth: 3.5, opacity: 0.9 });

  // 5. Terminal Membrane Basin
  helperBox(280, 20, -80, 140, 140, 115, 'rgba(15, 23, 42, 0.15)', '#64748b', 0.9, 1.5, camera, list);
  const hWaterMembrane = 85 + Math.sin(animationTick * 0.04) * 2;
  helperBox(280, 20, -80, 134, 134, hWaterMembrane, 'rgba(16, 185, 129, 0.28)', '#10b981', 0.8, 0.8, camera, list);

  const sheetPlanes = [242, 267, 292, 317];
  sheetPlanes.forEach(sx => {
    const sb1 = mathProj(sx, -45, -75, camera);
    const sb2 = mathProj(sx, 45, -75, camera);
    const rLt2 = mathProj(sx, 45, 15, camera);
    const rLt1 = mathProj(sx, -45, 15, camera);
    const dGridSum = (sb1.depth + sb2.depth + rLt2.depth + rLt1.depth) / 4;
    list.push({
      type: 'polygon',
      points: [sb1, sb2, rLt2, rLt1],
      depth: dGridSum - 2,
      fill: 'rgba(52, 211, 153, 0.2)', stroke: 'rgba(16, 185, 129, 0.6)', strokeWidth: 1, opacity: 0.9
    });
  });

  return list;
}
