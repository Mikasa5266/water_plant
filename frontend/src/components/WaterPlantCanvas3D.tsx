import React, { useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { TelemetryState, AnomalySimulation, AgentId, CardState, AgentData, ActiveAnimation } from '../types';
import { INITIAL_AGENTS_DATA } from '../data/initialAgents';
import { SceneRenderer } from '../simulation3d/SceneRenderer';
import { AgentBadges } from '../simulation3d/AgentBadges';
import { AgentCard } from './AgentCard';
import { SVG_DEFS } from '../simulation3d/SvgDefs';

interface WaterPlantCanvas3DProps {
  containerRef: React.RefObject<HTMLDivElement>;
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  simulation: AnomalySimulation;
  agentStatuses: Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>;
  agentLogs: Record<AgentId, any[]>;
  cards: Record<AgentId, CardState>;
  setCards: React.Dispatch<React.SetStateAction<Record<AgentId, CardState>>>;
  camera: { yaw: number; pitch: number; zoom: number };
  setCamera: React.Dispatch<React.SetStateAction<{ yaw: number; pitch: number; zoom: number }>>;
  animationTick: number;
  toggleAgentCard: (agentId: AgentId) => void;
  handleStartDrag: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, agentId: AgentId) => void;
  setAgentLogs: React.Dispatch<React.SetStateAction<Record<AgentId, any[]>>>;
  activeTab: 'model' | 'simulation_studio';
  activeAnim: ActiveAnimation | null;
  triggerCalibrationAnimation: (agentId: AgentId) => void;
}

