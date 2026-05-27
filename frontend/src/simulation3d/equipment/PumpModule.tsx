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
  const pumps = [-10.8, 0, 10.8];

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 总底座 */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[36, 2.2, 22]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {pumps.map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          {/* 单个泵基座 */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[9, 4.3, 9]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
          </mesh>

          {/* 泵体主干圆柱 */}
          <mesh position={[0, 8.1, 0]} castShadow>
            <cylinderGeometry args={[3.6, 4, 8.1, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* 泵顶盖 */}
          <mesh position={[0, 12.2, 0]}>
            <cylinderGeometry args={[4, 4, 0.9, 16]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* 电机模块 */}
          <mesh position={[3.2, 8.1, 0]}>
            <boxGeometry args={[4.5, 4, 4.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
          </mesh>

          {/* 电机散热片 */}
          {[-1.4, 0, 1.4].map((fz, fi) => (
            <mesh key={`fin-${fi}`} position={[5.8, 8.1, fz]}>
              <boxGeometry args={[0.36, 2.9, 0.7]} />
              <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
            </mesh>
          ))}

          {/* 状态指示灯 */}
          <mesh position={[0, 13.5, 2.7]}>
            <sphereGeometry args={[0.54, 8, 8]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* 水平连接管（连接3个泵的出口） */}
      <mesh position={[0, 13.5, -5.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.9, 0.9, 23.4, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 出口主管（向前） */}
      <mesh position={[0, 13.5, -9.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 8.1, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 出口法兰 */}
      <mesh position={[0, 13.5, -14.4]}>
        <torusGeometry args={[1.8, 0.54, 8, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};
