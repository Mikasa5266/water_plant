import React from 'react';

interface GroundProps {
  /** 地面半径，默认 500 */
  radius?: number;
  /** 网格分段数，默认 50 */
  divisions?: number;
}

/**
 * 地面：半透明平面 + 参考网格
 * 网格中心位于世界原点，充当水厂场景的地面参照
 */
export const Ground: React.FC<GroundProps> = ({ radius = 800, divisions = 60 }) => {
  return (
    <group>
      {/* 半透明基底面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.6} />
      </mesh>

      {/* 网格线 */}
      <gridHelper
        args={[radius, divisions, '#1e293b', '#0f172a']}
      />
    </group>
  );
};
