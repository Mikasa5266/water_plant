import type { Camera3D, Renderable } from '../utils/geometry3d';
import { mathProj } from '../utils/geometry3d';
import type { AgentId, ActiveAnimation } from '../../types';
import { PARTICLE_ANIM_COORDS } from '../../data/constants';

function getParticleColor(agentId: AgentId): string {
  if (agentId === 'dosing') return '#fbbf24';
  if (agentId === 'uf') return '#22d3ee';
  if (agentId === 'ro') return '#10b981';
  if (agentId === 'supervisor') return '#a855f7';
  return '#14b8a6';
}

export function buildParticleAnim(
  camera: Camera3D,
  animationTick: number,
  activeAnim: ActiveAnimation | null
): Renderable[] {
  if (!activeAnim) return [];

  const elapsed = animationTick - activeAnim.startTick;
  if (elapsed < 0 || elapsed >= activeAnim.duration) return [];

  const list: Renderable[] = [];
  const partColor = getParticleColor(activeAnim.agentId);
  const coords = PARTICLE_ANIM_COORDS[activeAnim.agentId];
  const { origin, target } = coords;

  if (elapsed < 48) {
    for (let i = 0; i < 25; i++) {
      const delay = i * 1.5;
      if (elapsed < delay) continue;
      const p_elapsed = elapsed - delay;
      const p_duration = 24.0;
      const t = Math.min(1.0, p_elapsed / p_duration);

      const cx_base = origin.x + (target.x - origin.x) * t;
      const cy_base = origin.y + (target.y - origin.y) * t;
      const cz_base = origin.z + (target.z - origin.z) * t;

      const spiralRadius = Math.sin(t * Math.PI) * 16.0 + 2.0;
      const angle = (t * Math.PI * 4) + (i * 0.252);
      const cx = cx_base + Math.cos(angle) * spiralRadius;
      const cy = cy_base + Math.sin(angle) * spiralRadius;
      const cz = cz_base + Math.sin(i * 1.7) * 4;

      const projPart = mathProj(cx, cy, cz, camera);
      const size = 1.2 + (i % 3) * 0.8;
      const opacity = 0.35 + Math.sin(t * Math.PI) * 0.65;

      list.push({
        type: 'circle',
        cx: projPart.x, cy: projPart.y, r: size,
        depth: projPart.depth - 22000,
        fill: partColor, stroke: '#ffffff', strokeWidth: 0.5,
        opacity, filter: 'url(#glow)'
      });
    }
  } else if (elapsed >= 48 && elapsed < 72) {
    const t_absorb = (elapsed - 48) / 24.0;
    const projTarget = mathProj(target.x, target.y, target.z, camera);
    const rippleRadius = 20.0 + t_absorb * 45.0;
    const rippleOpacity = (1.0 - t_absorb) * 0.8;

    list.push({
      type: 'circle',
      cx: projTarget.x, cy: projTarget.y, r: rippleRadius,
      depth: projTarget.depth - 25000,
      fill: 'none', stroke: partColor, strokeWidth: 1.5,
      opacity: rippleOpacity, filter: 'url(#glow)'
    });
    list.push({
      type: 'circle',
      cx: projTarget.x, cy: projTarget.y, r: Math.max(2.0, 36.0 * (1.0 - t_absorb)),
      depth: projTarget.depth - 24900,
      fill: 'none', stroke: '#ffffff', strokeWidth: 1.0,
      opacity: rippleOpacity * 0.9, filter: 'url(#glow)'
    });

    for (let i = 0; i < 25; i++) {
      const angle = t_absorb * Math.PI * 6.0 + (i * 0.252);
      const rad = 25.0 * (1.0 - t_absorb) + Math.cos(i * 13) * 3;
      const px = projTarget.x + Math.cos(angle) * rad;
      const py = projTarget.y + Math.sin(angle) * rad;
      const size = 1.0 + (i % 3) * 0.6;
      const opacity = (1.0 - t_absorb) * 0.9;

      list.push({
        type: 'circle',
        cx: px, cy: py, r: size,
        depth: projTarget.depth - 22000,
        fill: i % 2 === 0 ? partColor : '#ffffff',
        stroke: partColor, strokeWidth: 0.3,
        opacity, filter: 'url(#glow)'
      });
    }
  } else if (elapsed >= 72 && elapsed < 120) {
    for (let i = 0; i < 25; i++) {
      const delay = i * 1.5;
      const elapsedDown = elapsed - 72;
      if (elapsedDown < delay) {
        const projTarget = mathProj(target.x, target.y, target.z, camera);
        const angle = (elapsedDown * 0.05) + (i * 0.252);
        const px = projTarget.x + Math.cos(angle) * 12.0;
        const py = projTarget.y + Math.sin(angle) * 12.0;
        list.push({
          type: 'circle',
          cx: px, cy: py, r: 1.5,
          depth: projTarget.depth - 22000,
          fill: partColor, opacity: 0.7, filter: 'url(#glow)'
        });
        continue;
      }

      const p_elapsed = elapsedDown - delay;
      const p_duration = 24.0;
      const t = Math.min(1.0, p_elapsed / p_duration);

      const cx_base = target.x + (origin.x - target.x) * t;
      const cy_base = target.y + (origin.y - target.y) * t;
      const cz_base = target.z + (origin.z - target.z) * t;

      const spiralRadius = Math.sin(t * Math.PI) * 32.0 + 2.0;
      const angle = (t * Math.PI * 3) + (i * 0.252);
      const cx = cx_base + Math.cos(angle) * spiralRadius;
      const cy = cy_base + Math.sin(angle) * spiralRadius;
      const cz = cz_base + Math.cos(i * 2.3) * 4;

      const projPart = mathProj(cx, cy, cz, camera);
      const size = 1.0 + (i % 3) * 0.8;
      const opacity = 0.35 + Math.sin(t * Math.PI) * 0.65;

      list.push({
        type: 'circle',
        cx: projPart.x, cy: projPart.y, r: size,
        depth: projPart.depth - 22000,
        fill: partColor, stroke: '#ffffff', strokeWidth: 0.5,
        opacity, filter: 'url(#glow)'
      });
    }
  }

  return list;
}
