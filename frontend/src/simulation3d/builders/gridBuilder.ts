import type { Camera3D, Renderable } from '../utils/geometry3d';
import { mathProj } from '../utils/geometry3d';

export function buildGrid(camera: Camera3D, animationTick: number): Renderable[] {
  const list: Renderable[] = [];

  for (let i = -300; i <= 300; i += 60) {
    const xp1 = mathProj(i, -300, -80, camera);
    const xp2 = mathProj(i, 300, -80, camera);
    list.push({
      type: 'line',
      x1: xp1.x, y1: xp1.y, x2: xp2.x, y2: xp2.y,
      depth: Math.max(xp1.depth, xp2.depth) + 120,
      stroke: '#1e2e42', strokeWidth: 0.8, opacity: 0.35
    });

    const yp1 = mathProj(-300, i, -80, camera);
    const yp2 = mathProj(300, i, -80, camera);
    list.push({
      type: 'line',
      x1: yp1.x, y1: yp1.y, x2: yp2.x, y2: yp2.y,
      depth: Math.max(yp1.depth, yp2.depth) + 120,
      stroke: '#1e2e42', strokeWidth: 0.8, opacity: 0.35
    });
  }

  for (const rScope of [110, 200, 280]) {
    const verts = [];
    for (let a = 0; a < 32; a++) {
      const rad = (a * 2 * Math.PI) / 32;
      verts.push(mathProj(rScope * Math.cos(rad), rScope * Math.sin(rad), -80, camera));
    }
    list.push({
      type: 'polygon',
      points: verts,
      depth: 10000 + rScope,
      fill: 'none', stroke: '#1e2e50', strokeWidth: 0.7, opacity: 0.4,
      strokeDasharray: '3 5'
    });
  }

  const tickAngle = (animationTick * 0.007) % (2 * Math.PI);
  const beamTerm = mathProj(240 * Math.cos(tickAngle), 240 * Math.sin(tickAngle), -80, camera);
  const beamOrigin = mathProj(0, 0, -80, camera);
  list.push({
    type: 'line',
    x1: beamOrigin.x, y1: beamOrigin.y, x2: beamTerm.x, y2: beamTerm.y,
    depth: Math.max(beamOrigin.depth, beamTerm.depth) + 110,
    stroke: '#22d3ee', strokeWidth: 1.5, opacity: 0.45, filter: 'url(#glow)'
  });

  return list;
}
