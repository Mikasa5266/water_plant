/**
 * 能量链路粒子系统（EnergyLink v2）
 *
 * 替代旧版 InstancedMesh 粒子流，采用大屏智慧水厂更合适的设计：
 * - 细线链路 + 流动脉冲 + 端点波纹，而非"巨大火球粒子团"
 * - 精密、克制、可读性强
 * - 每 intent 有独立的颜色语义和路径风格
 *
 * 渲染结构：
 *   1. 主链路细线（drei Line）—— 半透明发光色曲线/直线
 *   2. 2 个脉冲球体沿路径流动 —— 呼吸缩放高亮
 *   3. 起点扩散环 —— 信号发出波纹（首次触发）
 *   4. 终点接收环 —— 信号抵达波纹（每个脉冲周期触发一次）
 *
 * 无 idle 背景粒子（已被删除，画面更干净）。
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { DEVICE_CENTERS } from '../config';
import type { ParticleIntent, AgentId } from '../../types';
import { toThreePosTuple } from '../utils/coordinates';

// ─── 常量 ───

const ANIM_DURATION = 2.0; // 单次脉冲周期（秒）
const PULSE_OFFSET = 0.3; // 第二个脉冲延迟（秒）
const RING_EXPAND_DURATION = 1.2; // 波纹扩散持续（秒）
const RING_MAX_RADIUS = 22; // 起点波纹最大半径
const RING_MAX_RADIUS_END = 26; // 终点波纹最大半径
const LINE_OPACITY = 0.45;
const LINE_WIDTH = 3;
const PULSE_BASE_SCALE = 2.5;

const ANIM_SPEED = 1 / ANIM_DURATION;
const RING_HIDE_THRESHOLD = 0.01;

/** 颜色映射 */
const INTENT_COLORS: Record<ParticleIntent, string> = {
  anomaly: '#ef4444',
  dispatch: '#f59e0b',
  execute: '#10b981',
};

// ─── 路径构建 ───

function getDevicePos(agentId: AgentId): { x: number; y: number; z: number } {
  const center = DEVICE_CENTERS[agentId];
  return { x: center.x, y: center.y, z: 2 };
}

function getSupervisorCenter(): { x: number; y: number; z: number } {
  return DEVICE_CENTERS.supervisor;
}

function buildPath(intent: ParticleIntent, targetAgentId: AgentId): THREE.Vector3[] {
  const agent = AGENT_3D_ANCHORS[targetAgentId];
  const supervisorCenter = getSupervisorCenter();
  const device = getDevicePos(targetAgentId);
  const agentPos = toThreePosTuple(agent);
  const supervisorCenterPos = toThreePosTuple(supervisorCenter);
  const devicePos = toThreePosTuple(device);

  switch (intent) {
    case 'anomaly': {
      const mid = new THREE.Vector3(
        (devicePos[0] + supervisorCenterPos[0]) / 2,
        Math.max(devicePos[1], supervisorCenterPos[1]) + 25,
        (devicePos[2] + supervisorCenterPos[2]) / 2,
      );
      return [
        new THREE.Vector3(...devicePos),
        mid,
        new THREE.Vector3(...supervisorCenterPos),
      ];
    }
    case 'dispatch': {
      const mid = new THREE.Vector3(
        (supervisorCenterPos[0] + agentPos[0]) / 2,
        Math.max(supervisorCenterPos[1], agentPos[1]) + 25,
        (supervisorCenterPos[2] + agentPos[2]) / 2,
      );
      return [
        new THREE.Vector3(...supervisorCenterPos),
        mid,
        new THREE.Vector3(...agentPos),
      ];
    }
    case 'execute': {
      return [
        new THREE.Vector3(...agentPos),
        new THREE.Vector3(...devicePos),
      ];
    }
  }
}

/**
 * 沿多段线路径均匀插值
 */
function interpolatePath(points: THREE.Vector3[], t: number): THREE.Vector3 {
  if (points.length < 2) return points[0]?.clone() ?? new THREE.Vector3();
  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT <= 0) return points[0].clone();
  if (clampedT >= 1) return points[points.length - 1].clone();

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = points[i].distanceTo(points[i + 1]);
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength <= 0) return points[0].clone();

  const targetDist = clampedT * totalLength;
  let accumulated = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetDist) {
      const localT = (targetDist - accumulated) / segmentLengths[i];
      return new THREE.Vector3().lerpVectors(points[i], points[i + 1], localT);
    }
    accumulated += segmentLengths[i];
  }

  return points[points.length - 1].clone();
}

// ─── 波纹环子组件 ───

const Ring: React.FC<{
  ringRef: React.RefObject<THREE.Mesh | null>;
  color: THREE.Color;
  baseRadius?: number;
}> = ({ ringRef, color, baseRadius = 1 }) => (
  <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
    <torusGeometry args={[baseRadius, 0.6, 8, 32]} />
    <meshBasicMaterial
      color={color}
      transparent
      opacity={0}
      depthWrite={false}
    />
  </mesh>
);

