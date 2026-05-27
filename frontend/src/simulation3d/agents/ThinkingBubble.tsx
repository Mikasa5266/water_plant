import React, { useState, useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { SCENE_SCALE } from '../config';
import type { AgentId, ThinkingContent } from '../../types';
import { toThreePos } from '../utils/coordinates';

/**
 * 3D 思考气泡（HTML overlay）
 * 出现在 Agent 上方，打字机效果逐条显示 AI 推理要点
 * 位置跟随 thinkingAgentId 对应的 3D 锚点
 */
export const ThinkingBubble: React.FC = () => {
  const thinking = useScenarioStore((s) => s.thinking);
  const thinkingAgentId = useScenarioStore((s) => s.thinkingAgentId);

  if (!thinking || !thinkingAgentId) return null;

  return (
    <ThinkingBubbleContent
      thinking={thinking}
      agentId={thinkingAgentId}
    />
  );
};

/** 气泡内容子组件：负责位置计算 + 打字机效果 */
const ThinkingBubbleContent: React.FC<{
  thinking: ThinkingContent;
  agentId: AgentId;
}> = ({ thinking, agentId }) => {
  const anchor = AGENT_3D_ANCHORS[agentId];
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);

  // 气泡悬浮在 agent 上方 5 单位
  const bubblePos: [number, number, number] = [pos[0], pos[1] + 8, pos[2]];

  // 打字机效果
  const [displayedPoints, setDisplayedPoints] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    setDisplayedPoints([]);
    setCurrentIndex(0);
    setCurrentChar(0);
  }, [thinking]);

  useEffect(() => {
    if (currentIndex >= thinking.points.length) return;

    const point = thinking.points[currentIndex];
    if (currentChar >= point.length) {
      // 当前条目完成，延迟后进入下一条
      const timer = setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setCurrentChar(0);
      }, 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentChar((c) => c + 1);
      setDisplayedPoints((prev) => {
        const next = [...prev];
        next[currentIndex] = point.slice(0, currentChar + 1);
        return next;
      });
    }, 25);
    return () => clearTimeout(timer);
  }, [currentIndex, currentChar, thinking.points]);

  return (
    <Html
      position={bubblePos}
      center
      distanceFactor={15 * SCENE_SCALE}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 200,
          maxWidth: 280,
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.5,
          pointerEvents: 'auto',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
          position: 'relative',
        }}
        title="点击查看详情"
        onClick={() => {
          // 点击气泡可关闭（未来可扩展为打开详情窗口）
          useScenarioStore.getState().clearThinking();
        }}
      >
        {/* ▼ 三角尾巴 */}
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(15, 23, 42, 0.95)',
        }} />
        {/* 标题 */}
        <div style={{
          color: '#38bdf8',
          fontWeight: 'bold',
          marginBottom: 6,
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          paddingBottom: 4,
        }}>
          {thinking.title}
        </div>

        {/* 摘要 */}
        <div style={{ color: '#94a3b8', marginBottom: 6 }}>
          {thinking.summary}
        </div>

        {/* 推理要点（打字机效果） */}
        {thinking.points.slice(0, currentIndex + 1).map((_, i) => (
          <div
            key={i}
            style={{
              color: i === currentIndex ? '#f1f5f9' : '#94a3b8',
              paddingLeft: 8,
              borderLeft: '2px solid rgba(56, 189, 248, 0.3)',
              marginBottom: 3,
            }}
          >
            {displayedPoints[i] ?? ''}
            {i === currentIndex && currentChar < thinking.points[currentIndex].length && (
              <span style={{ animation: 'blink 0.7s infinite' }}>|</span>
            )}
          </div>
        ))}
      </div>
    </Html>
  );
};
