import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import type { AgentId } from '../../types';
import { toThreePos } from '../utils/coordinates';

/**
 * 监管中枢 + 4 模块的新拓扑管道
 * 每个模块有多段管道连接到中枢
 */
const SPECIALISTS: AgentId[] = ['dosing', 'uf', 'ro', 'pump'];

/**
 * 为每个专项 Agent 生成连接中枢的管道路径
 * 路径：模块侧边 → 中枢底座
 */
function buildModulePipes(agentId: AgentId): THREE.Vector3[][] {
  const module = AGENT_3D_ANCHORS[agentId];
  const supervisor = AGENT_3D_ANCHORS.supervisor;

  const mBase = toThreePos(module.x, module.y, 15); // 模块地面高度
  const sBase = toThreePos(supervisor.x, supervisor.y, 20); // 中枢底座

  const midX = (mBase[0] + sBase[0]) / 2;
  const midZ = (mBase[2] + sBase[2]) / 2;

  // 三段式管道：模块 → 中间转折点 → 中枢
  return [
    [
      new THREE.Vector3(mBase[0], 3, mBase[2]),
      new THREE.Vector3(midX, 5, mBase[2]),
      new THREE.Vector3(midX, 5, midZ),
      new THREE.Vector3(sBase[0], 3, midZ),
      new THREE.Vector3(sBase[0], 3, sBase[2]),
    ],
  ];
}

/**
 * 管道系统：监管中枢 + 4 模块的新拓扑
 * 每个模块通过管道连接到中央监管中枢
 */
export const PipelineSystem: React.FC = () => {
  const pipeLines = useMemo(() => {
    return SPECIALISTS.flatMap((id) => {
      const paths = buildModulePipes(id);
      return paths.map((points, i) => ({ key: `${id}-pipe-${i}`, points }));
    });
  }, []);

  return (
    <group>
      {pipeLines.map(({ key, points }) => (
        <Line
          key={key}
          points={points}
          color="#475569"
          lineWidth={6}
          transparent
          opacity={0.7}
        />
      ))}

      {/* 管道连接点球体 */}
      {pipeLines.flatMap(({ key, points }) =>
        points.map((pt, i) => (
          <mesh key={`${key}-joint-${i}`} position={pt}>
            <sphereGeometry args={[1.5, 8, 8]} />
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
