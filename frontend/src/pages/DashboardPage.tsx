import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import type { AgentId, AgentRunStatus, AgentUIStatus, IncidentType, TelemetryState } from '../types/index';
import { ScenarioPhase } from '../types/index';
import { DEFAULT_TELEMETRY } from '../data/defaultTelemetry';
import { useAnimationLoop } from '../hooks/useAnimationLoop';
import { useClock } from '../hooks/useClock';
import { useKeyboard } from '../hooks/useKeyboard';
import { usePhaseEffects } from '../hooks/usePhaseEffects';
import { useAgentState } from '../features/agents/useAgentState';
import { useAgentCards } from '../features/agents/useAgentCards';
import { useSimulation } from '../features/simulation/useSimulation';
import { useAutoDemo } from '../features/simulation/useAutoDemo';
import { AGENT_ORDER, AGENT_WINDOW_DATA } from '../data/agentWindowData';
import { DEMO_SNAPSHOTS, type DemoState } from '../data/demoSnapshots';
import { HeaderHUD } from '../components/HeaderHUD';
import { AgentWindow } from '../components/AgentWindow';
import { Dock } from '../components/Dock';
import { HelpOverlay, type HelpShortcutItem } from '../components/HelpOverlay';
import { InfoPanel } from '../components/InfoPanel';
import { Notification } from '../components/Notification';
import { Taskbar } from '../components/Taskbar';
import { DemoControlPanel } from '../components/DemoControlPanel';
import type { SpeedMultiplier } from '../components/DemoControlPanel';
import { ParameterControlSidebar } from '../components/ParameterControlSidebar';
import { WaterPlantCanvas3D } from '../components/WaterPlantCanvas3D';
import { useScenarioStore } from '../stores/useScenarioStore';
import { useSystemStore } from '../stores/useSystemStore';
import { useWindowStore } from '../stores/useWindowStore';
import { useStreamingAI } from '../hooks/useStreamingAI';
import { getTimestamp } from '../utils/format';

const RUN_STATUS_TO_UI: Record<AgentRunStatus, AgentUIStatus> = {
  idle: 'normal',
  monitoring: 'normal',
  thinking: 'pending',
  processing: 'pending',
  warning: 'alarm',
  executing: 'recovering',
};

const INCIDENT_TO_AGENT: Record<string, AgentId> = {
  dosing_abnormal: 'dosing',
  uf_clogging: 'uf',
  ro_fouling: 'ro',
  pump_overload: 'pump',
};

const STEP_TO_PHASE: Record<number, ScenarioPhase> = {
  1: ScenarioPhase.ANOMALY_DETECTED,
  2: ScenarioPhase.SUPERVISOR_ANALYZING,
  3: ScenarioPhase.SUPERVISOR_ANALYZING,
  4: ScenarioPhase.DISPATCHING,
  5: ScenarioPhase.AGENT_ANALYZING,
  6: ScenarioPhase.EXECUTING,
  7: ScenarioPhase.DEVICE_OPERATING,
  8: ScenarioPhase.RECOVERED,
};

