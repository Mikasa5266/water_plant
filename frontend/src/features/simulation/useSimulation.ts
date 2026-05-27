import React, { useState, useEffect, useRef } from 'react';
import type { AgentId, AgentLog, TelemetryState, AnomalySimulation, ActiveAnimation, CardState } from '../../types';
import { getTimestamp } from '../../utils/format';
import { getScenarioMeta, type ScenarioType } from './simulationScripts';
import { applyDosingStep, applyUfStep, applyMembraneStep } from './stepAppliers';

interface UseSimulationDeps {
  animationTickRef: React.RefObject<number>;
  animationTick: number;
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  agentStatuses: Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>;
  setAgentStatuses: React.Dispatch<React.SetStateAction<Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>>>;
  agentLogs: Record<AgentId, AgentLog[]>;
  setAgentLogs: React.Dispatch<React.SetStateAction<Record<AgentId, AgentLog[]>>>;
  setCards: React.Dispatch<React.SetStateAction<Record<AgentId, CardState>>>;
}

export function useSimulation(deps: UseSimulationDeps) {
  const {
    animationTickRef, animationTick,
    telemetry, setTelemetry,
    agentStatuses, setAgentStatuses,
    agentLogs, setAgentLogs,
    setCards
  } = deps;

  const [simulation, setSimulation] = useState<AnomalySimulation>({
    active: false,
    type: null,
    step: 0,
    title: '系统状态良好',
    description: '全厂工艺链路平稳。四大子智能体协同巡检中。',
    logs: [
      '系统在线自检测完成，网络波动 < 5ms',
      '监管总管智能体完成例行拓扑评估，未见工艺指标偏倚'
    ]
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAnim, setActiveAnim] = useState<ActiveAnimation | null>(null);

  const simulationRef = useRef(simulation);
  const telemetryRef = useRef(telemetry);
  const agentStatusesRef = useRef(agentStatuses);
  const agentLogsRef = useRef(agentLogs);

  useEffect(() => { simulationRef.current = simulation; }, [simulation]);
  useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);
  useEffect(() => { agentStatusesRef.current = agentStatuses; }, [agentStatuses]);
  useEffect(() => { agentLogsRef.current = agentLogs; }, [agentLogs]);

  const getActiveAgentForStep = (type: ScenarioType | null, step: number): AgentId => {
    if (!type) return 'master';
    if (step === 3 || step === 4) return 'master';
    if (type === 'dosing_abnormal') return 'dosing';
    if (type === 'uf_clogging') return 'uf';
    if (type === 'membrane_decay') return 'membrane';
    return 'master';
  };

  const triggerCalibrationAnimation = (agentId: AgentId) => {
    setActiveAnim({
      agentId,
      type: 'manual_calibration',
      startTick: animationTickRef.current,
      duration: 120
    });
  };

  const executeActualCalibration = (agentId: AgentId) => {
    const stamp = getTimestamp();
    setAgentLogs(prev => ({
      ...prev,
      [agentId]: [
        { id: `man_success_${Math.random()}`, time: stamp, message: '✓【协同回传】自省扫频成功！动作写入PLC，阀门回归稳态参数开度。', type: 'success' },
        { id: `man_${Math.random()}`, time: stamp, message: '手动触发工艺单元自适应标定扫频。', type: 'info' },
        ...prev[agentId]
      ]
    }));
    setTelemetry(prev => {
      const copy = { ...prev };
      if (agentId === 'dosing') { copy.dosingRate = 4.8; copy.chemicalLevel = Math.min(copy.chemicalLevel + 5, 100); }
      else if (agentId === 'uf') { copy.ufPressure = 82; }
      else if (agentId === 'membrane') { copy.membraneFlux = 75.2; }
      else if (agentId === 'master') { copy.healthScore = 98; copy.onlineRate = 99.5; }
      return copy;
    });
    setAgentStatuses(prev => ({ ...prev, [agentId]: 'processing' }));
    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'monitoring' }));
    }, 1500);
  };

  const runStepChange = (targetStep: number) => {
    const sim = simulationRef.current;
    if (!sim.active || !sim.type) return;
    const leadingAgent = getActiveAgentForStep(sim.type, targetStep);
    setActiveAnim({
      agentId: leadingAgent,
      type: 'step_transition',
      targetStep,
      startTick: animationTickRef.current,
      duration: 120
    });
  };

  const executeActualStepChange = (targetStep: number) => {
    const sim = simulationRef.current;
    if (!sim.active || !sim.type) return;

    let payloadLogs: string[] = [...sim.logs];
    let stepTitle = '';
    let stepDesc = '';
    let t = { ...telemetryRef.current };
    let aStatuses = { ...agentStatusesRef.current };
    let aLogs = { ...agentLogsRef.current };
    const stamp = getTimestamp();

    if (sim.type === 'dosing_abnormal') {
      applyDosingStep(targetStep, stamp, t, aStatuses, aLogs, payloadLogs, s => { stepTitle = s; }, s => { stepDesc = s; }, p => { payloadLogs = p; });
    } else if (sim.type === 'uf_clogging') {
      applyUfStep(targetStep, stamp, t, aStatuses, aLogs, payloadLogs, s => { stepTitle = s; }, s => { stepDesc = s; }, p => { payloadLogs = p; });
    } else if (sim.type === 'membrane_decay') {
      applyMembraneStep(targetStep, stamp, t, aStatuses, aLogs, payloadLogs, s => { stepTitle = s; }, s => { stepDesc = s; }, p => { payloadLogs = p; });
    }

    if (targetStep === 8) setIsPlaying(false);

    setTelemetry(t);
    setAgentStatuses(aStatuses);
    setAgentLogs(aLogs);
    setSimulation(prev => ({
      ...prev,
      step: targetStep,
      title: stepTitle,
      description: stepDesc,
      logs: payloadLogs
    }));
  };

  // Animation completion detection
  useEffect(() => {
    if (!activeAnim) return;
    const elapsed = animationTick - activeAnim.startTick;
    if (elapsed >= activeAnim.duration || elapsed < 0) {
      const { type, targetStep, agentId } = activeAnim;
      setActiveAnim(null);
      if (type === 'step_transition' && targetStep !== undefined) {
        executeActualStepChange(targetStep);
      } else if (type === 'manual_calibration') {
        executeActualCalibration(agentId);
      }
    }
  }, [animationTick, activeAnim]);

  // Auto playback
  useEffect(() => {
    let interval: any;
    if (isPlaying && simulation.active) {
      interval = setInterval(() => {
        if (simulationRef.current.step < 8) {
          runStepChange(simulationRef.current.step + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulation.active]);

  const triggerSimulationIncident = (incidentType: ScenarioType) => {
    const meta = getScenarioMeta(incidentType);
    setSimulation({
      active: true,
      type: incidentType,
      step: 0,
      title: meta.title,
      description: meta.detail,
      logs: [`[场景激发] 仿真操作注入: ${meta.title}`]
    });
    setTimeout(() => {
      runStepChange(1);
      setIsPlaying(true);
    }, 400);
  };

  const resetToNormal = () => {
    setIsPlaying(false);
    setActiveAnim(null);
    setTelemetry({
      inletFlow: 1240, outletFlow: 1210,
      inletTurbidity: 18.5, outletTurbidity: 0.04,
      dosingRate: 4.8, chemicalLevel: 72,
      ufPressure: 82, membraneFlux: 75.2,
      energyConsumption: 0.22, healthScore: 98,
      activeAgentsCount: 4, onlineRate: 99.2
    });
    setAgentStatuses({ master: 'monitoring', dosing: 'monitoring', uf: 'monitoring', membrane: 'monitoring' });
    setSimulation({
      active: false, type: null, step: 0,
      title: '系统状态良好',
      description: '全厂工艺链路平稳。四大子智能体协同巡检中。',
      logs: ['系统运行自检完毕：通信链路畅通，分布式控制响应 < 5ms。', '全系统多点监测参数已锚定，运行状态已同步。']
    });
    setCards({
      master: { x: 50, y: 15, isOpen: false, zIndex: 10 },
      dosing: { x: 12, y: 38, isOpen: false, zIndex: 10 },
      uf: { x: 35, y: 55, isOpen: false, zIndex: 10 },
      membrane: { x: 62, y: 38, isOpen: false, zIndex: 10 }
    });
  };

  return {
    simulation,
    isPlaying,
    setIsPlaying,
    activeAnim,
    runStepChange,
    triggerSimulationIncident,
    resetToNormal,
    triggerCalibrationAnimation
  };
}