// ─── 主组件 ───

export const ParticleSystem: React.FC = () => {
  const particleIntent = useScenarioStore((s) => s.particleIntent);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  // 路径点（useMemo 确保 intent 变化时路径更新并触发重渲染）
  const pathPoints = useMemo(() => {
    if (!particleIntent || !targetAgentId) return [] as THREE.Vector3[];
    return buildPath(particleIntent, targetAgentId);
  }, [particleIntent, targetAgentId]);

  // 动画状态 refs（不触发重渲染）
  const pulseProgress = useRef(0);
  const startRingTimer = useRef(-1);
  const endRingTimer = useRef(-1);
  const prevIntent = useRef(particleIntent);

  // 检测 intent 变化 → 重置动画
  if (prevIntent.current !== particleIntent) {
    prevIntent.current = particleIntent;
    pulseProgress.current = 0;
    startRingTimer.current = 0; // 触发起点波纹
    endRingTimer.current = -1;
  }

  // 3D refs
  const pulse1Ref = useRef<THREE.Mesh>(null);
  const pulse2Ref = useRef<THREE.Mesh>(null);
  const startRingRef = useRef<THREE.Mesh>(null);
  const endRingRef = useRef<THREE.Mesh>(null);

  // 颜色
  const intentColor = useMemo(() => {
    if (!particleIntent) return '#10b981';
    return INTENT_COLORS[particleIntent];
  }, [particleIntent]);

  const threeColor = useMemo(() => new THREE.Color(intentColor), [intentColor]);

  // ── 每帧动画 ──
  useFrame((_, delta) => {
    if (pathPoints.length < 2) return;

    // 脉冲进度
    pulseProgress.current += ANIM_SPEED * delta;

    if (pulseProgress.current >= 1) {
      pulseProgress.current -= 1;
      endRingTimer.current = 0; // 脉冲到达终点 → 终点波纹
    }

    const t1 = pulseProgress.current;
    const t2 = Math.min(1, t1 + PULSE_OFFSET / ANIM_DURATION);

    // 更新脉冲球体位置
    const p1Pos = interpolatePath(pathPoints, t1);
    const p2Pos = interpolatePath(pathPoints, t2);

    if (pulse1Ref.current) {
      pulse1Ref.current.position.copy(p1Pos);
      pulse1Ref.current.scale.setScalar(PULSE_BASE_SCALE + Math.sin(t1 * Math.PI) * 1.0);
    }
    if (pulse2Ref.current) {
      pulse2Ref.current.position.copy(p2Pos);
      pulse2Ref.current.scale.setScalar(PULSE_BASE_SCALE + Math.sin(t2 * Math.PI) * 1.0);
    }

    // ── 起点波纹 ──
    if (startRingRef.current) {
      startRingRef.current.position.copy(pathPoints[0]);
      const elapsed = startRingTimer.current;
      if (elapsed >= 0 && elapsed < RING_EXPAND_DURATION) {
        const p = elapsed / RING_EXPAND_DURATION;
        startRingRef.current.scale.setScalar(1 + p * RING_MAX_RADIUS);
        if (startRingRef.current.material instanceof THREE.MeshBasicMaterial) {
          startRingRef.current.material.opacity = (1 - p) * 0.85;
        }
        startRingTimer.current += delta;
      } else {
        startRingRef.current.scale.setScalar(RING_HIDE_THRESHOLD);
      }
    }

    // ── 终点波纹 ──
    if (endRingRef.current) {
      endRingRef.current.position.copy(pathPoints[pathPoints.length - 1]);
      const elapsed = endRingTimer.current;
      if (elapsed >= 0 && elapsed < RING_EXPAND_DURATION * 1.2) {
        const p = elapsed / (RING_EXPAND_DURATION * 1.2);
        endRingRef.current.scale.setScalar(1 + p * RING_MAX_RADIUS_END);
        if (endRingRef.current.material instanceof THREE.MeshBasicMaterial) {
          endRingRef.current.material.opacity = (1 - p) * 0.85;
        }
        endRingTimer.current += delta;
      } else {
        endRingRef.current.scale.setScalar(RING_HIDE_THRESHOLD);
      }
    }
  });

  // 没有 intent 时不渲染
  if (pathPoints.length < 2) return null;

  return (
    <group>
      {/* 1. 主链路细线 */}
      <Line
        key={`line-${particleIntent}-${targetAgentId}`}
        points={pathPoints}
        color={intentColor}
        lineWidth={LINE_WIDTH}
        transparent
        opacity={LINE_OPACITY}
      />

      {/* 2. 脉冲球体 × 2 */}
      <mesh ref={pulse1Ref}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={intentColor}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={pulse2Ref}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={intentColor}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>

      {/* 3. 起点扩散环 */}
      <Ring ringRef={startRingRef} color={threeColor} />

      {/* 4. 终点接收环 */}
      <Ring ringRef={endRingRef} color={threeColor} />
    </group>
  );
};
