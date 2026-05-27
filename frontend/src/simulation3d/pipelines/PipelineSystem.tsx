import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { PIPE_PATHS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * 管道系统：静态管道连接监管中枢与各设备模块
 * 遍历 PIPE_PATHS 全局常量，用 drei/Line 渲染
 */
export const PipelineSystem: React.FC = () => {
  // 预计算所有管道路径，避免每帧重建
  const pipeLines = useMemo(() => {
    return Object.entries(PIPE_PATHS).map(([key, points]) => {
      const threePoints = points.map((p) =>
        new THREE.Vector3(...toThreePos(p.x, p.y, p.z)),
      );
      return { key, points: threePoints };
    });
  }, []);

  return (
    <group>
      {pipeLines.map(({ key, points }) => (
        <Line
          key={key}
          points={points}
          color="#475569"
          lineWidth={4}
          transparent
          opacity={0.7}
        />
      ))}

      {/* 管道连接点球体 */}
      {pipeLines.flatMap(({ key, points }) =>
        points.map((pt, i) => (
          <mesh key={`${key}-joint-${i}`} position={pt}>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.3}
              metalness={0.7}
              transparent
              opacity={0.8}
            />
          </mesh>
        )),
      )}
    </group>
  );
};
