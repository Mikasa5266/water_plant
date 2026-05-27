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
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[43, 2.2, 29]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 膜池围栏（4面） */}
      {[
        { px: 0, pz: -13.5, w: 43, d: 0.9 },
        { px: 0, pz: 13.5, w: 43, d: 0.9 },
        { px: -21.2, pz: 0, w: 0.9, d: 27 },
        { px: 21.2, pz: 0, w: 0.9, d: 27 },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={[wall.px, 8.1, wall.pz]} castShadow>
          <boxGeometry args={[wall.w, 12.6, wall.d]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* 膜片组 ×3 (沿 X 排列，均匀分布) */}
      {[-12.6, 0, 12.6].map((mx, i) => (
        <group key={`membrane-${i}`} position={[mx, 6.8, 0]}>
          <mesh>
            <boxGeometry args={[0.36, 12.6, 23.4]} />
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
      <mesh position={[0, 3.6, 0]}>
        <boxGeometry args={[40, 4.5, 24.3]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          roughness={0.1}
        />
      </mesh>

      {/* 循环泵组（右侧） */}
      <group position={[27, 0, 0]}>
        {/* 泵底座 */}
        <mesh position={[0, 2.7, 0]} castShadow>
          <boxGeometry args={[11.7, 5.4, 11.7]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* 泵体大圆柱 */}
        <mesh position={[0, 8.1, 0]} castShadow>
          <cylinderGeometry args={[4.7, 5, 7.2, 20]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* 泵电机 */}
        <mesh position={[3.6, 8.1, 0]}>
          <boxGeometry args={[5.8, 4.1, 4.7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* 进出管 */}
        <mesh position={[0, 4.5, -6.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 3.6, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 11.7, -6.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 3.6, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
