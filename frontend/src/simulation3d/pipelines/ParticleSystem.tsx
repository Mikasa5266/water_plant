import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { PARTICLE_ANIM_COORDS } from '../../data/constants';
import type { ParticleIntent, AgentId } from '../../types';
import { toThreePos, toThreePosTuple } from '../utils/coordinates';

const PARTICLE_COUNT = 40;

/** 粒子颜色映射 */
const INTENT_COLORS: Record<ParticleIntent, string> = {
  anomaly: '#ef4444',  // 红：异常上报
  dispatch: '#f59e0b', // 橙：任务派发
  execute: '#10b981',  // 绿：执行恢复
};

interface ParticleData {
  progress: number;
  speed: number;
  offset: number;
}

/**
 * 粒子飞行系统
 * 根据 store 的 particleIntent 生成粒子沿路径飞行
 * 使用 BufferGeometry + Points 高效渲染
 */
export const ParticleSystem: React.FC = () => {
  const particleIntent = useScenarioStore((s) => s.particleIntent);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // 粒子运行时数据
  const particlesRef = useRef<ParticleData[]>([]);
  const pathPointsRef = useRef<THREE.Vector3[]>([]);
  const isActiveRef = useRef(false);

  const positions = useMemo(
    () => new Float32Array(PARTICLE_COUNT * 3),
    [],
  );

  // 当 particleIntent 变化：生成/清除粒子
  useEffect(() => {
    if (particleIntent && targetAgentId) {
      spawnParticles(targetAgentId);
      isActiveRef.current = true;
    } else {
      isActiveRef.current = false;
      particlesRef.current = [];
      positions.fill(0);
      if (geometryRef.current) {
        geometryRef.current.attributes.position.needsUpdate = true;
      }
    }
  }, [particleIntent, targetAgentId]);

  const spawnParticles = useCallback((agentId: AgentId) => {
    const coords = PARTICLE_ANIM_COORDS[agentId];
    if (!coords) {
      // 如果没有针对该 agent 的路径，使用 supervisor 路径
      const supCoords = PARTICLE_ANIM_COORDS.supervisor;
      pathPointsRef.current = [
        new THREE.Vector3(...toThreePosTuple(supCoords.origin)),
        new THREE.Vector3(...toThreePosTuple(supCoords.target)),
      ];
    } else {
      pathPointsRef.current = [
        new THREE.Vector3(...toThreePosTuple(coords.origin)),
        new THREE.Vector3(...toThreePosTuple(coords.target)),
      ];
    }

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      progress: Math.random(), // 初始散布
      speed: 0.15 + Math.random() * 0.5,
      offset: (Math.random() - 0.5) * 2,
    }));
  }, []);

  // 每帧更新粒子位置
  useFrame((_, delta) => {
    if (!isActiveRef.current || !geometryRef.current) return;
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    const origin = pathPointsRef.current[0];
    const target = pathPointsRef.current[1];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.progress += p.speed * delta;

      if (p.progress > 1) {
        p.progress -= 1; // 循环
      }

      const t = p.progress;
      const idx = i * 3;
      positions[idx] = origin.x + (target.x - origin.x) * t + p.offset;
      positions[idx + 1] = origin.y + (target.y - origin.y) * t + p.offset * 0.3;
      positions[idx + 2] = origin.z + (target.z - origin.z) * t + p.offset;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
  });

  if (!particleIntent) return null;

  const color = INTENT_COLORS[particleIntent] ?? '#f59e0b';

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          itemSize={3}
          array={positions}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.5}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
