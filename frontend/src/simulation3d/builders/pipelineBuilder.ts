import type { Camera3D, Renderable } from '../utils/geometry3d';
import { helperPipeline } from '../utils/geometry3d';
import type { AnomalySimulation } from '../../types';
import { PIPE_PATHS } from '../../data/constants';

export function buildPipelines(camera: Camera3D, animationTick: number, simulation: AnomalySimulation): Renderable[] {
  const list: Renderable[] = [];

  helperPipeline(PIPE_PATHS.in, '#1e3a8a', '#22d3ee', 4, 1.25, camera, animationTick, list);

  const activeDoseStep = simulation.active && simulation.type === 'dosing_abnormal' && simulation.step < 7;
  helperPipeline(PIPE_PATHS.dose, '#78350f', activeDoseStep ? '#ef4444' : '#fbbf24', 3, 2.1, camera, animationTick, list);

  const isDosingMuddy = simulation.active && simulation.type === 'dosing_abnormal' && simulation.step >= 1 && simulation.step < 7;
  helperPipeline(PIPE_PATHS.coag, isDosingMuddy ? '#ca8a04' : '#1e3a8a', isDosingMuddy ? '#eab308' : '#38bdf8', 4.5, 1.0, camera, animationTick, list);

  helperPipeline(PIPE_PATHS.clari, '#164e63', '#22d3ee', 4, 1.15, camera, animationTick, list);

  const isUfClogged = simulation.active && simulation.type === 'uf_clogging' && simulation.step >= 1 && simulation.step < 7;
  helperPipeline(PIPE_PATHS.uf, '#064e3b', isUfClogged ? '#f97316' : '#10b981', 4.5, 0.95, camera, animationTick, list);

  helperPipeline(PIPE_PATHS.membrane, '#064e3b', '#10b981', 5, 1.3, camera, animationTick, list);

  return list;
}