export const WaterPlantCanvas3D: React.FC<WaterPlantCanvas3DProps> = ({
  containerRef, telemetry, setTelemetry, simulation,
  agentStatuses, agentLogs, cards, setCards,
  camera, setCamera, animationTick,
  toggleAgentCard, handleStartDrag, setAgentLogs,
  activeTab, activeAnim, triggerCalibrationAnimation
}) => {
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const cameraDragStartRef = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  const shouldIgnoreTarget = (target: HTMLElement) => !!(
    target.closest('#agent-icon-g-master') ||
    target.closest('#agent-icon-g-dosing') ||
    target.closest('#agent-icon-g-uf') ||
    target.closest('#agent-icon-g-membrane') ||
    target.closest('button') ||
    target.closest('[id^="floating-card-"]') ||
    target.closest('.cursor-pointer')
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (shouldIgnoreTarget(e.target as HTMLElement)) return;
    setIsDraggingCamera(true);
    cameraDragStartRef.current = { x: e.clientX, y: e.clientY, yaw: camera.yaw, pitch: camera.pitch };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCamera) return;
    const dx = e.clientX - cameraDragStartRef.current.x;
    const dy = e.clientY - cameraDragStartRef.current.y;
    setCamera(prev => ({
      ...prev,
      yaw: (cameraDragStartRef.current.yaw + dx * 0.4) % 360,
      pitch: Math.max(15, Math.min(80, cameraDragStartRef.current.pitch + dy * 0.4))
    }));
  };

  const handleMouseUp = () => { setIsDraggingCamera(false); };

  const handleWheel = (e: React.WheelEvent) => {
    const direction = e.deltaY < 0 ? 1 : -1;
    setCamera(prev => ({
      ...prev,
      zoom: parseFloat(Math.max(0.4, Math.min(3.0, prev.zoom + direction * 0.05)).toFixed(2))
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (shouldIgnoreTarget(e.target as HTMLElement)) return;
    if (e.touches.length === 1) {
      setIsDraggingCamera(true);
      cameraDragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, yaw: camera.yaw, pitch: camera.pitch };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingCamera || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - cameraDragStartRef.current.x;
    const dy = e.touches[0].clientY - cameraDragStartRef.current.y;
    setCamera(prev => ({
      ...prev,
      yaw: (cameraDragStartRef.current.yaw + dx * 0.4) % 360,
      pitch: Math.max(15, Math.min(80, cameraDragStartRef.current.pitch + dy * 0.4))
    }));
  };

  return (
    <div
      className={`relative bg-gradient-to-b from-slate-950/70 to-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-col min-h-0 overflow-hidden col-span-12 ${
        activeTab === 'simulation_studio' ? 'lg:col-span-8' : 'lg:col-span-12'
      } flex-1`}
    >
      {/* Ambient Title */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <div className="p-1 px-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
          <span>实时流体动态数字仿真模型</span>
        </div>
        {simulation.active && (
          <div className="p-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-medium animate-pulse backdrop-blur-md">
            正在演练: {simulation.title} (当前步骤 {simulation.step}/8)
          </div>
        )}
      </div>

      {/* Help Overlay */}
      <div className="absolute top-4 right-4 z-20">
        <div className="group relative">
          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer backdrop-blur-md transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="absolute right-0 top-7 w-72 p-3 bg-slate-900/95 border border-slate-800 text-xs text-slate-300 rounded-xl space-y-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-2xl backdrop-blur-lg">
            <p className="font-semibold text-teal-400">3D 画布交互指南</p>
            <p>1. 页面中央展示了水厂一比一建模。包含：原水池、药箱加药泵、总控环形反应池、超滤阀组、末端膜区。</p>
            <p>2. 各区域上方展示四位智能体的交互图标。点击图标即可在浮窗中展开详细性能度量。</p>
            <p>3. 浮窗支持在画布内任意拖拽，也支持右上角随时关闭。</p>
            <p>4. 在底部启动异常协同演练，可观察多智能体在8步决策链中的通信、状态跃迁及配管颜色的拟真扩散。</p>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        className="flex-1 w-full relative min-h-[480px] lg:min-h-[580px] cursor-grab active:cursor-grabbing select-none"
        ref={containerRef}
        id="isometric-modeling-stage"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          viewBox="0 0 1000 580"
          className="w-full h-full absolute inset-0 transition-transform duration-300 ease-out"
          preserveAspectRatio="xMidYMid meet"
        >
          <SVG_DEFS simulation={simulation} />
          <SceneRenderer
            camera={camera}
            animationTick={animationTick}
            telemetry={telemetry}
            simulation={simulation}
            cards={cards}
            agentStatuses={agentStatuses}
            activeAnim={activeAnim}
          />
          <AgentBadges
            camera={camera}
            agentStatuses={agentStatuses}
            cards={cards}
            toggleAgentCard={toggleAgentCard}
          />
        </svg>
      </div>

      {/* Agent Cards Overlay */}
      {(Object.entries(INITIAL_AGENTS_DATA) as [AgentId, Omit<AgentData, 'status' | 'logs'>][]).map(([id, item]) => {
        const cardState = cards[id];
        if (!cardState.isOpen) return null;
        return (
          <AgentCard
            key={id}
            id={id}
            item={item}
            cardState={cardState}
            status={agentStatuses[id]}
            logs={agentLogs[id] || []}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            toggleAgentCard={toggleAgentCard}
            handleStartDrag={handleStartDrag}
            setAgentLogs={setAgentLogs}
            triggerCalibrationAnimation={triggerCalibrationAnimation}
          />
        );
      })}

      {/* Bottom telemetry info */}
      <div className="absolute bottom-4 left-4 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono pointer-events-none text-slate-400 z-10 space-y-1">
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /><span>水质检测（浊度）: {telemetry.inletTurbidity} NTU → 出水: {telemetry.outletTurbidity} NTU</span></div>
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /><span>全厂水力载能: {telemetry.energyConsumption} kWh/m³</span></div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg backdrop-blur-md">
        <button
          onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(0.4, Number((prev.zoom - 0.1).toFixed(2))) }))}
          className="p-1 px-2 rounded bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 font-bold transition cursor-pointer"
          title="缩小"
        >-</button>
        <span className="text-xs font-mono text-teal-400 px-1 min-w-[3.5rem] text-center select-none">
          {Math.round(camera.zoom * 100)}%
        </span>
        <button
          onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(3.0, Number((prev.zoom + 0.1).toFixed(2))) }))}
          className="p-1 px-2 rounded bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 font-bold transition cursor-pointer"
          title="放大"
        >+</button>
        <button
          onClick={() => setCamera({ zoom: 0.95, yaw: -35, pitch: 35 })}
          className="p-1 px-1.5 rounded bg-slate-800/60 text-[10px] text-slate-400 hover:text-white hover:bg-slate-700 transition font-medium cursor-pointer"
          title="恢复初始视图"
        >重置</button>
      </div>
    </div>
  );
};
