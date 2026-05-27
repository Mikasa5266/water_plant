import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import type { ParticleIntent, AgentId } from '../../types';
import { toThreePos, toThreePosTuple } from '../utils/coordinates';

const PARTICLE_COUNT = 60;
const IDLE_COUNT = 30; // 空闲背景粒子数

/** 粒子颜色映射 */
const INTENT_COLORS: Record<ParticleIntent, string> = {
  anomaly: '#ef4444',  // 红：异常上报
  dispatch: '#f59e0b', // 橙：任务派发
  execute: '#10b981',  // 绿：执行恢复
};

interface ParticleData {
  progress: number;
  speed: number;
  segmentIndex: number;
}

/**
 * 获取设备底部坐标（data 空间，z 压低到地面）
 */
function getDevicePos(agentId: AgentId): { x: number; y: number; z: number } {
  const a = AGENT_3D_ANCHORS[agentId];
  return { x: a.x, y: a.y, z: 10 };
}

/**
 * 获取中枢底部坐标（data 空间）
 */
function getSupervisorBase(): { x: number; y: number; z: number } {
  const a = AGENT_3D_ANCHORS.supervisor;
  return { x: a.x, y: a.y, z: 20 };
}

/**
 * 根据 intent 和目标 agent 生成三段式粒子路径
 * - anomaly:  device → supervisor_base → supervisor_agent
 * - dispatch: supervisor_agent → midpoint → agent
 * - execute:  agent → midpoint → device
 */
function buildPath(intent: ParticleIntent, targetAgentId: AgentId): THREE.Vector3[] {
  const agent = AGENT_3D_ANCHORS[targetAgentId];
  const supervisor = AGENT_3D_ANCHORS.supervisor;
  const device = getDevicePos(targetAgentId);
  const supervisorBase = getSupervisorBase();

  const agentPos = toThreePosTuple(agent);
  const supervisorPos = toThreePosTuple(supervisor);
  const devicePos = toThreePosTuple(device);
  const supervisorBasePos = toThreePosTuple(supervisorBase);

  switch (intent) {
    case 'anomaly': {
      // 设备 → 中枢底部 → 中枢球体
      const mid = new THREE.Vector3(
        (devicePos[0] + supervisorBasePos[0]) / 2,
        (devicePos[1] + supervisorBasePos[1]) / 2 + 20,
        (devicePos[2] + supervisorBasePos[2]) / 2,
      );
      return [
        new THREE.Vector3(...devicePos),
        mid,
        new THREE.Vector3(...supervisorPos),
      ];
    }
    case 'dispatch': {
      // 中枢球体 → 目标 Agent
      const mid = new THREE.Vector3(
        (supervisorPos[0] + agentPos[0]) / 2,
        (supervisorPos[1] + agentPos[1]) / 2 + 25,
        (supervisorPos[2] + agentPos[2]) / 2,
      );
      return [
        new THREE.Vector3(...supervisorPos),
        mid,
        new THREE.Vector3(...agentPos),
      ];
    }
    case 'execute': {
      // Agent → 设备
      const mid = new THREE.Vector3(
        (agentPos[0] + devicePos[0]) / 2,
        (agentPos[1] + devicePos[1]) / 2 + 10,
        (agentPos[2] + devicePos[2]) / 2,
      );
      return [
        new THREE.Vector3(...agentPos),
        mid,
        new THREE.Vector3(...devicePos),
      ];
    }
  }
}

/**
 * 生成 idle 背景粒子路径（围绕各 agent 的中枢缓慢巡回）
 */
function buildIdlePaths(): THREE.Vector3[] {
  const agents: AgentId[] = ['dosing', 'uf', 'ro', 'pump'];
  const supervisor = AGENT_3D_ANCHORS.supervisor;
  const supervisorPos = toThreePosTuple(supervisor);

  const waypoints: THREE.Vector3[] = [new THREE.Vector3(...supervisorPos)];

  for (const id of agents) {
    const a = AGENT_3D_ANCHORS[id];
    const ap = toThreePosTuple(a);
    // 中间浮空点
    waypoints.push(new THREE.Vector3(
      (supervisorPos[0] + ap[0]) / 2,
      Math.max(supervisorPos[1], ap[1]) + 15,
      (supervisorPos[2] + ap[2]) / 2,
    ));
    waypoints.push(new THREE.Vector3(...ap));
  }

  return waypoints;
}

/**
 * 粒子飞行系统
 * - anomaly: 设备→中枢（红，3 段贝塞尔式路径）
 * - dispatch: 中枢→专项Agent（橙）
 * - execute: Agent→设备（绿）
 * - idle: 低速巡回背景粒子
 */
