import React from 'react';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface UFModuleProps {
  agentId?: AgentId;
}

/**
 * 超滤模块：基座平板 + 3根超滤柱 + 阀组
 * 位于水厂左后方（中段处理）
 */
export const UFModule: React.FC<UFModuleProps> = () => {
  const anchor = AGENT_3D_ANCHORS.uf;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  // 三根超滤柱沿 X 轴等距分布
  const columns = [-7, 0, 7];

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 基座平板 */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 0.6, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {columns.map((cx, i) => (
        <group key={i} position={[cx, 0, 0]}>
          {/* 超滤柱主体 */}
          <mesh position={[0, 6, 0]} castShadow>
            <cylinderGeometry args={[1.4, 1.5, 10, 20]} />
            <meshStandardMaterial
              color="#065f46"
              roughness={0.35}
              metalness={0.3}
            />
          </mesh>

          {/* 柱顶法兰 */}
          <mesh position={[0, 11.2, 0]}>
            <cylinderGeometry args={[1.6, 1.6, 0.4, 20]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
          </mesh>

          {/* 柱底法兰 */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[1.6, 1.6, 0.4, 20]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
          </mesh>

          {/* 压力表小圆柱 */}
          <mesh position={[1.2, 6, 0.8]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 1.5, 8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 阀组模块（平板前方） */}
      <group position={[0, 1.5, -5.5]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[16, 2.5, 3]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* 阀门手轮 ×3 */}
        {[-4.5, 0, 4.5].map((vx, i) => (
          <group key={i} position={[vx, 1.5, 1.8]}>
            <mesh>
              <cylinderGeometry args={[0.6, 0.6, 0.8, 16]} />
              <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 3]}>
              <torusGeometry args={[0.7, 0.12, 8, 16]} />
              <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 连接管路（顶部） */}
      <mesh position={[0, 11.8, -1]} castShadow>
        <boxGeometry args={[18, 0.4, 0.4]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
};
