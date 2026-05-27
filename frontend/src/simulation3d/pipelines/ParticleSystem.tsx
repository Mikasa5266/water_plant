import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import type { ParticleIntent, AgentId } from '../../types';
import { toThreePosTuple } from '../utils/coordinates';

const PARTICLE_COUNT = 60;
const IDLE_COUNT = 30;

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

/** 自定义发光粒子 shader — 在 fragment 中绘制径向渐变圆点 */
const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // 以 UV 中心为圆心，计算到边缘的距离
    float dist = length(vUv - 0.5) * 2.0;
    // 径向衰减：中心亮，边缘透明
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha *= uOpacity;
    // 中心更亮（core glow）
    float core = 1.0 - smoothstep(0.0, 0.35, dist);
    vec3 col = mix(uColor, vec3(1.0), core * 0.6);

    gl_FragColor = vec4(col, alpha);
  }
`;

/** 创建共享的 ShaderMaterial（每个颜色组复用同一份 uniform struct） */
function makeGlowMaterial(color: string, opacity: number): THREE.ShaderMaterial {
  const threeColor = new THREE.Color(color);
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    uniforms: {
      uColor: { value: threeColor },
      uOpacity: { value: opacity },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
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
      const mid = new THREE.Vector3(
        (devicePos[0] + supervisorBasePos[0]) / 2,
        (devicePos[1] + supervisorBasePos[1]) / 2 + 40,
        (devicePos[2] + supervisorBasePos[2]) / 2,
      );
      return [
        new THREE.Vector3(...devicePos),
        mid,
        new THREE.Vector3(...supervisorPos),
      ];
    }
    case 'dispatch': {
      const mid = new THREE.Vector3(
        (supervisorPos[0] + agentPos[0]) / 2,
        (supervisorPos[1] + agentPos[1]) / 2 + 45,
        (supervisorPos[2] + agentPos[2]) / 2,
      );
      return [
        new THREE.Vector3(...supervisorPos),
        mid,
        new THREE.Vector3(...agentPos),
      ];
    }
    case 'execute': {
      const mid = new THREE.Vector3(
        (agentPos[0] + devicePos[0]) / 2,
        (agentPos[1] + devicePos[1]) / 2 + 20,
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
 * 生成 idle 背景粒子路径
 */
function buildIdlePaths(): THREE.Vector3[] {
  const agents: AgentId[] = ['dosing', 'uf', 'ro', 'pump'];
  const supervisor = AGENT_3D_ANCHORS.supervisor;
  const supervisorPos = toThreePosTuple(supervisor);

  const waypoints: THREE.Vector3[] = [new THREE.Vector3(...supervisorPos)];

  for (const id of agents) {
    const a = AGENT_3D_ANCHORS[id];
    const ap = toThreePosTuple(a);
    waypoints.push(new THREE.Vector3(
      (supervisorPos[0] + ap[0]) / 2,
      Math.max(supervisorPos[1], ap[1]) + 25,
      (supervisorPos[2] + ap[2]) / 2,
    ));
    waypoints.push(new THREE.Vector3(...ap));
  }

  return waypoints;
}

/**
 * 粒子飞行系统（升级版 V2）
 *
 * 渲染方案：InstancedMesh + PlaneGeometry + 自定义 ShaderMaterial
 * 每个 instance 是一个面朝相机的发光圆点（通过 plane geometry + 径向渐变 shader）
 * 比纯 pointsMaterial 大很多且自带 glow 效果
 *
 * 改进点：
 * - InstancedMesh 批量渲染（60 粒子仅 1 draw call）
 * - 自定义 shader 做径向渐变 + 中心高亮
 * - 弧度加大（35），路径更明显
 * - 呼吸缩放：粒子在弧线顶点处放大
 */
export const ParticleSystem: React.FC = () => {
  const particleIntent = useScenarioStore((s) => s.particleIntent);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const animMeshRef = useRef<THREE.InstancedMesh>(null);
  const idleMeshRef = useRef<THREE.InstancedMesh>(null);

  const particlesRef = useRef<ParticleData[]>([]);
  const idleParticlesRef = useRef<ParticleData[]>([]);
  const pathSegmentsRef = useRef<THREE.Vector3[][]>([]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // idle 粒子材质（蓝色半透明光晕）
  const idleMaterial = useMemo(() => makeGlowMaterial('#93c5fd', 0.4), []);

  // 初始化 idle 路径和粒子
  const idleWaypointsRef = useRef<THREE.Vector3[]>([]);
  useEffect(() => {
    idleWaypointsRef.current = buildIdlePaths();
    idleParticlesRef.current = Array.from({ length: IDLE_COUNT }, () => ({
      progress: Math.random(),
      speed: 0.03 + Math.random() * 0.08,
      segmentIndex: Math.floor(Math.random() * 8),
    }));
  }, []);

  // 当 particleIntent 变化：生成/清除动画粒子
  useEffect(() => {
    if (particleIntent && targetAgentId) {
      const segments = buildPath(particleIntent, targetAgentId);
      pathSegmentsRef.current = [];

      for (let i = 0; i < segments.length - 1; i++) {
        pathSegmentsRef.current.push([segments[i], segments[i + 1]]);
      }

      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        progress: Math.random(),
        speed: 0.15 + Math.random() * 0.55,
        segmentIndex: 0,
      }));
    } else {
      particlesRef.current = [];
      pathSegmentsRef.current = [];
      if (animMeshRef.current) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          dummy.position.set(0, -500, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          animMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        animMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, [particleIntent, targetAgentId, dummy]);

  // 动画粒子材质（根据 intent 颜色动态创建）
  const animMaterial = useMemo(() => {
    if (!particleIntent) return null;
    const color = INTENT_COLORS[particleIntent];
    return makeGlowMaterial(color, 0.85);
  }, [particleIntent]);

  // 每帧更新
  useFrame((state, delta) => {
    const camera = state.camera;

    // ── 动画粒子 ──
    if (animMeshRef.current && pathSegmentsRef.current.length > 0) {
      const parts = particlesRef.current;
      const segments = pathSegmentsRef.current;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.progress += p.speed * delta;

        if (p.progress > 1) {
          p.progress -= 1;
          p.segmentIndex = (p.segmentIndex + 1) % segments.length;
        }

        const seg = segments[p.segmentIndex % segments.length];
        const from = seg[0];
        const to = seg[1];
        const t = p.progress;

        // 弧线偏移（加大弧度）
        const arcHeight = 35;
        const arc = 4 * arcHeight * t * (1 - t);

        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t + arc;
        const z = from.z + (to.z - from.z) * t;

        dummy.position.set(x, y, z);
        // 面朝相机（billboard）
        dummy.quaternion.copy(camera.quaternion);
        // 呼吸缩放
        const breathe = 8 + Math.sin(t * Math.PI) * 4;
        dummy.scale.setScalar(breathe);
        dummy.updateMatrix();
        animMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      animMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── idle 背景粒子（始终运行）──
    if (idleMeshRef.current && idleWaypointsRef.current.length > 1) {
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

        const arc = 12 * t * (1 - t);
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t + arc;
        const z = from.z + (to.z - from.z) * t;

        dummy.position.set(x, y, z);
        dummy.quaternion.copy(camera.quaternion);
        dummy.scale.setScalar(5 + Math.sin(t * Math.PI) * 2);
        dummy.updateMatrix();
        idleMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      idleMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Idle 粒子 — 发光圆点 */}
      <instancedMesh ref={idleMeshRef} args={[undefined, idleMaterial, IDLE_COUNT]}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

      {/* Active 粒子 — 发光圆点 */}
      {particleIntent && animMaterial && (
        <instancedMesh ref={animMeshRef} args={[undefined, animMaterial, PARTICLE_COUNT]}>
          <planeGeometry args={[1, 1]} />
        </instancedMesh>
      )}
    </>
  );
};
