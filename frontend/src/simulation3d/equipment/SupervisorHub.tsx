import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS, DEVICE_ANCHORS } from '../../data/constants';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { toThreePos } from '../utils/coordinates';

interface SupervisorHubProps {
  agentId?: 'supervisor';
}

/**
 * 监管中枢：大型蓝色发光圆柱体 + 旋转光环 (torus)
 * 位于场景中心，代表全厂大脑
 */
export const SupervisorHub: React.FC<SupervisorHubProps> = () => {
  const anchor = DEVICE_ANCHORS.supervisor;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const groundY = 0;

  const torusRef = useRef<THREE.Mesh>(null);
  const innerTorusRef = useRef<THREE.Mesh>(null);

  // 读取 store：分析中/派发中 加速旋转
  const phase = useScenarioStore((s) => s.phase);

  useFrame((_, delta) => {
    // 分析中、派发中加速光环
    const isActive = phase === 'analyzing' || phase === 'dispatching';
    const speed = isActive ? 2.4 : 0.8;

    if (torusRef.current) {
      torusRef.current.rotation.y += delta * speed;
      torusRef.current.rotation.x += delta * 0.15;
    }

    // 内层光环反向旋转
    if (innerTorusRef.current) {
      innerTorusRef.current.rotation.z += delta * speed * 0.6;
    }
  });

  return (
    <group position={[pos[0], groundY, pos[2]]}>
      {/* 底座 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[10, 11, 1.2, 32]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 主体圆柱 */}
      <mesh position={[0, 12, 0]} castShadow>
        <cylinderGeometry args={[8, 9, 20, 32]} />
        <meshStandardMaterial
          color="#378ADD"
          emissive="#378ADD"
          emissiveIntensity={0.3}
          transparent
          opacity={0.75}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>

      {/* 内部线框 */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[7.5, 8.5, 18, 32]} />
        <meshBasicMaterial color="#5ba0f5" wireframe transparent opacity={0.15} />
      </mesh>

      {/* 顶部发光核心球 */}
      <mesh position={[0, 22.5, 0]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#378ADD"
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* 旋转光环 torus */}
      <mesh ref={torusRef} position={[0, 14, 0]}>
        <torusGeometry args={[12, 0.7, 16, 64]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#378ADD"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* 第二层光环（反向旋转） */}
      <mesh ref={innerTorusRef} position={[0, 8, 0]} rotation={[Math.PI / 6, 0, Math.PI / 3]}>
        <torusGeometry args={[10.5, 0.5, 16, 48]} />
        <meshStandardMaterial
          color="#93c5fd"
          emissive="#378ADD"
          emissiveIntensity={0.4}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};
