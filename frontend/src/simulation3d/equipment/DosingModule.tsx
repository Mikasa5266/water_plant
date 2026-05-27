import React from 'react';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface DosingModuleProps {
  agentId?: AgentId;
}

/**
 * 加药模块：药箱基座 + 圆柱储药罐 + 加药泵
 * 位于水厂左前方（前段处理）
 */
export const DosingModule: React.FC<DosingModuleProps> = () => {
  const anchor = AGENT_3D_ANCHORS.dosing;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 基座平台 */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 1.2, 22]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* 药箱主体（大圆柱） */}
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[5, 5, 16, 24]} />
        <meshStandardMaterial
          color="#78350f"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* 药箱环箍（上） */}
      <mesh position={[0, 16.5, 0]}>
        <torusGeometry args={[5.2, 0.35, 8, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 药箱环箍（下） */}
      <mesh position={[0, 2, 0]}>
        <torusGeometry args={[5.2, 0.35, 8, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 液位指示（内部圆柱，琥珀色半透明） */}
      <mesh position={[0, 6.5, 0]}>
        <cylinderGeometry args={[4.5, 4.5, 11, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* 药箱顶盖 */}
      <mesh position={[0, 17.5, 0]}>
        <cylinderGeometry args={[5.2, 5.2, 0.8, 24]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 加药泵组（右侧） */}
      <group position={[8, 0, 3]}>
        {/* 泵底座 */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 3, 5]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* 泵体圆柱 */}
        <mesh position={[0, 4.5, 0]} castShadow>
          <cylinderGeometry args={[2, 2, 4, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* 泵电机 */}
        <mesh position={[1.6, 4.5, 0]}>
          <boxGeometry args={[2.8, 2, 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* 阀门组（底部前方） */}
      <group position={[0, 0.5, -10]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.4, 1.4, 3, 16]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* 阀门手轮 */}
        <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[1.7, 0.2, 8, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
};