const KEYBOARD_SHORTCUTS: HelpShortcutItem[] = [
  { keys: 'Ctrl+1', description: '触发加药异常场景' },
  { keys: 'Ctrl+2', description: '触发超滤异常场景' },
  { keys: 'Ctrl+3', description: '触发反渗透异常场景' },
  { keys: 'Ctrl+4', description: '触发泵组异常场景' },
  { keys: '?', description: '显示或隐藏快捷键帮助' },
  { keys: 'Ctrl+Tab', description: '切换到下一个窗口' },
  { keys: 'Ctrl+Shift+Tab', description: '切换到上一个窗口' },
  { keys: 'Ctrl+Shift+D', description: '打开或关闭调试面板' },
  { keys: 'Ctrl+Home', description: '回到 OS 桌面' },
  { keys: 'Esc', description: '按优先级关闭浮层、终止场景、关闭通知或最小化窗口' },
];

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState<TelemetryState>(DEFAULT_TELEMETRY);
  const [activeTab, setActiveTab] = useState<'model' | 'simulation_studio'>('model');
  const [camera, setCamera] = useState({ yaw: -35, pitch: 35, zoom: 0.95 });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [pulsingAgentId, setPulsingAgentId] = useState<AgentId | null>(null);
  const [windowStatusText, setWindowStatusText] = useState('');
  const [demoState, setDemoState] = useState<DemoState>('normal');
  const [demoSpeed, setDemoSpeed] = useState<SpeedMultiplier>(1);

  const { animationTick, animationTickRef } = useAnimationLoop();
  const currentTime = useClock();
  const lastIncidentRef = useRef<string | null>(null);
  const lastEventStepRef = useRef<number | null>(null);
  const { agentStatuses, setAgentStatuses, agentLogs, setAgentLogs } = useAgentState();
  const { cards, setCards, topZIndex, setTopZIndex, handleStartDrag, toggleAgentCard, closeAgentCard } =
    useAgentCards(containerRef);
  const {
    simulation,
    isPlaying,
    setIsPlaying,
    activeAnim,
    runStepChange,
    triggerSimulationIncident,
    resetToNormal,
    triggerCalibrationAnimation,
  } = useSimulation({
    animationTickRef,
    animationTick,
    telemetry,
    setTelemetry,
    agentStatuses,
    setAgentStatuses,
    agentLogs,
    setAgentLogs,
    setCards,
  });

  const autoDemo = useAutoDemo({
    triggerSimulationIncident,
    resetToNormal,
    setIsPlaying,
    simulationActive: simulation.active,
    simulationStep: simulation.step,
  }, { loop: false, stepInterval: 4000 / demoSpeed });

  const windows = useWindowStore((state) => state.windows);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const openWindow = useWindowStore((state) => state.openWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const moveWindow = useWindowStore((state) => state.moveWindow);
  const resizeWindow = useWindowStore((state) => state.resizeWindow);
  const closeAllWindows = useWindowStore((state) => state.closeAllWindows);
  const cycleWindow = useWindowStore((state) => state.cycleWindow);
  const agentUIStatus = useScenarioStore((state) => state.agentUIStatus);
  const agentRunStatuses = useScenarioStore((state) => state.agentRunStatuses);
  const phase = useScenarioStore((state) => state.phase);
  const activeAgentId = useScenarioStore((state) => state.activeAgentId);
  const targetAgentId = useScenarioStore((state) => state.targetAgentId);
  const thinking = useScenarioStore((state) => state.thinking);
  const decisionSteps = useScenarioStore((state) => state.decisionSteps);
  const startScenarioIncident = useScenarioStore((state) => state.startIncident);
  const advanceScenarioPhase = useScenarioStore((state) => state.advancePhase);
  const clearScenarioThinking = useScenarioStore((state) => state.clearThinking);
  const forceScenarioIdle = useScenarioStore((state) => state.forceIdle);
  const eventLog = useSystemStore((state) => state.eventLog);
  const notifications = useSystemStore((state) => state.notifications);
  const pushEvent = useSystemStore((state) => state.pushEvent);
  const pushNotification = useSystemStore((state) => state.pushNotification);
  const dismissNotification = useSystemStore((state) => state.dismissNotification);
  const clearNotifications = useSystemStore((state) => state.clearNotifications);

  const { startStream, abort: abortStream } = useStreamingAI();
  const incidentType = useScenarioStore((state) => state.incidentType);

  useEffect(() => {
    if (phase === ScenarioPhase.SUPERVISOR_ANALYZING && incidentType) {
      startStream({
        agentId: 'supervisor',
        incidentType: incidentType as IncidentType,
        phase: 'supervisor',
        telemetry: telemetry,
        title: '监管智能体正在分析',
        onDone: () => advanceScenarioPhase(),
      });
    } else if (phase === ScenarioPhase.AGENT_ANALYZING && incidentType && targetAgentId) {
      startStream({
        agentId: targetAgentId,
        incidentType: incidentType as IncidentType,
        phase: 'agent',
        telemetry: telemetry,
        title: `${AGENT_WINDOW_DATA[targetAgentId].name}执行推演`,
        onDone: () => advanceScenarioPhase(),
      });
    } else if (phase === ScenarioPhase.IDLE) {
      abortStream();
    }
  }, [phase]);

  const visibleAgentId = activeWindowId ?? activeAgentId ?? targetAgentId;
  const currentAgent = visibleAgentId
    ? {
        id: visibleAgentId,
        name: AGENT_WINDOW_DATA[visibleAgentId].name,
        status: agentUIStatus,
      }
    : null;
  const dockAgents = AGENT_ORDER.map((agentId) => {
    const uiStatus = RUN_STATUS_TO_UI[agentRunStatuses[agentId]];
    return {
      id: agentId,
      label: AGENT_WINDOW_DATA[agentId].englishName,
      status: uiStatus,
      badgeCount: uiStatus === 'alarm' && targetAgentId === agentId ? 1 : undefined,
      isActive: activeWindowId === agentId && !windows[agentId].isMinimized,
    };
  });
  const taskbarWindows = AGENT_ORDER.filter((agentId) => windows[agentId].isOpen).map((agentId) => ({
    agentId,
    title: AGENT_WINDOW_DATA[agentId].name,
    status: RUN_STATUS_TO_UI[agentRunStatuses[agentId]],
    isActive: activeWindowId === agentId,
    isMinimized: windows[agentId].isMinimized,
  }));

  const handleSelectTaskbarWindow = (agentId: AgentId) => {
    if (windows[agentId].isMinimized) {
      restoreWindow(agentId);
      return;
    }

    focusWindow(agentId);
  };

  const handleOpenAgent = (agentId: AgentId) => {
    openWindow(agentId);
    useScenarioStore.getState().setActiveAgent(agentId);
  };

  const handleReturnHome = () => {
    closeAllWindows();
    setIsHelpOpen(false);
    setIsDebugPanelOpen(false);
  };

  const handleTerminateScene = () => {
    resetToNormal();
    forceScenarioIdle();
    clearScenarioThinking();
  };

  const handleTriggerIncident = (incidentType: Parameters<typeof triggerSimulationIncident>[0]) => {
    if (useScenarioStore.getState().phase !== ScenarioPhase.IDLE || simulation.active) return;

    triggerSimulationIncident(incidentType);
  };

  const handleDemoNormal = () => {
    resetToNormal();
    forceScenarioIdle();
    clearScenarioThinking();
    clearNotifications();
    useSystemStore.getState().clearEvents();
    setDemoState('normal');
  };

  const handleDemoAbnormal = () => {
    if (simulation.active) return;
    setDemoState('abnormal');
    triggerSimulationIncident('dosing_abnormal');
  };

  const handleDemoRecovered = () => {
    const snapshot = DEMO_SNAPSHOTS.recovered;
    resetToNormal();
    setTelemetry((prev) => ({ ...prev, ...snapshot.telemetry }));
    forceScenarioIdle();
    clearScenarioThinking();
    useSystemStore.getState().clearEvents();
    snapshot.events.forEach((evt) => {
      pushEvent({ ...evt, time: evt.time || getTimestamp() });
    });
    if (snapshot.notification) {
      pushNotification({ ...snapshot.notification, time: getTimestamp() });
    }
    setDemoState('recovered');
  };

  const handleAutoDemo = () => {
    if (simulation.active) return;
    setDemoState('abnormal');
    autoDemo.startAutoDemo();
  };

  useKeyboard({
    phase,
    isHelpOpen,
    isSceneRunning: simulation.active,
    hasNotifications: notifications.length > 0,
    activeWindowId,
    onTriggerIncident: handleTriggerIncident,
    onTerminateScene: handleTerminateScene,
    onToggleHelp: () => setIsHelpOpen((value) => !value),
    onCloseHelp: () => setIsHelpOpen(false),
    onToggleDebugPanel: () => setIsDebugPanelOpen((value) => !value),
    onReturnHome: handleReturnHome,
    onClearNotifications: clearNotifications,
    onMinimizeWindow: minimizeWindow,
    onCycleWindow: cycleWindow,
  });

  usePhaseEffects({
    onPulsingAgentChange: setPulsingAgentId,
    onInfoPanelAgentSwitch: () => {},
    onWindowStatusText: setWindowStatusText,
  });

  useEffect(() => {
    if (!simulation.active || !simulation.type) {
      lastIncidentRef.current = null;
      lastEventStepRef.current = null;
      clearScenarioThinking();
      forceScenarioIdle();
      return;
    }

    if (lastIncidentRef.current === simulation.type) return;

    const targetAgent = INCIDENT_TO_AGENT[simulation.type];
    lastIncidentRef.current = simulation.type;
    startScenarioIncident(simulation.type);
    pushEvent({
      time: getTimestamp(),
      text: `${AGENT_WINDOW_DATA[targetAgent].name}检测到异常，监管智能体接入分析。`,
      type: 'warning',
    });
    pushNotification({
      title: '系统异常告警',
      description: `${AGENT_WINDOW_DATA[targetAgent].name}检测到异常，点击打开对应 Agent 窗口。`,
      time: getTimestamp(),
      agentId: targetAgent,
      level: 'error',
      autoDismissMs: 5000,
    });
  }, [
    clearScenarioThinking,
    forceScenarioIdle,
    pushEvent,
    pushNotification,
    simulation.active,
    simulation.type,
    startScenarioIncident,
  ]);

  useEffect(() => {
    if (!simulation.active) return;

    const expectedPhase = STEP_TO_PHASE[simulation.step];
    if (expectedPhase && phase !== expectedPhase) {
      const currentPhase = useScenarioStore.getState().phase;
      if (
        currentPhase === ScenarioPhase.SUPERVISOR_ANALYZING ||
        currentPhase === ScenarioPhase.AGENT_ANALYZING
      ) {
        return;
      }
      let guard = 0;
      while (useScenarioStore.getState().phase !== expectedPhase && guard < 8) {
        const p = useScenarioStore.getState().phase;
        if (p === ScenarioPhase.SUPERVISOR_ANALYZING || p === ScenarioPhase.AGENT_ANALYZING) {
          break;
        }
        advanceScenarioPhase();
        guard += 1;
      }
    }

    if (simulation.step !== lastEventStepRef.current && simulation.step > 0) {
      lastEventStepRef.current = simulation.step;
      pushEvent({
        time: getTimestamp(),
        text: simulation.title,
        type: simulation.step === 8 ? 'success' : 'info',
      });

      if (simulation.step === 8 && simulation.type) {
        const targetAgent = INCIDENT_TO_AGENT[simulation.type];
        pushNotification({
          title: '异常已恢复',
          description: `${AGENT_WINDOW_DATA[targetAgent].name}处置完成，系统恢复稳定巡检。`,
          time: getTimestamp(),
          agentId: targetAgent,
          level: 'success',
          autoDismissMs: 2000,
        });
        window.setTimeout(() => useScenarioStore.getState().forceIdle(), 2000);
      }
    }
  }, [
    advanceScenarioPhase,
    phase,
    pushEvent,
    pushNotification,
    simulation.active,
    simulation.description,
    simulation.step,
    simulation.title,
    simulation.type,
  ]);

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

      <main className="relative z-10 flex min-h-0 flex-1 flex-col p-4" id="main-control-board">
        <div className="grid min-h-0 flex-1 grid-cols-[72px_minmax(0,1fr)_300px] gap-4">
          <aside className="flex min-h-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/75">
            <Dock agents={dockAgents} pulsingAgentId={pulsingAgentId} onOpenAgent={handleOpenAgent} />
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between px-1" id="tab-nav">
              <div className="flex space-x-1.5 rounded-lg border border-slate-800/80 bg-slate-950/80 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('model')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeTab === 'model'
                      ? 'border border-teal-500/40 bg-teal-500/15 text-teal-300 shadow-lg shadow-teal-500/5'
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                  id="tab-view-model"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>智能水厂 3D 数字孪生视图</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('simulation_studio')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeTab === 'simulation_studio'
                      ? 'border border-teal-500/40 bg-teal-500/15 text-teal-300 shadow-lg shadow-teal-500/5'
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                  id="tab-view-simulator"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>精细化参数控制面板</span>
                </button>
              </div>

              <div className="hidden items-center gap-4 text-xs font-mono text-slate-400 lg:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-blue-500 bg-blue-500/20" />
                  安全供水
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-emerald-500 bg-emerald-500/20" />
                  优化分析中
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-yellow-500 bg-yellow-500/20" />
                  异常决策流
                </span>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
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
                closeAgentCard={closeAgentCard}
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

          </section>

          <InfoPanel
            currentAgent={currentAgent}
            thinking={thinking}
            decisionSteps={decisionSteps}
            events={eventLog}
            className="min-h-0 rounded-lg border border-slate-800"
          />
        </div>

        <AnimatePresence>
          {AGENT_ORDER.map((agentId) => {
            const windowState = windows[agentId];
            const agent = AGENT_WINDOW_DATA[agentId];
            if (!windowState.isOpen) return null;

            return (
              <AgentWindow
                key={agentId}
                agentId={agentId}
                title={agent.name}
                status={agentUIStatus}
                role={agent.role}
                metrics={agent.metrics}
                footerText={windowStatusText || (windowState.isMinimized ? '已最小化' : '等待分析 · 决策链同步')}
                isActive={activeWindowId === agentId}
                isMinimized={windowState.isMinimized}
                position={windowState.position}
                size={windowState.size}
                zIndex={windowState.zIndex}
                onFocus={focusWindow}
                onMinimize={minimizeWindow}
                onClose={closeWindow}
                onMove={moveWindow}
                onResize={resizeWindow}
              />
            );
          })}
        </AnimatePresence>

        {isDebugPanelOpen ? (
          <section className="absolute bottom-20 right-84 z-40 w-72 rounded-lg border border-cyan-500/40 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-cyan-200">调试面板</h2>
              <button
                type="button"
                onClick={() => setIsDebugPanelOpen(false)}
                className="h-7 w-7 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                aria-label="关闭调试面板"
              >
                x
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-[88px_1fr] gap-2">
              <dt className="text-slate-500">Phase</dt>
              <dd className="font-mono text-slate-200">{phase}</dd>
              <dt className="text-slate-500">Active</dt>
              <dd>{activeWindowId ? AGENT_WINDOW_DATA[activeWindowId].name : '无窗口'}</dd>
              <dt className="text-slate-500">Scene</dt>
              <dd>{simulation.active ? simulation.title : '空闲'}</dd>
            </dl>
          </section>
        ) : null}

        <DemoControlPanel
          isSimulationActive={simulation.active}
          simulationStep={simulation.step}
          totalSteps={8}
          simulationTitle={simulation.title}
          autoDemoStatus={autoDemo.status}
          onStartAutoDemo={(scenarioId) => {
            setDemoState('abnormal');
            autoDemo.startAutoDemo(scenarioId);
          }}
          onPauseAutoDemo={autoDemo.pause}
          onResumeAutoDemo={autoDemo.resume}
          onStopAutoDemo={() => {
            autoDemo.stop();
            setDemoState('normal');
          }}
          onTriggerManual={(scenarioId) => {
            if (simulation.active) return;
            setDemoState('abnormal');
            triggerSimulationIncident(scenarioId);
            setTimeout(() => setIsPlaying(false), 500);
          }}
          onNextStep={() => {
            if (simulation.active && simulation.step < 8) {
              runStepChange(simulation.step + 1);
            }
          }}
          onReset={handleDemoNormal}
          onSpeedChange={setDemoSpeed}
          currentSpeed={demoSpeed}
        />

        <Taskbar
          windows={taskbarWindows}
          notificationCount={notifications.length}
          currentTime={currentTime}
          onHome={handleReturnHome}
          onSelectWindow={handleSelectTaskbarWindow}
          onOpenNotifications={() => undefined}
          className="mt-3 rounded-lg border border-slate-800"
        />
      </main>
      <HelpOverlay isOpen={isHelpOpen} shortcuts={KEYBOARD_SHORTCUTS} onClose={() => setIsHelpOpen(false)} />
      <Notification notifications={notifications} onDismiss={dismissNotification} onOpenAgent={handleOpenAgent} />
    </>
  );
}
