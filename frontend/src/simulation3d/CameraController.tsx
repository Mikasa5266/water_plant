import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useScenarioStore } from '../stores/useScenarioStore';
import { SCENE_SCALE, CAMERA_DEFAULTS, DEMO_ORBIT_START } from './config';

/**
 * 相机控制器（两段式聚焦 + 聚焦全程锁控）
 *
 * 工作模式：
 * ┌─ 空闲 ─────────────────────────────────────────────────────┐
 * │  OrbitControls 开启，用户可自由旋转/缩放/平移               │
 * └────────────────────────────────────────────────────────────┘
 *        ↓ cameraFocus 变为非 null（EXECUTING 阶段触发）
 * ┌─ 聚焦动画（全程锁住 OrbitControls）────────────────────────┐
 * │  段1（GATHER_RATIO × duration）：                           │
 * │    从 用户当前位置 → DEMO_ORBIT_START（演示基础视角）        │
 * │    目的：消除用户任意拖拽后的"脏"起点                       │
 * │  段2（剩余 duration）：                                     │
 * │    从 DEMO_ORBIT_START → DEVICE_FOCUS_PRESETS 目标          │
 * │    目的：从固定干净起点飞向设备，路径可预测                 │
 * │  到位后：解锁 OrbitControls（用户可自由调整视角）           │
 * └────────────────────────────────────────────────────────────┘
 *        ↓ cameraFocus 变为 null（RECOVERED 阶段触发）
 * ┌─ 恢复动画（锁住 OrbitControls）────────────────────────────┐
 * │  从 当前聚焦位置 → CAMERA_DEFAULTS（全景视角）1.5s          │
 * │  到位后：解锁 OrbitControls                                 │
 * └────────────────────────────────────────────────────────────┘
 *
 * 坐标说明：
 * - DEVICE_FOCUS_PRESETS、DEMO_ORBIT_START 的坐标是 scale group 内坐标
 * - toCameraSpace() 会将其 ×SCENE_SCALE 转换为相机空间坐标
 * - CAMERA_DEFAULTS 的坐标直接是相机空间坐标
 */

/** 段1（收敛到演示起点）占总 duration 的比例 */
const GATHER_RATIO = 0.25;

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraFocus = useScenarioStore((s) => s.cameraFocus);
  const { camera } = useThree();

  // ── 聚焦目标（相机空间） ──
  const focusPosition = useRef(new THREE.Vector3());
  const focusLookAt = useRef(new THREE.Vector3());

  // ── 演示起点（相机空间，由 DEMO_ORBIT_START 转换而来） ──
  const gatherPosition = useRef(new THREE.Vector3());
  const gatherLookAt = useRef(new THREE.Vector3());

  // ── 恢复终点（相机空间，即 CAMERA_DEFAULTS） ──
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
  type AnimState = 'idle' | 'gather' | 'focus' | 'recover';
  const animState = useRef<AnimState>('idle');
  const progress = useRef(0);
  const gatherDuration = useRef(0); // 段1时长（秒）
  const focusDuration = useRef(0);  // 段2时长（秒）
  const recoverDuration = 1.5;      // 恢复时长（秒）

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

    const totalSeconds = (cameraFocus.duration ?? 2000) / 1000;
    gatherDuration.current = totalSeconds * GATHER_RATIO;
    focusDuration.current = totalSeconds * (1 - GATHER_RATIO);

    // 计算演示起点（scale 内坐标 → 相机空间）
    gatherPosition.current.copy(toCameraSpace(DEMO_ORBIT_START.position));
    gatherLookAt.current.copy(toCameraSpace(DEMO_ORBIT_START.lookAt));

    // 计算聚焦目标（scale 内坐标 → 相机空间）
    focusPosition.current.copy(toCameraSpace(cameraFocus.position));
    focusLookAt.current.copy(toCameraSpace(cameraFocus.lookAt));

    // 记录当前相机状态作为段1起点
    startPosition.current.copy(camera.position);
    startLookAt.current.copy(
      controlsRef.current?.target ?? new THREE.Vector3()
    );

    progress.current = 0;
    animState.current = 'gather';
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
      animState.current = 'recover';
      lockControls();
    }
    prevFocus.current = cameraFocus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocus]);

  // ── 每帧动画 ──
  useFrame((_, delta) => {
    const state = animState.current;
    if (state === 'idle') return;

    if (state === 'gather') {
      progress.current = Math.min(1, progress.current + delta / gatherDuration.current);
      const t = smoothstep(progress.current);
      camera.position.lerpVectors(startPosition.current, gatherPosition.current, t);
      controlsRef.current?.target.lerpVectors(startLookAt.current, gatherLookAt.current, t);

      if (progress.current >= 1) {
        // 段1结束，切到段2，重置起点为演示起点
        startPosition.current.copy(gatherPosition.current);
        startLookAt.current.copy(gatherLookAt.current);
        progress.current = 0;
        animState.current = 'focus';
      }
    }

    if (state === 'focus') {
      progress.current = Math.min(1, progress.current + delta / focusDuration.current);
      const t = smoothstep(progress.current);
      camera.position.lerpVectors(startPosition.current, focusPosition.current, t);
      controlsRef.current?.target.lerpVectors(startLookAt.current, focusLookAt.current, t);

      if (progress.current >= 1) {
        animState.current = 'idle';
        unlockControls(); // 到位后解锁，用户可自由调整视角
      }
    }

    if (state === 'recover') {
      progress.current = Math.min(1, progress.current + delta / recoverDuration);
      const t = smoothstep(progress.current);
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

/** Smoothstep 缓入缓出 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