export const ParticleSystem: React.FC = () => {
  const particleIntent = useScenarioStore((s) => s.particleIntent);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const pointsRef = useRef<THREE.Points>(null);
  const animGeometryRef = useRef<THREE.BufferGeometry>(null);
  const idleGeometryRef = useRef<THREE.BufferGeometry>(null);

  const particlesRef = useRef<ParticleData[]>([]);
  const idleParticlesRef = useRef<ParticleData[]>([]);
  const pathSegmentsRef = useRef<THREE.Vector3[][]>([]);

  const animPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const idlePositions = useMemo(() => new Float32Array(IDLE_COUNT * 3), []);

  // 初始化 idle 路径和粒子
  const idleWaypointsRef = useRef<THREE.Vector3[]>([]);
  useEffect(() => {
    idleWaypointsRef.current = buildIdlePaths();
    idleParticlesRef.current = Array.from({ length: IDLE_COUNT }, () => ({
      progress: Math.random(),
      speed: 0.02 + Math.random() * 0.04,
      segmentIndex: 0,
    }));
  }, []);

  // 当 particleIntent 变化：生成/清除动画粒子
  useEffect(() => {
    if (particleIntent && targetAgentId) {
      const segments = buildPath(particleIntent, targetAgentId);
      pathSegmentsRef.current = [];

      // 将 N 个 waypoint 拆成 N-1 个线段
      for (let i = 0; i < segments.length - 1; i++) {
        pathSegmentsRef.current.push([segments[i], segments[i + 1]]);
      }

      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        progress: Math.random(),
        speed: 0.12 + Math.random() * 0.4,
        segmentIndex: 0,
      }));
    } else {
      particlesRef.current = [];
      animPositions.fill(0);
      if (animGeometryRef.current) {
        animGeometryRef.current.attributes.position.needsUpdate = true;
      }
    }
  }, [particleIntent, targetAgentId]);

  // 每帧更新动画粒子位置
  useFrame((_, delta) => {
    // ── 动画粒子 ──
    if (animGeometryRef.current && pathSegmentsRef.current.length > 0) {
      const parts = particlesRef.current;
      const segments = pathSegmentsRef.current;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.progress += p.speed * delta;

        if (p.progress > 1) {
          p.progress -= 1;
          // 循环到下一段路径
          p.segmentIndex = (p.segmentIndex + 1) % segments.length;
        }

        const seg = segments[p.segmentIndex % segments.length];
        const from = seg[0];
        const to = seg[1];
        const t = p.progress;
        const idx = i * 3;

        // 弧线偏移
        const midT = 0.5;
        const arcHeight = 15;
        const arc = 4 * arcHeight * t * (1 - t);

        animPositions[idx] = from.x + (to.x - from.x) * t;
        animPositions[idx + 1] = from.y + (to.y - from.y) * t + arc;
        animPositions[idx + 2] = from.z + (to.z - from.z) * t;
      }

      animGeometryRef.current.attributes.position.needsUpdate = true;
    }

    // ── idle 背景粒子（始终运行）──
    if (idleGeometryRef.current && idleWaypointsRef.current.length > 1) {
      const waypoints = idleWaypointsRef.current;
      const parts = idleParticlesRef.current;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.progress += p.speed * delta;
        if (p.progress > 1) {
          p.progress -= 1;
          p.segmentIndex = (p.segmentIndex + 1) % (waypoints.length - 1);
        }

        const segIdx = p.segmentIndex % (waypoints.length - 1);
        const from = waypoints[segIdx];
        const to = waypoints[segIdx + 1];
        const t = p.progress;
        const idx = i * 3;

        const arc = 6 * t * (1 - t);
        idlePositions[idx] = from.x + (to.x - from.x) * t;
        idlePositions[idx + 1] = from.y + (to.y - from.y) * t + arc;
        idlePositions[idx + 2] = from.z + (to.z - from.z) * t;
      }

      idleGeometryRef.current.attributes.position.needsUpdate = true;
    }
  });

  const activeColor = particleIntent
    ? INTENT_COLORS[particleIntent]
    : '#60a5fa';

  return (
    <>
      {/* Idle particles — 始终渲染 */}
      <points>
        <bufferGeometry ref={idleGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={IDLE_COUNT}
            itemSize={3}
            array={idlePositions}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.0}
          color="#93c5fd"
          sizeAttenuation
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Active particles — 仅在 intent 时渲染 */}
      {particleIntent && (
        <points ref={pointsRef}>
          <bufferGeometry ref={animGeometryRef}>
            <bufferAttribute
              attach="attributes-position"
              count={PARTICLE_COUNT}
              itemSize={3}
              array={animPositions}
            />
          </bufferGeometry>
          <pointsMaterial
            size={2.5}
            color={activeColor}
            sizeAttenuation
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </>
  );
};
