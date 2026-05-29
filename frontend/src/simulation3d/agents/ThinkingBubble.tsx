/**
 * ThinkingBubble — Canvas 内部计算引擎（不渲染 HTML）
 *
 * 职责：每帧用 useFrame 将 Agent 3D 坐标 → 屏幕投影 → 象限偏移
 *       结果存入共享 bubbleStateRef，供 Canvas 外部的 BubbleOverlay 读取
 *
 * 不产生任何 DOM / JSX 输出（return null），避免 R3F 渲染 HTML 元素
 */

import { useRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { SCENE_SCALE } from '../config';
import type { AgentId } from '../../types';
import type { BubbleState } from './BubbleOverlay';

// ─── 常量 ────────────────────────────────────────────────────

const BW = 260;
const BH = 130;
const PADDING = 20;
const GAP = 16;
const SMOOTH_RATE = 0.08;

type TailDir = BubbleState['tail'];

/** 根据 Agent 屏幕像素坐标计算偏移方向 + 位置 */
function calcOffset(ax: number, ay: number, vw: number, vh: number) {
  const midX = vw / 2;
  const thr = vw * 0.15;
  let ox: number, oy: number, tail: TailDir;

  if (ax < midX - thr) {
    ox = ax + GAP;
    oy = ay - BH / 2;
    tail = 'left';
  } else if (ax > midX + thr) {
    ox = ax - BW - GAP;
    oy = ay - BH / 2;
    tail = 'right';
  } else {
    ox = ax + GAP;
    oy = ay - BH - GAP;
    tail = 'top-left';
  }

  ox = Math.max(PADDING, Math.min(vw - BW - PADDING, ox));
  oy = Math.max(PADDING, Math.min(vh - BH - PADDING, oy));
  return { ox, oy, tail };
}

// ─── 组件 ────────────────────────────────────────────────────

interface ThinkingBubbleProps {
  bubbleStateRef: React.MutableRefObject<BubbleState>;
}

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ bubbleStateRef }) => {
  const { camera, size } = useThree();
  const agentId = bubbleStateRef.current.agentId;
  const anchor = agentId ? AGENT_3D_ANCHORS[agentId] : null;

  const worldVec = useMemo(() => {
    if (!anchor) return new THREE.Vector3();
    return new THREE.Vector3(
      anchor.x * SCENE_SCALE,
      anchor.z * SCENE_SCALE,
      anchor.y * SCENE_SCALE,
    );
  }, [agentId]);

  const smooth = useRef({ x: -999, y: -999 });

  useFrame(() => {
    if (!anchor) return;

    const ndc = worldVec.clone().project(camera);
    const onScreen = ndc.z > 0 && ndc.z < 1;

    const rawX = (ndc.x * 0.5 + 0.5) * size.width;
    const rawY = (-ndc.y * 0.5 + 0.5) * size.height;

    if (smooth.current.x === -999) {
      smooth.current.x = rawX;
      smooth.current.y = rawY;
    } else {
      smooth.current.x += (rawX - smooth.current.x) * SMOOTH_RATE;
      smooth.current.y += (rawY - smooth.current.y) * SMOOTH_RATE;
    }

    if (!onScreen) {
      bubbleStateRef.current.visible = false;
      return;
    }

    const { ox, oy, tail } = calcOffset(
      smooth.current.x,
      smooth.current.y,
      size.width,
      size.height,
    );

    const ex = tail === 'left' ? ox : tail === 'right' ? ox + BW : ox;
    const ey =
      tail === 'left' ? oy + BH / 2 : tail === 'right' ? oy + BH / 2 : oy + BH;

    bubbleStateRef.current = {
      ...bubbleStateRef.current,
      visible: true,
      x: ox,
      y: oy,
      tail,
      lineFromX: ex,
      lineFromY: ey,
    };
  });

  return null; // 不渲染任何 HTML / R3F 元素
};
