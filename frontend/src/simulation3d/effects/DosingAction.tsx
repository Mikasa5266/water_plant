import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { DEVICE_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * 加药脉冲动画
 * 在 EXECUTING / DEVICE_OPERATING 阶段：
 * - 药箱液位上下波动（模拟药液脉冲注入）
 * - 加药泵体水平往复（模拟柱塞泵行程）
 */
export const DosingAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const isActive = targetAgentId === 'dosing' && (phase === 'executing' || phase === 'operating');
  if (!isActive) return null;

  return <DosingAnimator />;
};

const DosingAnimator: React.FC = () => {
  const anchor = DEVICE_ANCHORS.dosing;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const basePos = [pos[0], 0, pos[2]] as [number, number, number];

  const pumpGroupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 液位脉冲波动（scale 缩放模拟液面升降）
    if (liquidRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.08;
      liquidRef.current.scale.z = pulse;
    }

    // 泵体水平往复（模拟柱塞泵行程）
    if (pumpGroupRef.current) {
      pumpGroupRef.current.position.x = 8 + Math.sin(t * 4) * 0.6;
    }
  });

  return (
    <group position={basePos}>
      {/* 液位指示伸缩（模拟液面波动） */}
      <mesh ref={liquidRef} position={[0, 6.5, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 11, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
          roughness={0.3}
        />
      </mesh>

      {/* 加药泵组（带往复位移） */}
      <group ref={pumpGroupRef} position={[8, 0, 3]}>
        {/* 泵底座 */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 3, 5]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* 泵体圆柱 */}
        <mesh position={[0, 4.5, 0]} castShadow>
          <cylinderGeometry args={[2, 2, 4, 16]} />
          <meshStandardMaterial
            color="#475569"
            emissive="#f59e0b"
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
        {/* 泵电机 */}
        <mesh position={[1.6, 4.5, 0]}>
          <boxGeometry args={[2.8, 2, 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
};
