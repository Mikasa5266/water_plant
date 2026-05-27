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
  const columns = [-18, 0, 18];

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 基座平板 */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[50, 1.4, 25]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {columns.map((cx, i) => (
        <group key={i} position={[cx, 0, 0]}>
          {/* 超滤柱主体 */}
          <mesh position={[0, 15.3, 0]} castShadow>
            <cylinderGeometry args={[3.6, 4, 27, 20]} />
            <meshStandardMaterial
              color="#065f46"
              roughness={0.35}
              metalness={0.3}
            />
          </mesh>

          {/* 柱顶法兰 */}
          <mesh position={[0, 28.8, 0]}>
            <cylinderGeometry args={[4.1, 4.1, 0.9, 20]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
          </mesh>

          {/* 柱底法兰 */}
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[4.1, 4.1, 0.9, 20]} />
            <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
          </mesh>

          {/* 压力表小圆柱 */}
          <mesh position={[2.9, 15.3, 2.2]} castShadow>
            <cylinderGeometry args={[0.54, 0.63, 3.6, 8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 阀组模块（平板前方） */}
      <group position={[0, 3.6, -13.5]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[40, 6.3, 8.1]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* 阀门手轮 ×3 */}
        {[-11.7, 0, 11.7].map((vx, i) => (
          <group key={i} position={[vx, 3.6, 4.5]}>
            <mesh>
              <cylinderGeometry args={[1.4, 1.4, 2.2, 16]} />
              <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.7} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 3]}>
              <torusGeometry args={[1.8, 0.32, 8, 16]} />
              <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 连接管路（顶部） */}
      <mesh position={[0, 29.7, -2.7]} castShadow>
        <boxGeometry args={[45, 0.9, 0.9]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
};
