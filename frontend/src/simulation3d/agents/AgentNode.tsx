import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentId, AgentRunStatus } from '../../types';
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

/** 根据 Agent 运行状态 + 是否被闪烁设备 决定发光色 */
function getAgentEmissive(
  agentId: AgentId,
  runStatus: AgentRunStatus,
  isFlashing: boolean,
): string {
  if (isFlashing) return '#ef4444'; // 红闪
  if (runStatus === 'warning') return '#f59e0b'; // 橙告警
  if (runStatus === 'executing' || runStatus === 'processing') return '#10b981'; // 绿执行
  if (runStatus === 'thinking') return '#60a5fa'; // 蓝分析中
  return AGENT_COLORS[agentId]; // 正常色
}

/**
 * 专项 Agent 发光球体
 * 悬浮于各自设备模块上方，颜色按 agentRunStatuses[agentId] 独立变化
 */
export const AgentNode: React.FC<AgentNodeProps> = ({ agentId }) => {
  const anchor = AGENT_3D_ANCHORS[agentId];
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  // 按 agentId 独立读取运行状态（不再是全局 agentUIStatus）
  const runStatus = useScenarioStore((s) => s.agentRunStatuses[agentId]);
  const deviceFlashing = useScenarioStore((s) => s.deviceFlashing);
  const isFlashing = deviceFlashing === agentId;

  const emissiveColor = useMemo(
    () => getAgentEmissive(agentId, runStatus, isFlashing),
    [agentId, runStatus, isFlashing],
  );

  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // 呼吸动画 + 报警闪烁
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (outerRef.current) {
      if (isFlashing) {
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
      {/* 外层发光球 — 半径放大确保缩放后仍可见 */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={isFlashing ? 1.5 : 0.8}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 内层核心球 */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[4, 32, 32]} />
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
