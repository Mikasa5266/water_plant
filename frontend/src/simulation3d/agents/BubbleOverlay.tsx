/**
 * BubbleOverlay — Canvas 外部 2D HUD 渲染器
 *
 * 两大差异：
 * 1. 在 R3F Canvas **外部**渲染 → HTML 标签（<svg>, <div>）不会被 R3F 拦截
 * 2. 位置数据从共享 ref（bubbleStateRef）读取，由 ThinkingBubble 每帧写入
 *
 * 内容数据（thinking text）直接从 Zustand store 低频率读取，无性能问题
 */

import React, { useRef, useEffect, useState } from 'react';
import { useScenarioStore } from '../../stores/useScenarioStore';
import type { AgentId, ThinkingContent } from '../../types';

// ─── 共享状态类型 ─────────────────────────────────────────────

export interface BubbleState {
  agentId: AgentId | null;
  visible: boolean;
  x: number;
  y: number;
  tail: 'left' | 'right' | 'top-left';
  anchorX: number;
  anchorY: number;
  lineFromX: number;
  lineFromY: number;
}

export const INITIAL_BUBBLE_STATE: BubbleState = {
  agentId: null,
  visible: false,
  x: 0,
  y: 0,
  tail: 'left',
  anchorX: 0,
  anchorY: 0,
  lineFromX: 0,
  lineFromY: 0,
};

// ─── 组件 ────────────────────────────────────────────────────

interface BubbleOverlayProps {
  bubbleStateRef: React.MutableRefObject<BubbleState>;
}

export const BubbleOverlay: React.FC<BubbleOverlayProps> = ({ bubbleStateRef }) => {
  // 卡片 + 连线 DOM refs
  const cardEl = useRef<HTMLDivElement>(null);
  const lineEl = useRef<SVGPathElement>(null);
  const tailEl = useRef<HTMLDivElement>(null);

  // Zustand 状态（低频率变化，不影响性能）
  const thinking = useScenarioStore((s) => s.thinking);
  const thinkingAgentId = useScenarioStore((s) => s.thinkingAgentId);

  // 打字机效果（React state，仅打字时重渲染）
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedPoints, setDisplayedPoints] = useState<string[]>([]);

  useEffect(() => {
    setDisplayedPoints([]);
    setCurrentIndex(0);
    setCurrentChar(0);
  }, [thinking]);

  useEffect(() => {
    if (!thinking || currentIndex >= thinking.points.length) return;
    const point = thinking.points[currentIndex];
    if (currentChar >= point.length) {
      const t = setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setCurrentChar(0);
      }, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCurrentChar((c) => c + 1);
      setDisplayedPoints((prev) => {
        const next = [...prev];
        next[currentIndex] = point.slice(0, currentChar + 1);
        return next;
      });
    }, 25);
    return () => clearTimeout(t);
  }, [currentIndex, currentChar, thinking]);

  // ── rAF 同步循环：每帧读 bubbleStateRef 并更新 DOM ──
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const s = bubbleStateRef.current;

      if (cardEl.current) {
        cardEl.current.style.left = `${s.x}px`;
        cardEl.current.style.top = `${s.y}px`;
        cardEl.current.style.opacity = s.visible && !!thinking ? '1' : '0';
      }

      if (tailEl.current) {
        tailEl.current.dataset.tail = s.tail;
      }

      if (lineEl.current) {
        lineEl.current.setAttribute(
          'd',
          `M ${s.lineFromX} ${s.lineFromY} L ${s.anchorX} ${s.anchorY}`,
        );
        lineEl.current.style.opacity = s.visible && !!thinking ? '1' : '0';
      }

      requestAnimationFrame(tick);
    };
    tick();
    return () => {
      running = false;
    };
  }, [thinking, bubbleStateRef]);

  if (!thinking || !thinkingAgentId) return null;

  return (
    <>
      <style>{`
        .tail-triangle {
          position: absolute;
          width: 0;
          height: 0;
        }
        [data-tail="left"] .tail-triangle {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-right: 8px solid rgba(10, 18, 32, 0.92);
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-left: none;
        }
        [data-tail="right"] .tail-triangle {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-left: 8px solid rgba(10, 18, 32, 0.92);
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
          border-right: none;
        }
        [data-tail="top-left"] .tail-triangle {
          left: 50%;
          bottom: 100%;
          transform: translateX(-50%);
          border-bottom: 8px solid rgba(10, 18, 32, 0.92);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: none;
        }
      `}</style>

      {/* SVG 连线 */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'visible',
        }}
      >
        <path
          ref={lineEl}
          fill="none"
          stroke="rgba(56, 189, 248, 0.2)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          style={{ transition: 'none' }}
        />
      </svg>

      {/* 气泡卡片 */}
      <div
        ref={cardEl}
        style={{
          position: 'absolute',
          pointerEvents: 'auto',
          opacity: 0,
          transition: 'opacity 0.35s ease-in-out',
          zIndex: 1,
        }}
      >
        <div
          ref={tailEl}
          data-tail={bubbleStateRef.current.tail}
          style={{
            background: 'rgba(10, 18, 32, 0.92)',
            border: '1.5px solid rgba(56, 189, 248, 0.5)',
            borderRadius: 10,
            padding: '12px 16px',
            width: 228,
            color: '#e2e8f0',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
            fontSize: 14,
            lineHeight: 1.65,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.12)',
            position: 'relative',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
          title="点击关闭"
          onClick={() => useScenarioStore.getState().clearThinking()}
        >
          {/* 三角尾巴 */}
          <div className="tail-triangle" />

          {/* 标题 */}
          <div
            style={{
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 6,
              paddingBottom: 5,
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {thinking.title}
          </div>

          {/* 推理要点（打字机效果） */}
          {thinking.points.slice(0, currentIndex + 1).map((_, i) => (
            <div
              key={i}
              style={{
                color: i === currentIndex ? '#f1f5f9' : '#94a3b8',
                paddingLeft: 8,
                borderLeft: '2px solid rgba(56, 189, 248, 0.35)',
                marginBottom: 3,
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'nowrap',
              }}
            >
              {displayedPoints[i] ?? ''}
              {i === currentIndex &&
                currentChar < (thinking?.points[currentIndex]?.length ?? 0) && (
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
          ))}
        </div>
      </div>
    </>
  );
};
