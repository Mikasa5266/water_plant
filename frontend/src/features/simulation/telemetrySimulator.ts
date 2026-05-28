import type { TelemetryState } from '../../types';

// ─── 缓动函数 ───

export type EasingFn = (t: number) => number;

export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  easeOut: (t: number) => 1 - (1 - t) ** 3,
  easeIn: (t: number) => t * t * t,
} satisfies Record<string, EasingFn>;

// ─── 单值动画描述 ───

interface ValueAnimation {
  key: keyof TelemetryState;
  from: number;
  to: number;
  startTime: number;
  duration: number;
  easing: EasingFn;
}

// ─── 模拟器类 ───

export class TelemetrySimulator {
  private animations: ValueAnimation[] = [];
  private rafId: number | null = null;
  private running = false;
  private onUpdate: (patch: Partial<TelemetryState>) => void;
  private getState: () => TelemetryState;
  private fluctuationEnabled = true;
  private lastFluctuationTime = 0;
  private fluctuationInterval = 500;

  constructor(opts: {
    onUpdate: (patch: Partial<TelemetryState>) => void;
    getState: () => TelemetryState;
  }) {
    this.onUpdate = opts.onUpdate;
    this.getState = opts.getState;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFluctuationTime = performance.now();
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.animations = [];
  }

  /**
   * 渐变动画：将指定参数从 from 平滑过渡到 to
   * @param key TelemetryState 中的数值字段
   * @param from 起始值（传 null 则取当前 store 值）
   * @param to 目标值
   * @param duration 持续时间（ms），默认 3000
   * @param easing 缓动函数，默认 easeInOut
   */
  animateValue(
    key: keyof TelemetryState,
    from: number | null,
    to: number,
    duration = 3000,
    easing: EasingFn = easings.easeInOut,
  ) {
    const actualFrom = from ?? (this.getState()[key] as number);
    this.animations = this.animations.filter(a => a.key !== key);
    this.animations.push({
      key,
      from: actualFrom,
      to,
      startTime: performance.now(),
      duration,
      easing,
    });
  }

  /**
   * 批量渐变：多个参数同时开始动画
   */
  animateBatch(
    targets: Array<{
      key: keyof TelemetryState;
      from?: number;
      to: number;
      duration?: number;
      easing?: EasingFn;
    }>,
  ) {
    for (const t of targets) {
      this.animateValue(t.key, t.from ?? null, t.to, t.duration, t.easing);
    }
  }

  /**
   * 异常触发：参数用 3s 渐变到越限值
   */
  triggerAnomaly(targets: Array<{ key: keyof TelemetryState; to: number }>) {
    this.animateBatch(targets.map(t => ({ ...t, duration: 3000, easing: easings.easeIn })));
  }

  /**
   * 恢复阶段：参数用 5s 渐变回正常值
   */
  triggerRecovery(targets: Array<{ key: keyof TelemetryState; to: number }>) {
    this.animateBatch(targets.map(t => ({ ...t, duration: 5000, easing: easings.easeOut })));
  }

  setFluctuation(enabled: boolean) {
    this.fluctuationEnabled = enabled;
  }

  isAnimating(): boolean {
    return this.animations.length > 0;
  }

  private tick() {
    if (!this.running) return;
    const now = performance.now();
    const patch: Partial<TelemetryState> = {};
    let hasUpdate = false;

    // 处理进行中的动画
    const remaining: ValueAnimation[] = [];
    for (const anim of this.animations) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = anim.easing(progress);
      const value = anim.from + (anim.to - anim.from) * easedProgress;
      (patch as Record<string, number>)[anim.key] = round(value, 2);
      hasUpdate = true;
      if (progress < 1) remaining.push(anim);
    }
    this.animations = remaining;

    // 正常态微小随机波动（±0.5%）
    if (this.fluctuationEnabled && now - this.lastFluctuationTime > this.fluctuationInterval) {
      this.lastFluctuationTime = now;
      const state = this.getState();
      const fluctuationKeys: Array<keyof TelemetryState> = [
        'inletFlow', 'outletFlow', 'inletTurbidity', 'outletTurbidity',
        'dosingRate', 'ufPressure', 'pumpCurrent', 'pumpTemperature',
        'energyConsumption',
      ];
      for (const key of fluctuationKeys) {
        if (this.animations.some(a => a.key === key)) continue;
        const base = state[key] as number;
        if (typeof base !== 'number' || base === 0) continue;
        const jitter = base * (Math.random() - 0.5) * 0.01;
        (patch as Record<string, number>)[key] = round(base + jitter, 2);
      }
      hasUpdate = true;
    }

    if (hasUpdate) {
      this.onUpdate(patch);
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
