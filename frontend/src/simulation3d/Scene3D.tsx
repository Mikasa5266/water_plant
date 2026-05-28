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
import { SCENE_SCALE, CAMERA_DEFAULTS } from './config';

interface Scene3DProps {
  className?: string;
}

/** 4个专项 Agent（不含 supervisor） */
const SPECIALIST_AGENTS: AgentId[] = ['dosing', 'uf', 'ro', 'pump'];

/**
 * 水厂 3D 场景主容器
 * R3F Canvas + 灯光 + 设备 + Agent + 管道 + 粒子 + 效果
 * 所有子组件独立从 Zustand Store 读取状态
 *
 * 缩放架构：
 * - 相机 + 灯光在 scale group 外面（不受 SCENE_SCALE 影响）
 * - 全部 3D 内容在 scale group 内部（统一由 SCENE_SCALE 缩放）
 * - 修改 config.ts 中的 SCENE_SCALE 即可整体调整场景大小
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
          position: CAMERA_DEFAULTS.position,
          fov: CAMERA_DEFAULTS.fov,
          near: CAMERA_DEFAULTS.near,
          far: CAMERA_DEFAULTS.far,
        }}
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #0f172a 0%, #020617 100%)' }}
      >
        {/* ─── 灯光（scale 外面，保持恒定照明） ─── */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[80, 120, 60]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-40, 60, -40]}
          intensity={0.5}
        />
        <pointLight position={[0, 30, -15]} intensity={3} color="#378ADD" distance={200} />
        <pointLight position={[-40, 25, -50]} intensity={1.5} color="#BA7517" distance={120} />
        <pointLight position={[55, 25, 8]} intensity={1.5} color="#D85A30" distance={120} />

        {/* ─── 相机控制器（scale 外面） ─── */}
        <CameraController />

        {/* ═══ 全局缩放 group ═══ */}
        <group scale={[SCENE_SCALE, SCENE_SCALE, SCENE_SCALE]}>
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
        </group>
      </Canvas>
    </div>
  );
};
