import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useScenarioStore } from '../stores/useScenarioStore';
import { SCENE_SCALE, CAMERA_DEFAULTS } from './config';

/**
 * 相机控制器（高亮→单段推近 + 动态时长）
 *
 * 聚焦流程：
 * ┌─ 空闲 ────────────────────────────────────────────────────┐
 * │  OrbitControls 开启，用户可自由旋转/缩放/平移              │
 * └───────────────────────────────────────────────────────────┘
 *        ↓ cameraFocus 变为非 null（EXECUTING 阶段触发）
 * ┌─ 延迟 400ms（锁 OrbitControls）───────────────────────────┐
 * │  让设备高亮/脉冲圈先出现，观众先感知"哪里出问题"             │
 * └───────────────────────────────────────────────────────────┘
 *        ↓ 400ms 到
 * ┌─ 单段推近（锁 OrbitControls）─────────────────────────────┐
 * │  从当前视角 → DEVICE_FOCUS_PRESETS 目标                    │
 * │  时长按距离动态计算（0.9s-2.0s），easeInOutCubic 缓动     │
 * │  放弃两段式/回拉，全程从当前视角平滑过渡                    │
 * └───────────────────────────────────────────────────────────┘
 *        ↓ 到位后解锁
 *
 * 恢复流程（保持不变）：
 * ┌─ 恢复（锁 OrbitControls）────────────────────────────────┐
 * │  cameraFocus → null 时，从当前视角 → CAMERA_DEFAULTS 1.5s│
 * │  到位后解锁                                               │
 * └───────────────────────────────────────────────────────────┘
 */

/** 聚焦延迟：让设备高亮等效果先出现（秒） */
const FOCUS_DELAY = 0.4;

/**
 * 动态聚焦时长
 * 按 camera 到目标的距离计算：
 * - 距离 < 108 → ~0.9s（轻推近）
 * - 距离 ≈ 180 → ~1.5s（平滑飞行）
 * - 距离 > 240 → ~2.0s（远距离）
 */
const calcDuration = (distance: number): number =>
  Math.max(0.9, Math.min(2.0, distance / 120));

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraFocus = useScenarioStore((s) => s.cameraFocus);
  const { camera } = useThree();

  // ── 聚焦目标（相机空间） ──
  const focusPosition = useRef(new THREE.Vector3());
  const focusLookAt = useRef(new THREE.Vector3());

  // ── 恢复终点（相机空间） ──
  const recoverPosition = useRef(
    new THREE.Vector3(...CAMERA_DEFAULTS.position)
  );
  const recoverLookAt = useRef(
    new THREE.Vector3(...CAMERA_DEFAULTS.target)
  );

  // ── 动画起点（每次动画开始时的当前相机状态） ──
  const startPosition = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());

  // ── 动画状态机 ──
  type AnimState = 'idle' | 'delaying' | 'focusing' | 'recovering';
  const animState = useRef<AnimState>('idle');
  const progress = useRef(0);
  const focusDuration = useRef(1.5);  // 动态计算的聚焦时长（秒）
  const recoverDuration = 1.5;        // 恢复时长（秒）
  const delayElapsed = useRef(0);     // 延迟已过时间（秒）

  /** 将 scale group 内坐标转换为相机空间坐标 */
  const toCameraSpace = (v: [number, number, number]): THREE.Vector3 =>
    new THREE.Vector3(v[0] * SCENE_SCALE, v[1] * SCENE_SCALE, v[2] * SCENE_SCALE);

  /** 锁住 OrbitControls */
  const lockControls = () => {
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  /** 解锁 OrbitControls */
  const unlockControls = () => {
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  // ── 触发聚焦 ──
  useEffect(() => {
    if (!cameraFocus) return;

    // 计算聚焦目标（scale 内坐标 → 相机空间）
    focusPosition.current.copy(toCameraSpace(cameraFocus.position));
    focusLookAt.current.copy(toCameraSpace(cameraFocus.lookAt));

    // 计算距离动态时长
    const distance = camera.position.distanceTo(focusPosition.current);
    focusDuration.current = calcDuration(distance);

    // 记录起点（当前相机位置，始终从当前视角开始飞行）
    startPosition.current.copy(camera.position);
    startLookAt.current.copy(
      controlsRef.current?.target ?? new THREE.Vector3()
    );

    // 进入延迟阶段：锁住相机，让设备高亮动画先出现
    progress.current = 0;
    delayElapsed.current = 0;
    animState.current = 'delaying';
    lockControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocus]);

  // ── 触发恢复 ──
  const prevFocus = useRef(cameraFocus);
  useEffect(() => {
    if (!cameraFocus && prevFocus.current) {
      // 从当前聚焦位置恢复到全景默认视角
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(
        controlsRef.current?.target ?? new THREE.Vector3()
      );
      progress.current = 0;
      animState.current = 'recovering';
      lockControls();
    }
    prevFocus.current = cameraFocus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocus]);

  // ── 每帧动画 ──
  useFrame((_, delta) => {
    const state = animState.current;
    if (state === 'idle') return;

    // ─── 延迟阶段：等 FOCUS_DELAY 秒后切入聚焦 ───
    if (state === 'delaying') {
      delayElapsed.current += delta;
      if (delayElapsed.current >= FOCUS_DELAY) {
        // 延迟结束，开始飞行
        // 重新记录起点（防止 delay 期间相机被意外移动）
        startPosition.current.copy(camera.position);
        startLookAt.current.copy(
          controlsRef.current?.target ?? new THREE.Vector3()
        );
        progress.current = 0;
        animState.current = 'focusing';
      }
      return;
    }

    // ─── 聚焦阶段：单段从起点飞向目标 ───
    if (state === 'focusing') {
      progress.current = Math.min(1, progress.current + delta / focusDuration.current);
      const t = easeInOutCubic(progress.current);
      camera.position.lerpVectors(startPosition.current, focusPosition.current, t);
      controlsRef.current?.target.lerpVectors(startLookAt.current, focusLookAt.current, t);

      if (progress.current >= 1) {
        animState.current = 'idle';
        unlockControls();
      }
      return;
    }

    // ─── 恢复阶段：从当前视角飞回全景 ───
    if (state === 'recovering') {
      progress.current = Math.min(1, progress.current + delta / recoverDuration);
      const t = easeInOutCubic(progress.current);
      camera.position.lerpVectors(startPosition.current, recoverPosition.current, t);
      controlsRef.current?.target.lerpVectors(startLookAt.current, recoverLookAt.current, t);

      if (progress.current >= 1) {
        animState.current = 'idle';
        unlockControls();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={CAMERA_DEFAULTS.minDistance}
      maxDistance={CAMERA_DEFAULTS.maxDistance}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
      target={CAMERA_DEFAULTS.target}
    />
  );
};

/** easeInOutCubic 缓入缓出 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
