import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { DEVICE_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * 泵组转速提升动画
 * 在 EXECUTING / DEVICE_OPERATING 阶段：
 * - 3个泵叶轮快速旋转
 * - 状态灯闪烁（绿→红交替）
 */
export const PumpAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const isActive = targetAgentId === 'pump' && (phase === 'executing' || phase === 'operating');
  if (!isActive) return null;

  return <PumpAnimator />;
};

const PumpAnimator: React.FC = () => {
  const anchor = DEVICE_ANCHORS.pump;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const basePos = [pos[0], 0, pos[2]] as [number, number, number];

  const pumps = [-6, 0, 6];
  const impellerRefs = useRef<(THREE.Group | null)[]>([]);
  const indicatorRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 3个泵叶轮高速旋转
    impellerRefs.current.forEach((ref) => {
      if (ref) {
        ref.rotation.y += 0.12;
      }
    });

    // 状态灯闪烁
    if (indicatorRef.current && indicatorRef.current.material instanceof THREE.MeshStandardMaterial) {
      const flash = Math.sin(t * 4) > 0;
      indicatorRef.current.material.color.set(flash ? '#10b981' : '#ef4444');
      indicatorRef.current.material.emissive.set(flash ? '#10b981' : '#ef4444');
      indicatorRef.current.material.emissiveIntensity = flash ? 1.2 : 0.6;
    }
  });

  return (
    <group position={basePos}>
      {/* 3个泵组 */}
      {pumps.map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          {/* 泵体主干圆柱 */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <cylinderGeometry args={[2, 2.2, 4.5, 16]} />
            <meshStandardMaterial
              color="#475569"
              emissive="#475569"
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>

          {/* 泵顶盖 */}
          <mesh position={[0, 6.8, 0]}>
            <cylinderGeometry args={[2.2, 2.2, 0.5, 16]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* 叶轮旋转组 */}
          <group ref={(el) => { impellerRefs.current[i] = el; }} position={[0, 4.5, 0]}>
            <mesh>
              <torusGeometry args={[1.8, 0.3, 6, 24]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={0.6}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>
            {[0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3].map(
              (angle, fi) => (
                <mesh
                  key={fi}
                  position={[
                    Math.cos(angle) * 0.9,
                    0,
                    Math.sin(angle) * 0.9,
                  ]}
                  rotation={[0, 0, angle]}
                >
                  <boxGeometry args={[1.8, 0.2, 0.2]} />
                  <meshStandardMaterial
                    color="#94a3b8"
                    roughness={0.3}
                    metalness={0.7}
                  />
                </mesh>
              ),
            )}
          </group>

          {/* 电机模块 */}
          <mesh position={[1.8, 4.5, 0]}>
            <boxGeometry args={[2.5, 2.2, 2.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
          </mesh>

          {/* 状态指示灯（仅第一个泵闪烁） */}
          {i === 0 && (
            <mesh ref={indicatorRef} position={[0, 7.5, 1.5]}>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#10b981"
                emissiveIntensity={0.8}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};
