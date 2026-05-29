import React from 'react';
import type { AgentId } from '../../types';
import { DEVICE_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

interface ROModuleProps {
  agentId?: AgentId;
}

/**
 * 反渗透模块：膜池 + 4组膜片 + 循环泵
 * 位于水厂右前方（终端高精过滤）
 */
export const ROModule: React.FC<ROModuleProps> = () => {
  const anchor = DEVICE_ANCHORS.ro;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* 膜池底座 */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, 1.2, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* 膜池围栏（4面） */}
      {[
        { px: 0, pz: -7.5, w: 24, d: 0.5 },
        { px: 0, pz: 7.5, w: 24, d: 0.5 },
        { px: -11.8, pz: 0, w: 0.5, d: 15 },
        { px: 11.8, pz: 0, w: 0.5, d: 15 },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={[wall.px, 4.5, wall.pz]} castShadow>
          <boxGeometry args={[wall.w, 7, wall.d]} />
          <meshStandardMaterial
            color="#334155"
            emissive="#334155"
            emissiveIntensity={0.1}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* 膜片组 ×3 (沿 X 排列，均匀分布) */}
      {[-7, 0, 7].map((mx, i) => (
        <group key={`membrane-${i}`} position={[mx, 3.8, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 7, 13]} />
            <meshStandardMaterial
              color="#d85a30"
              emissive="#d85a30"
              emissiveIntensity={0.4}
              transparent
              opacity={0.7}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* 池内液体（半透明） */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[22, 2.5, 13.5]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          roughness={0.1}
        />
      </mesh>

      {/* 循环泵组（右侧） */}
      <group position={[15, 0, 0]}>
        {/* 泵底座 */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[6.5, 3, 6.5]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* 泵体大圆柱 */}
        <mesh position={[0, 4.5, 0]} castShadow>
          <cylinderGeometry args={[2.6, 2.8, 4, 20]} />
          <meshStandardMaterial
            color="#475569"
            emissive="#475569"
            emissiveIntensity={0.15}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>

        {/* 泵电机 */}
        <mesh position={[2, 4.5, 0]}>
          <boxGeometry args={[3.2, 2.3, 2.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* 进出管 */}
        <mesh position={[0, 2.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 2, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 6.5, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 2, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
