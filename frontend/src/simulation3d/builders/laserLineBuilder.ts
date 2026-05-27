import type { Camera3D, Renderable } from '../utils/geometry3d';
import { mathProj } from '../utils/geometry3d';
import type { AgentId, CardState } from '../../types/index';

export function buildLaserLines(
  camera: Camera3D,
  animationTick: number,
  cards: Record<AgentId, CardState>,
  agentStatuses: Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>
): Renderable[] {
  const list: Renderable[] = [];

  const agentAnchors = {
    supervisor: mathProj(20, -40, 105, camera),
    dosing: mathProj(-180, -220, 95, camera),
    uf: mathProj(50, 220, 85, camera),
    ro: mathProj(280, 20, 100, camera)
  };

  (Object.entries(cards) as [AgentId, CardState][]).forEach(([id, cardState]) => {
    if (!cardState.isOpen) return;
    const projCoords = agentAnchors[id];
    const cardS_X = (cardState.x / 100) * 1000 + 160;
    const cardS_Y = (cardState.y / 100) * 580 + 30;

    const cStatus = agentStatuses[id];
    const lineNeonColor = cStatus === 'warning' ? '#f59e0b' : cStatus === 'processing' ? '#3b82f6' : '#14b8a6';

    list.push({
      type: 'line',
      x1: projCoords.x, y1: projCoords.y, x2: cardS_X, y2: cardS_Y,
      depth: -30000,
      stroke: lineNeonColor, strokeWidth: 1.0, opacity: 0.55,
      strokeDasharray: '2 4', filter: 'url(#glow)'
    });

    const pulsePct = (animationTick * 0.015) % 1.0;
    const pBulletX = projCoords.x + (cardS_X - projCoords.x) * pulsePct;
    const pBulletY = projCoords.y + (cardS_Y - projCoords.y) * pulsePct;
    list.push({
      type: 'circle',
      cx: pBulletX, cy: pBulletY, r: 2.5,
      depth: -30050,
      fill: '#ffffff', stroke: lineNeonColor, strokeWidth: 0.6, opacity: 0.95,
      filter: 'url(#glow)'
    });
  });

  return list;
}
