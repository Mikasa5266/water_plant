import React from 'react';
import type { AgentId } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface ROModuleProps {
  agentId?: AgentId;
}

/**
 * 反渗透模块：膜池 + 4组膜片 + 循环泵
 * 位于水厂右前方（终端高精过滤）
 */
export const ROModule: React.FC<ROModuleProps> = () => {
  const anchor = AGENT_3D_ANCHORS.ro;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 膜池底座 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 1, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 膜池围栏（4面） */}
      {[
        { px: 0, pz: -5.5, w: 18, d: 0.4 },
        { px: 0, pz: 5.5, w: 18, d: 0.4 },
        { px: -8.8, pz: 0, w: 0.4, d: 11 },
        { px: 8.8, pz: 0, w: 0.4, d: 11 },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={[wall.px, 3.5, wall.pz]} castShadow>
          <boxGeometry args={[wall.w, 6, wall.d]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* 膜片组 ×4 (沿 X 排列，半透明) */}
      {[-6, -2, 2, 6].map((mx, i) => (
        <group key={`membrane-${i}`} position={[mx, 3, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 5.5, 10]} />
            <meshStandardMaterial
              color="#d85a30"
              emissive="#d85a30"
              emissiveIntensity={0.2}
              transparent
              opacity={0.7}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* 池内液体（半透明） */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[16.5, 2, 10]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          roughness={0.1}
        />
      </mesh>

      {/* 循环泵组（右侧） */}
      <group position={[11, 0, 0]}>
        {/* 泵底座 */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[5, 2.4, 5]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* 泵体大圆柱 */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <cylinderGeometry args={[2, 2.2, 3, 20]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* 泵电机 */}
        <mesh position={[1.5, 3.5, 0]}>
          <boxGeometry args={[2.5, 1.8, 2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* 进出管 */}
        <mesh position={[0, 2, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1.5, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 5, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1.5, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
