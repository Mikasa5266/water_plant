import { useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import type { TelemetryState } from '../types';
import { useAnimationLoop } from '../hooks/useAnimationLoop';
import { useClock } from '../hooks/useClock';
import { useAgentState } from '../features/agents/useAgentState';
import { useAgentCards } from '../features/agents/useAgentCards';
import { useSimulation } from '../features/simulation/useSimulation';
import { HeaderHUD } from '../components/HeaderHUD';
import { BottomTimeline } from '../components/BottomTimeline';
import { ParameterControlSidebar } from '../components/ParameterControlSidebar';
import { WaterPlantCanvas3D } from '../components/WaterPlantCanvas3D';

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    inletFlow: 1240,
    outletFlow: 1210,
    inletTurbidity: 18.5,
    outletTurbidity: 0.04,
    dosingRate: 4.8,
    chemicalLevel: 72,
    ufPressure: 82,
    roFlux: 74.5,
    roConductivity: 18,
    pumpCurrent: 28,
    pumpTemperature: 55,
    energyConsumption: 0.22,
    healthScore: 98,
    activeAgentsCount: 5,
    onlineRate: 99.2
  });

  const [activeTab, setActiveTab] = useState<'model' | 'simulation_studio'>('model');

  const { animationTick, animationTickRef } = useAnimationLoop();
  const currentTime = useClock();
  const { agentStatuses, setAgentStatuses, agentLogs, setAgentLogs } = useAgentState();
  const { cards, setCards, topZIndex, setTopZIndex, handleStartDrag, toggleAgentCard } = useAgentCards(containerRef);

  const {
    simulation,
    isPlaying,
    setIsPlaying,
    activeAnim,
    runStepChange,
    triggerSimulationIncident,
    resetToNormal,
    triggerCalibrationAnimation
  } = useSimulation({
    animationTickRef,
    animationTick,
    telemetry,
    setTelemetry,
    agentStatuses,
    setAgentStatuses,
    agentLogs,
    setAgentLogs,
    setCards
  });

  const [camera, setCamera] = useState({ yaw: -35, pitch: 35, zoom: 0.95 });

  return (
    <>
      <HeaderHUD
        simulation={simulation}
        telemetry={telemetry}
        currentTime={currentTime}
        resetToNormal={resetToNormal}
        cards={cards}
        setCards={setCards}
        topZIndex={topZIndex}
        setTopZIndex={setTopZIndex}
      />

      <main className="flex-1 min-h-0 flex flex-col p-4 relative z-10" id="main-control-board">
        <div className="flex justify-between items-center mb-3 px-1" id="tab-nav">
          <div className="flex space-x-1.5 bg-slate-950/80 p-1 border border-slate-800/80 rounded-lg">
            <button
              onClick={() => setActiveTab('model')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'model'
                  ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/40 text-teal-300 shadow-lg shadow-teal-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
              id="tab-view-model"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>智能水厂 3D 数字孪生视图</span>
            </button>
            <button
              onClick={() => setActiveTab('simulation_studio')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'simulation_studio'
                  ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/40 text-teal-300 shadow-lg shadow-teal-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
              id="tab-view-simulator"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>精细化参数控制面板</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500 animate-pulse" />安全供水</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 animate-pulse" />优化分析中</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500 animate-pulse" />异常决策流</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 relative">
          <WaterPlantCanvas3D
            containerRef={containerRef}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            simulation={simulation}
            agentStatuses={agentStatuses}
            agentLogs={agentLogs}
            cards={cards}
            setCards={setCards}
            camera={camera}
            setCamera={setCamera}
            animationTick={animationTick}
            toggleAgentCard={toggleAgentCard}
            handleStartDrag={handleStartDrag}
            setAgentLogs={setAgentLogs}
            activeTab={activeTab}
            activeAnim={activeAnim}
            triggerCalibrationAnimation={triggerCalibrationAnimation}
          />

          {activeTab === 'simulation_studio' && (
            <ParameterControlSidebar
              telemetry={telemetry}
              setTelemetry={setTelemetry}
              resetToNormal={resetToNormal}
            />
          )}
        </div>

        <BottomTimeline
          simulation={simulation}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          triggerSimulationIncident={triggerSimulationIncident}
          runStepChange={runStepChange}
        />
      </main>
    </>
  );
}
