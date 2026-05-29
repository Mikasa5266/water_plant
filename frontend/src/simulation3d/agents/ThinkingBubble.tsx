import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import type { AgentId, ThinkingContent } from '../../types';
import { toThreePos } from '../utils/coordinates';

/**
 * 3D 思考气泡（屏幕空间固定尺寸 HTML overlay）
 * 出现在 Agent 上方，打字机效果逐条显示 AI 推理要点
 * 位置跟随 thinkingAgentId 对应的 3D 锚点
 *
 * 尺寸策略：
 * - 不使用 distanceFactor，气泡保持固定屏幕像素大小
 * - 无论相机远近，字体始终清晰可读
 * - 内容采用短句格式（问题/分析/方案），信息密度高
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

  // 气泡悬浮在 agent 上方 8 单位（scale 内坐标）
  const bubblePos: [number, number, number] = [pos[0], pos[1] + 8, pos[2]];

  // 逐字符显示（仅在非流式场景使用本地动画，流式时直接显示 text）
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    setDisplayedLength(0);
  }, [thinking.title]);

  useEffect(() => {
    if (thinking.status === 'streaming' || thinking.status === 'done') {
      setDisplayedLength(thinking.text.length);
      return;
    }
    if (displayedLength >= thinking.text.length) return;

    const timer = setTimeout(() => {
      setDisplayedLength((n) => n + 1);
    }, 25);
    return () => clearTimeout(timer);
  }, [displayedLength, thinking.text, thinking.status]);

  const displayText = thinking.text.slice(0, displayedLength);
  const lines = displayText.split('\n').filter(Boolean);

  return (
    <Html
      position={bubblePos}
      center
      style={{ pointerEvents: 'auto' }}
    >
      <div
        style={{
          background: 'rgba(10, 18, 32, 0.92)',
          border: '1.5px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 10,
          padding: '12px 16px',
          minWidth: 240,
          maxWidth: 380,
          maxHeight: 260,
          overflowY: 'auto',
          color: '#e2e8f0',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
          fontSize: 14,
          lineHeight: 1.65,
          pointerEvents: 'auto',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.12)',
          position: 'relative',
          userSelect: 'none',
          wordBreak: 'break-word',
        }}
        title="点击关闭"
        onClick={() => {
          useScenarioStore.getState().clearThinking();
        }}
      >
        {/* ▼ 三角尾巴 */}
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(10, 18, 32, 0.92)',
          }}
        />
        {/* 标题 */}
        <div
          style={{
            color: '#38bdf8',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 6,
            paddingBottom: 5,
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            }}
        >
          {thinking.title}
        </div>

        {/* 推理内容 */}
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: i === lines.length - 1 ? '#f1f5f9' : '#94a3b8',
              paddingLeft: 8,
              borderLeft: '2px solid rgba(56, 189, 248, 0.35)',
              marginBottom: 3,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {line}
          </div>
        ))}
        {thinking.status === 'streaming' && (
          <span
            style={{
              display: 'inline-block',
              width: 1.5,
              height: 13,
              background: '#38bdf8',
              marginLeft: 1,
              verticalAlign: 'middle',
              animation: 'blink 0.7s infinite',
            }}
          />
        )}
      </div>
    </Html>
  );
};
