import React from 'react';
import type { Camera3D, Renderable } from './utils/geometry3d';
import type { TelemetryState, AnomalySimulation, AgentId, CardState, ActiveAnimation } from '../types/index';
import { buildGrid } from './builders/gridBuilder';
import { buildPipelines } from './builders/pipelineBuilder';
import { buildTanks } from './builders/tankBuilder';
import { buildHUDLabels } from './builders/hudLabelBuilder';
import { buildLaserLines } from './builders/laserLineBuilder';
import { buildParticleAnim } from './builders/particleAnimBuilder';

interface SceneRendererProps {
  camera: Camera3D;
  animationTick: number;
  telemetry: TelemetryState;
  simulation: AnomalySimulation;
  cards: Record<AgentId, CardState>;
  agentStatuses: Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>;
  activeAnim: ActiveAnimation | null;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  camera, animationTick, telemetry, simulation, cards, agentStatuses, activeAnim
}) => {
  const renderables: Renderable[] = [
    ...buildGrid(camera, animationTick),
    ...buildPipelines(camera, animationTick, simulation),
    ...buildTanks(camera, animationTick, telemetry, simulation),
    ...buildLaserLines(camera, animationTick, cards, agentStatuses),
    ...buildParticleAnim(camera, animationTick, activeAnim),
    ...buildHUDLabels(camera, telemetry)
  ];

  renderables.sort((a, b) => b.depth - a.depth);

  return (
    <>
      {renderables.map((r, idx) => {
        if (r.type === 'line') {
          return (
            <line
              key={`3d-line-${idx}`}
              x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
              stroke={r.stroke} strokeWidth={r.strokeWidth}
              strokeOpacity={r.opacity} strokeDasharray={r.strokeDasharray}
              filter={r.filter} className={r.className}
            />
          );
        } else if (r.type === 'polygon') {
          return (
            <polygon
              key={`3d-poly-${idx}`}
              points={r.points?.map(p => `${p.x},${p.y}`).join(' ')}
              fill={r.fill} stroke={r.stroke} strokeWidth={r.strokeWidth}
              strokeOpacity={r.opacity} fillOpacity={r.opacity}
              strokeDasharray={r.strokeDasharray} filter={r.filter}
              className={r.className}
            />
          );
        } else if (r.type === 'circle') {
          return (
            <circle
              key={`3d-circle-${idx}`}
              cx={r.cx} cy={r.cy} r={r.r}
              fill={r.fill} fillOpacity={r.opacity}
              stroke={r.stroke} strokeWidth={r.strokeWidth}
              strokeOpacity={r.opacity} filter={r.filter}
              className={r.className}
            />
          );
        } else if (r.type === 'text') {
          return (
            <text
              key={`3d-text-${idx}`}
              x={r.x} y={r.y} fill={r.fill}
              fontSize={r.fontSize} fontWeight={r.fontWeight}
              textAnchor={r.textAnchor || 'start'}
              fontFamily={r.fontFamily || 'monospace'}
              className={r.className}
            >
              {r.text}
            </text>
          );
        }
        return null;
      })}
    </>
  );
};
