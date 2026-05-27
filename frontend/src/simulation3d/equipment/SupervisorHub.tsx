import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface SupervisorHubProps {
  agentId?: 'supervisor';
}

/**
 * 监管中枢：大型蓝色发光圆柱体 + 旋转光环 (torus)
 * 位于场景中心，代表全厂大脑
 */
export const SupervisorHub: React.FC<SupervisorHubProps> = () => {
  const anchor = AGENT_3D_ANCHORS.supervisor;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  // 圆柱根部在 y=0，顶部到 y=8；光环在圆柱中间偏上
  const groundY = 0;

  const torusRef = useRef<THREE.Mesh>(null);

  // 光环旋转
  useFrame((_, delta) => {
    if (torusRef.current) {
      torusRef.current.rotation.y += delta * 0.8;
      torusRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <group position={[pos[0], groundY, pos[2]]}>
      {/* 底座 */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7, 8, 0.8, 32]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 主体圆柱 */}
      <mesh position={[0, 8, 0]} castShadow>
        <cylinderGeometry args={[5.5, 6, 14, 32]} />
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
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[5.2, 5.8, 13, 32]} />
        <meshBasicMaterial color="#5ba0f5" wireframe transparent opacity={0.15} />
      </mesh>

      {/* 顶部发光核心球 */}
      <mesh position={[0, 15.5, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#378ADD"
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* 旋转光环 torus */}
      <mesh ref={torusRef} position={[0, 10, 0]}>
        <torusGeometry args={[8, 0.5, 16, 64]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#378ADD"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* 第二层光环（反向旋转视觉效果） */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 6, 0, Math.PI / 3]}>
        <torusGeometry args={[7, 0.35, 16, 48]} />
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
