import React from 'react';
import { Canvas } from '@react-three/fiber';
import type { AgentId } from '../types';
import { CameraController } from './CameraController';
import { Ground } from './Ground';
import { SupervisorHub } from './equipment/SupervisorHub';
import { DosingModule } from './equipment/DosingModule';
import { UFModule } from './equipment/UFModule';
import { ROModule } from './equipment/ROModule';
import { PumpModule } from './equipment/PumpModule';
import { PipelineSystem } from './pipelines/PipelineSystem';
import { AgentNode } from './agents/AgentNode';
import { ThinkingBubble } from './agents/ThinkingBubble';
import { ParticleSystem } from './pipelines/ParticleSystem';
import { AlarmFlash } from './effects/AlarmFlash';
import { RecoveryGradient } from './effects/RecoveryGradient';
import { DeviceAction } from './effects/DeviceAction';

interface Scene3DProps {
  className?: string;
}

/** 4个专项 Agent（不含 supervisor） */
const SPECIALIST_AGENTS: AgentId[] = ['dosing', 'uf', 'ro', 'pump'];

/**
 * 水厂 3D 场景主容器
 * R3F Canvas + 灯光 + 设备 + Agent + 管道 + 粒子 + 效果
 * 所有子组件独立从 Zustand Store 读取状态
 */
export const Scene3D: React.FC<Scene3DProps> = ({ className }) => {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 480 }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: 3, // ACESFilmicToneMapping
        }}
        camera={{
          position: [160, 100, 220],
          fov: 50,
          near: 1,
          far: 3000,
        }}
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #0f172a 0%, #020617 100%)' }}
      >
        {/* ─── 灯光 ─── */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[200, 300, 150]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-100, 150, -100]}
          intensity={0.5}
        />
        <pointLight position={[20, 80, -40]} intensity={4} color="#378ADD" distance={400} />
        <pointLight position={[-180, 60, -220]} intensity={2} color="#BA7517" distance={250} />
        <pointLight position={[280, 60, 20]} intensity={2} color="#D85A30" distance={250} />

        {/* ─── 相机 ─── */}
        <CameraController />

        {/* ─── 地面 ─── */}
        <Ground />

        {/* ─── 监管中枢 ─── */}
        <SupervisorHub />

        {/* ─── 设备模块 ─── */}
        <DosingModule />
        <UFModule />
        <ROModule />
        <PumpModule />

        {/* ─── 管道 ─── */}
        <PipelineSystem />

        {/* ─── Agent 球体 ×4 ─── */}
        {SPECIALIST_AGENTS.map((id) => (
          <AgentNode key={id} agentId={id} />
        ))}

        {/* ─── 思考气泡 ─── */}
        <ThinkingBubble />

        {/* ─── 粒子 ─── */}
        <ParticleSystem />

        {/* ─── 效果 ─── */}
        <AlarmFlash />
        <RecoveryGradient />
        <DeviceAction />
      </Canvas>
    </div>
  );
};
