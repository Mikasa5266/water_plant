import React, { useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useScenarioStore } from '../stores/useScenarioStore';

/**
 * 相机控制器
 * - 默认：OrbitControls 自由旋转/缩放
 * - 聚焦时：禁用 OrbitControls，平滑 lerp 到 store 指定的 cameraFocus 目标
 * - 聚焦完成后自动恢复 OrbitControls
 */
export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraFocus = useScenarioStore((s) => s.cameraFocus);
  const { camera } = useThree();

  // 保存聚焦前的相机参数，用于恢复
  const savedState = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);

  // 聚焦目标向量缓存
  const focusPosition = useRef(new THREE.Vector3());
  const focusLookAt = useRef(new THREE.Vector3());

  // 动画进度 (0→1)
  const progress = useRef(0);
  const isFocusing = useRef(false);
  const isRecovering = useRef(false);

  // 当 cameraFocus 变为非 null：开始聚焦
  useEffect(() => {
    if (cameraFocus) {
      // 保存当前相机状态
      savedState.current = {
        position: camera.position.clone(),
        target: controlsRef.current?.target.clone() ?? new THREE.Vector3(),
      };

      focusPosition.current.set(
        cameraFocus.position[0],
        cameraFocus.position[1],
        cameraFocus.position[2],
      );
      focusLookAt.current.set(
        cameraFocus.lookAt[0],
        cameraFocus.lookAt[1],
        cameraFocus.lookAt[2],
      );

      progress.current = 0;
      isFocusing.current = true;
      isRecovering.current = false;

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  }, [cameraFocus]);

  // 当 cameraFocus 变为 null（之前有值现在没了）：开始恢复
  const prevFocus = useRef(cameraFocus);
  useEffect(() => {
    if (!cameraFocus && prevFocus.current && savedState.current) {
      isFocusing.current = false;
      isRecovering.current = true;
      progress.current = 0;
    }
    prevFocus.current = cameraFocus;
  }, [cameraFocus]);

  // 每帧执行 lerp 动画
  useFrame((_, delta) => {
    if (isFocusing.current) {
      const duration = cameraFocus?.duration ?? 2000;
      const step = delta / (duration / 1000);
      progress.current = Math.min(1, progress.current + step);

      const t = smoothstep(progress.current);
      camera.position.lerpVectors(
        savedState.current!.position,
        focusPosition.current,
        t,
      );

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          savedState.current!.target,
          focusLookAt.current,
          t,
        );
      }

      if (progress.current >= 1) {
        isFocusing.current = false;
      }
    }

    if (isRecovering.current) {
      const step = delta / 1.5; // 恢复约 1.5s
      progress.current = Math.min(1, progress.current + step);

      const t = smoothstep(progress.current);
      camera.position.lerpVectors(
        focusPosition.current,
        savedState.current!.position,
        t,
      );

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          focusLookAt.current,
          savedState.current!.target,
          t,
        );
      }

      if (progress.current >= 1) {
        isRecovering.current = false;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
        savedState.current = null;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={40}
      maxDistance={600}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.1}
      target={[40, 20, 0]}
    />
  );
};

/** Smoothstep 缓入缓出 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
