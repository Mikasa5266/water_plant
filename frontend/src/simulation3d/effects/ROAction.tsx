import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { DEVICE_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * RO 冲洗流线动画
 * 在 EXECUTING / DEVICE_OPERATING 阶段：
 * - 透明半环流动（模拟水流冲刷路线）
 * - 膜片 emissive 波浪呼吸
 */
export const ROAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const isActive = targetAgentId === 'ro' && (phase === 'executing' || phase === 'operating');
  if (!isActive) return null;

  return <ROAnimator />;
};

const ROAnimator: React.FC = () => {
  const anchor = DEVICE_ANCHORS.ro;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const basePos = [pos[0], 0, pos[2]] as [number, number, number];

  const flowRingRef = useRef<THREE.Mesh>(null);
  const membraneRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 冲洗环旋转（模拟水流）
    if (flowRingRef.current) {
      flowRingRef.current.rotation.y += 0.02;
    }

    // 膜片 emissive 波浪呼吸
    if (membraneRef.current && membraneRef.current.material instanceof THREE.MeshStandardMaterial) {
      const pulse = 0.3 + Math.sin(t * 2.5) * 0.3;
      membraneRef.current.material.emissiveIntensity = pulse;
      membraneRef.current.material.opacity = 0.5 + Math.sin(t * 2) * 0.2;
    }
  });

  return (
    <group position={basePos}>
      {/* 冲洗流线环（绕膜池旋转） */}
      <mesh ref={flowRingRef} position={[0, 6, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[13, 0.3, 8, 48]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.6}
          transparent
          opacity={0.5}
          roughness={0.1}
        />
      </mesh>

      {/* 第二层反方向环 */}
      <mesh position={[0, 4, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[10, 0.25, 8, 48]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.4}
          transparent
          opacity={0.35}
          roughness={0.1}
        />
      </mesh>

      {/* 内侧膜片发光组 */}
      {[-7, 0, 7].map((mx, i) => (
        <mesh
          key={i}
          ref={i === 0 ? membraneRef : undefined}
          position={[mx, 3.8, 0]}
        >
          <boxGeometry args={[0.2, 7, 13]} />
          <meshStandardMaterial
            color="#d85a30"
            emissive="#f97316"
            emissiveIntensity={0.4}
            transparent
            opacity={0.6}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};
