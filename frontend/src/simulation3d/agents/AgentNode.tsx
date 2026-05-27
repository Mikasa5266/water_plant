import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentId, AgentUIStatus } from '../../types';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { toThreePos } from '../utils/coordinates';

interface AgentNodeProps {
  agentId: AgentId;
}

/** Agent 颜色映射（来自设计文档 §7.1） */
const AGENT_COLORS: Record<AgentId, string> = {
  supervisor: '#378ADD',
  dosing: '#BA7517',
  uf: '#1D9E75',
  ro: '#D85A30',
  pump: '#534AB7',
};

/** 根据 UI 四态 + 闪烁设备决定当前发光色 */
function getAgentEmissive(
  agentId: AgentId,
  uiStatus: AgentUIStatus,
  deviceFlashing: AgentId | null,
): string {
  if (deviceFlashing === agentId) return '#ef4444'; // 红闪
  if (uiStatus === 'alarm') return '#f59e0b'; // 橙告警
  if (uiStatus === 'recovering') return '#10b981'; // 绿恢复
  return AGENT_COLORS[agentId]; // 正常色
}

/**
 * 专项 Agent 发光球体
 * 悬浮于各自设备模块上方，颜色随 store 状态动态变化
 */
export const AgentNode: React.FC<AgentNodeProps> = ({ agentId }) => {
  const anchor = AGENT_3D_ANCHORS[agentId];
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  const uiStatus = useScenarioStore((s) => s.agentUIStatus);
  const deviceFlashing = useScenarioStore((s) => s.deviceFlashing);

  const emissiveColor = useMemo(
    () => getAgentEmissive(agentId, uiStatus, deviceFlashing),
    [agentId, uiStatus, deviceFlashing],
  );

  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // 呼吸动画 + 报警闪烁
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (outerRef.current) {
      if (deviceFlashing === agentId) {
        // 快速脉冲闪烁
        const pulse = 0.7 + Math.abs(Math.sin(t * 8)) * 0.6;
        outerRef.current.scale.setScalar(pulse);
      } else {
        // 正常呼吸
        const breath = 1 + Math.sin(t * 1.8) * 0.08;
        outerRef.current.scale.setScalar(breath);
      }
    }

    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.05);
    }
  });

  return (
    <group position={pos}>
      {/* 外层发光球 */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={deviceFlashing === agentId ? 1.5 : 0.8}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 内层核心球 */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={emissiveColor}
          emissiveIntensity={0.8}
          roughness={0.05}
        />
      </mesh>
    </group>
  );
};
