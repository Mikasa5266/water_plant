import React from 'react';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { DosingAction } from './DosingAction';
import { UFAction } from './UFAction';
import { ROAction } from './ROAction';
import { PumpAction } from './PumpAction';

/**
 * 设备操作动画委派层
 * 根据 targetAgentId 渲染对应的差异化操作动画：
 * - dosing → DosingAction（加药脉冲：液位波动 + 柱塞泵往复）
 * - uf → UFAction（压力清洗：滤柱震动 + 压力表脉冲）
 * - ro → ROAction（冲洗流线：流动环 + 膜片呼吸）
 * - pump → PumpAction（转速提升：叶轮旋转 + 状态灯闪烁）
 */
export const DeviceAction: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const targetAgentId = useScenarioStore((s) => s.targetAgentId);

  if (!targetAgentId) return null;
  const isActive = phase === 'executing' || phase === 'operating';
  if (!isActive) return null;

  switch (targetAgentId) {
    case 'dosing':
      return <DosingAction />;
    case 'uf':
      return <UFAction />;
    case 'ro':
      return <ROAction />;
    case 'pump':
      return <PumpAction />;
    default:
      return null;
  }
};
