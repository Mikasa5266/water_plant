import React from 'react';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface PumpModuleProps {
  agentId?: AgentId;
}

/**
 * 泵组模块：泵底座 + 3个圆柱泵体 + 连接管路
 * 位于水厂右下方
 */
export const PumpModule: React.FC<PumpModuleProps> = () => {
  const anchor = AGENT_3D_ANCHORS.pump;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  // 3个泵沿 X 轴排列
  const pumps = [-6, 0, 6];

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 总底座 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 1.2, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {pumps.map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          {/* 单个泵基座 */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[5, 2.4, 5]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
          </mesh>

          {/* 泵体主干圆柱 */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <cylinderGeometry args={[2, 2.2, 4.5, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* 泵顶盖 */}
          <mesh position={[0, 6.8, 0]}>
            <cylinderGeometry args={[2.2, 2.2, 0.5, 16]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* 电机模块 */}
          <mesh position={[1.8, 4.5, 0]}>
            <boxGeometry args={[2.5, 2.2, 2.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
          </mesh>

          {/* 电机散热片 */}
          {[-0.8, 0, 0.8].map((fz, fi) => (
            <mesh key={`fin-${fi}`} position={[3.2, 4.5, fz]}>
              <boxGeometry args={[0.2, 1.6, 0.4]} />
              <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
            </mesh>
          ))}

          {/* 状态指示灯 */}
          <mesh position={[0, 7.5, 1.5]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* 水平连接管（连接3个泵的出口） */}
      <mesh position={[0, 7.5, -3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 13, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 出口主管（向前） */}
      <mesh position={[0, 7.5, -5.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 4.5, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 出口法兰 */}
      <mesh position={[0, 7.5, -8]}>
        <torusGeometry args={[1.0, 0.3, 8, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};
