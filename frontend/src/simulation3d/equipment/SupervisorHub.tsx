import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DEVICE_ANCHORS } from '../../data/constants';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { toThreePos } from '../utils/coordinates';

interface SupervisorHubProps {
  agentId?: 'supervisor';
}

/**
 * 监管中枢：保留圆柱体骨架 + 底座 + 双光环
 * 顶部加载 surprior_model.glb（带骨骼的人形机器人模型），
 * 自动包围盒居中，精确放置在圆柱顶端
 */
export const SupervisorHub: React.FC<SupervisorHubProps> = () => {
  const anchor = DEVICE_ANCHORS.supervisor;
  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const groundY = 0;

  const torusRef = useRef<THREE.Mesh>(null);
  const innerTorusRef = useRef<THREE.Mesh>(null);
  const modelGroupRef = useRef<THREE.Group>(null);

  // 加载 supervisor 模型
  const { scene } = useGLTF('/models/surprior_model.glb');
  const cloneRef = useRef<THREE.Group | null>(null);

  /** 圆柱顶端 Y 坐标（模型放置目标） */
  const CYLINDER_TOP_Y = 22;
  /** 期望模型高度（约为圆柱高度的 75%） */
  const TARGET_MODEL_HEIGHT = 15;

  // 模型缩放和偏移，靠包围盒计算
  const [modelOffset, setModelOffset] = useState({ y: 0, scale: 0.7 });

  useEffect(() => {
    // 用 SkeletonUtils 克隆
    import('three-stdlib').then(({ SkeletonUtils }) => {
      const cloned = SkeletonUtils.clone(scene) as THREE.Group;

      // 计算包围盒
      const box = new THREE.Box3().setFromObject(cloned);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // 自动计算缩放：目标高度 / 实际高度
      const autoScale = TARGET_MODEL_HEIGHT / size.y;

      // 模型底部 Y = center.y - size.y/2
      // 要使模型底部落在 CYLINDER_TOP_Y，需要偏移：CYLINDER_TOP_Y - (center.y - size.y/2)
      const feetY = center.y - size.y / 2;
      const autoOffset = CYLINDER_TOP_Y - feetY;

      cloneRef.current = cloned;
      setModelOffset({ y: autoOffset, scale: autoScale });

      console.log(
        `[SupervisorHub] Box3 size=${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)} ` +
        `center=${center.x.toFixed(1)},${center.y.toFixed(1)},${center.z.toFixed(1)} ` +
        `→ scale=${autoScale.toFixed(2)}, yOffset=${autoOffset.toFixed(1)}`
      );
    });
  }, [scene]);

  // 读取 store：分析中/派发中 加速旋转
  const phase = useScenarioStore((s) => s.phase);

  useFrame((_, delta) => {
    const isActive = phase === 'analyzing' || phase === 'dispatching';
    const speed = isActive ? 2.4 : 0.8;

    // 光环旋转
    if (torusRef.current) {
      torusRef.current.rotation.y += delta * speed;
      torusRef.current.rotation.x += delta * 0.15;
    }
    if (innerTorusRef.current) {
      innerTorusRef.current.rotation.z += delta * speed * 0.6;
    }

    // 模型自转
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.y += delta * speed * 0.3;
    }
  });

  return (
    <group position={[pos[0], groundY, pos[2]]}>
      {/* 底座 */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[10, 11, 1.2, 32]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 主体圆柱 */}
      <mesh position={[0, 12, 0]} castShadow>
        <cylinderGeometry args={[8, 9, 20, 32]} />
        <meshStandardMaterial
          color="#378ADD"
          emissive="#378ADD"
          emissiveIntensity={0.3}
          transparent
          opacity={0.75}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>

      {/* 内部线框 */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[7.5, 8.5, 18, 32]} />
        <meshBasicMaterial color="#5ba0f5" wireframe transparent opacity={0.15} />
      </mesh>

      {/* surprior_model — 监管 Agent 模型（包围盒自动居中） */}
      <group
        ref={modelGroupRef}
        position={[0, modelOffset.y, 0]}
        scale={modelOffset.scale}
      >
        {cloneRef.current && <primitive object={cloneRef.current} />}
      </group>

      {/* 旋转光环 torus */}
      <mesh ref={torusRef} position={[0, 14, 0]}>
        <torusGeometry args={[12, 0.7, 16, 64]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#378ADD"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* 第二层光环（反向旋转） */}
      <mesh ref={innerTorusRef} position={[0, 8, 0]} rotation={[Math.PI / 6, 0, Math.PI / 3]}>
        <torusGeometry args={[10.5, 0.5, 16, 48]} />
        <meshStandardMaterial
          color="#93c5fd"
          emissive="#378ADD"
          emissiveIntensity={0.4}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};
