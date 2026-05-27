import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import type { AgentId } from '../../types';
import { toThreePos } from '../utils/coordinates';

/**
 * 设备操作动画
 * 当 phase 为 EXECUTING 或 DEVICE_OPERATING 时：
 * - 阀门手轮旋转
 * - 泵叶轮转动
 * - 按 agentId 定位到真实设备坐标上方
 */
export const DeviceAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  const isActive = phase === 'executing' || phase === 'operating';
  if (!isActive || !targetAgentId) return null;

  return <DeviceAnimator agentId={targetAgentId} />;
};

const DeviceAnimator: React.FC<{ agentId: AgentId }> = ({ agentId }) => {
  const anchor = AGENT_3D_ANCHORS[agentId];
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  const valveRef = useRef<THREE.Mesh>(null);
  const pumpRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // 阀门手轮旋转（慢速）
    if (valveRef.current) {
      valveRef.current.rotation.y += delta * 1.5;
    }

    // 泵叶轮旋转（快速）
    if (pumpRef.current) {
      pumpRef.current.rotation.y += delta * 5;
    }
  });

  return (
    <group position={[pos[0], 1.5, pos[2]]}>
      {/* 阀门手轮 — ✅ 正确的 R3F 结构：mesh → geometry + material */}
      <mesh ref={valveRef} position={[4, 3, 3]}>
        <torusGeometry args={[2.0, 0.25, 8, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* 泵叶轮组 — ✅ group 包含多个 mesh（叶轮 + 辐条） */}
      <group ref={pumpRef} position={[0, 5, 0]}>
        {/* 叶轮主体 */}
        <mesh>
          <torusGeometry args={[1.8, 0.4, 6, 24]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>

        {/* 叶轮辐条 */}
        {[0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3].map(
          (angle, i) => (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.9,
                0,
                Math.sin(angle) * 0.9,
              ]}
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[1.8, 0.2, 0.2]} />
              <meshStandardMaterial
                color="#64748b"
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          ),
        )}
      </group>
    </group>
  );
};
