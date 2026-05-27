import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScenarioStore } from '../../stores/useScenarioStore';
import { AGENT_3D_ANCHORS } from '../../data/constants';
import { toThreePos } from '../utils/coordinates';

/**
 * 恢复渐变效果
 * 当 phase === RECOVERING 时，在对应设备上方显示红→绿渐变光环
 */
export const RecoveryGradient: React.FC = () => {
  const phase = useScenarioStore((s) => s.phase);
  const deviceFlashing = useScenarioStore((s) => s.deviceFlashing);

  const isRecovering = phase === 'recovering' && deviceFlashing !== null;

  if (!isRecovering || !deviceFlashing) return null;

  return <RecoveryRing agentId={deviceFlashing} />;
};

const RecoveryRing: React.FC<{ agentId: string }> = ({ agentId }) => {
  const anchor = AGENT_3D_ANCHORS[agentId as keyof typeof AGENT_3D_ANCHORS];
  if (!anchor) return null;

  const pos = toThreePos(anchor.x, anchor.y, anchor.z);
  const ringPos: [number, number, number] = [pos[0], 2.5, pos[2]];

  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, []);

  useFrame((_, delta) => {
    setProgress((p) => {
      const next = Math.min(1, p + delta * 0.6);
      return next;
    });

    if (!meshRef.current) return;

    // lerp 红→绿
    const red = new THREE.Color('#ef4444');
    const green = new THREE.Color('#10b981');
    const current = red.clone().lerp(green, progress);

    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      const mat = meshRef.current.material;
      mat.color.copy(current);
      mat.emissive.copy(current);
      mat.emissiveIntensity = 0.3 + (1 - progress) * 0.8;
      mat.opacity = 0.3 + progress * 0.4;
    }
  });

  return (
    <mesh ref={meshRef} position={ringPos} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[9.5, 0.6, 8, 48]} />
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ef4444"
        emissiveIntensity={0.6}
        transparent
        opacity={0.4}
        roughness={0.2}
        depthWrite={false}
      />
    </mesh>
  );
};
