import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { DEVICE_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * 超滤压力清洗动画
 * 在 EXECUTING / DEVICE_OPERATING 阶段：
 * - 3根滤柱轻微上下震动（模拟压力反洗）
 * - 压力表脉冲发光（蓝白快速闪烁）
 */
export const UFAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const isActive = targetAgentId === 'uf' && (phase === 'executing' || phase === 'operating');
  if (!isActive) return null;

  return <UFAnimator />;
};

const UFAnimator: React.FC = () => {
  const anchor = DEVICE_ANCHORS.uf;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const basePos = [pos[0], 0, pos[2]] as [number, number, number];

  const columns = [-10, 0, 10];
  const columnRefs = useRef<THREE.Group[]>([]);
  const gaugeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 3根滤柱各自轻微震动（不同相位）
    columnRefs.current.forEach((ref, i) => {
      if (ref) {
        const phase = i * Math.PI * 0.66;
        ref.position.y = Math.sin(t * 6 + phase) * 0.3;
      }
    });

    // 压力表脉冲发光
    if (gaugeRef.current && gaugeRef.current.material instanceof THREE.MeshStandardMaterial) {
      const pulse = 0.5 + Math.abs(Math.sin(t * 5)) * 1.0;
      gaugeRef.current.material.emissiveIntensity = pulse;
    }
  });

  return (
    <group position={basePos}>
      {/* 压力表（脉冲发光） */}
      <mesh ref={gaugeRef} position={[1.6, 8.5, -9.3]} castShadow>
        <cylinderGeometry args={[1.2, 1.3, 1.5, 12]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#60a5fa"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* 3根滤柱（震动组） */}
      {columns.map((cx, i) => (
        <group
          key={i}
          ref={(el) => { if (el) columnRefs.current[i] = el; }}
          position={[cx, 0, 0]}
        >
          <mesh position={[0, 8.5, 0]} castShadow>
            <cylinderGeometry args={[2.0, 2.2, 15, 20]} />
            <meshStandardMaterial
              color="#047857"
              emissive="#047857"
              emissiveIntensity={0.3}
              roughness={0.35}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0, 16, 0]}>
            <cylinderGeometry args={[2.3, 2.3, 0.5, 20]} />
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.4} roughness={0.2} metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
