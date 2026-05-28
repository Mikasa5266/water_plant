import React, { useState } from 'react';
import { Play, Pause, Zap, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { AnomalySimulation, IncidentType } from '../types/index';

const TIMELINE_NODES = [
  { step: 1, label: '异常触发', desc: '指标越线/突变', detail: '传感器检测到工艺参数偏离正常范围，系统自动标记异常事件并生成告警' },
  { step: 2, label: '数据上送', desc: '参数包云传', detail: '异常数据包经边缘网关加密上送至云端AI决策引擎，延迟<50ms' },
  { step: 3, label: '总管分析', desc: '多维归因推断', detail: '监管总管Agent综合历史数据、关联参数进行多维度根因分析' },
  { step: 4, label: '派发任务', desc: '子智能层调度', detail: '总管将处置任务分派给对应工艺段的专业子Agent执行' },
  { step: 5, label: '方案生成', desc: '高精极值寻求', detail: '子Agent基于工艺模型生成最优调控方案，计算置信度与风险评估' },
  { step: 6, label: '直接执行', desc: 'PLC状态写入', detail: '经安全校验后，控制指令下发至PLC/DCS，写入设备运行参数' },
  { step: 7, label: '设备动作', desc: '变频变压到位', detail: '执行机构响应指令，变频器/阀门/泵组完成物理状态切换' },
  { step: 8, label: '指标恢复', desc: '闭环水质恢复', detail: '持续监测确认工艺参数回归正常区间，闭环验证处置效果' },
] as const;

interface BottomTimelineProps {
  simulation: AnomalySimulation;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSimulationIncident: (incidentType: IncidentType) => void;
  runStepChange: (targetStep: number) => void;
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  simulation,
  isPlaying,
  setIsPlaying,
  triggerSimulationIncident,
  runStepChange
}) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const activeNode = TIMELINE_NODES.find(n => n.step === simulation.step);

  return (
    <div 
      className="mt-4 bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 relative"
      id="collaborative-pipeline-panel"
    >
      
      {/* Headline Controls of simulation scenarios */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              多智能体工艺联动自治演练沙盘
            </h3>
            <p className="text-[11px] text-slate-400 leading-none mt-1">
              选择并注入常见工艺异常事件，观看监管总管协同子智能体进行8个逻辑闭环节点的联合推导：
            </p>
          </div>
        </div>

        {/* Selector buttons of preset simulations */}
        <div className="flex flex-wrap items-center gap-2 mr-2">
          <button
            onClick={() => triggerSimulationIncident('dosing_abnormal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulation.active && simulation.type === 'dosing_abnormal'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="触发原水浑浊高，加药高耗优化自调整"
            id="btn-incident-dosing"
          >
            加药浓度异常恢复
          </button>
          <button
            onClick={() => triggerSimulationIncident('uf_clogging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulation.active && simulation.type === 'uf_clogging'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="触发跨膜压阻突然上升，自反清洗控制"
            id="btn-incident-uf"
          >
            超滤通道堵塞自校正
          </button>
          <button
            onClick={() => triggerSimulationIncident('ro_fouling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulation.active && simulation.type === 'ro_fouling'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="终端微膜泥沉淀极化，产水率下降处置"
            id="btn-incident-ro"
          >
            膜组件通量衰减极化
          </button>
          <button
            onClick={() => triggerSimulationIncident('pump_overload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulation.active && simulation.type === 'pump_overload'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="触发泵组电流过载，演示降载与备用泵协同接管"
            id="btn-incident-pump"
          >
            泵组过载协同处置
          </button>
        </div>

        {/* Control playback keys */}
        {simulation.active && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 px-2 text-xs font-semibold flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800/60 rounded cursor-pointer"
              title={isPlaying ? '暂停自动化步进' : '开启自动化每步演示'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>暂停演练</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>自动演示</span>
                </>
              )}
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => {
                if (simulation.step > 1) {
                  runStepChange(simulation.step - 1);
                }
              }}
              disabled={simulation.step <= 1}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              上一步
            </button>
            <button
              onClick={() => {
                if (simulation.step < 8) {
                  runStepChange(simulation.step + 1);
                }
              }}
              disabled={simulation.step >= 8}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              下一步
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 items-center">
        
        {/* The 8 node stages timeline representation */}
        <div className="col-span-12 lg:col-span-8 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 min-w-[640px] py-2 px-1">
            {TIMELINE_NODES.map((node) => {
              const isActive = simulation.active && simulation.step === node.step;
              const isPassed = simulation.active && simulation.step > node.step;
              const isHovered = hoveredStep === node.step;

              let circleStyle = 'border-slate-800 bg-slate-900/50 text-slate-500';
              let textStyle = 'text-slate-500';
              let glowPill = '';

              if (isActive) {
                circleStyle = 'border-amber-500 bg-amber-500/20 text-neutral-50 scale-110 shadow-lg ring-4 ring-amber-500/10 font-bold';
                textStyle = 'text-slate-100 font-bold';
                glowPill = 'bg-amber-500/10 border-amber-500/20';
              } else if (isPassed) {
                circleStyle = 'border-teal-500 bg-teal-500/10 text-teal-400 font-bold';
                textStyle = 'text-teal-400';
              }

              return (
                <React.Fragment key={node.step}>
                  <div
                    onClick={() => {
                      if (simulation.active) {
                        runStepChange(node.step);
                      }
                    }}
                    onMouseEnter={() => setHoveredStep(node.step)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={`relative flex-1 flex flex-col items-center p-2 rounded-xl border border-transparent transition-all select-none ${
                      simulation.active ? 'cursor-pointer hover:border-slate-800/60 hover:bg-slate-900/30' : ''
                    } ${glowPill}`}
                  >
                    <div className={`relative w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[11px] transition-all duration-300 ${circleStyle}`}>
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : node.step}
                      {isActive && (
                        <span className="absolute inset-0 rounded-lg border-2 border-amber-400/60 animate-ping" />
                      )}
                    </div>
                    <span className={`text-xs mt-1.5 text-center leading-tight tracking-wider ${textStyle}`}>
                      {node.label}
                    </span>
                    <span className="text-[9px] text-slate-500 text-center scale-90 mt-0.5 leading-none block">
                      {node.desc}
                    </span>

                    {isHovered && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-48 rounded-lg border border-slate-700 bg-slate-900/95 p-2 text-[11px] text-slate-300 leading-relaxed shadow-lg backdrop-blur-sm pointer-events-none">
                        <p className="font-semibold text-slate-100 mb-1">{node.label}</p>
                        <p>{node.detail}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 border-r border-b border-slate-700" />
                      </div>
                    )}
                  </div>

                  {node.step < 8 && (
                    <div className="flex items-center" id={`timeline-connector-${node.step}`}>
                      <ChevronRight className={`w-3.5 h-3.5 transition-colors duration-500 ${
                        isPassed ? 'text-teal-400' : isActive ? 'text-amber-500/60' : 'text-slate-800'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Dynamic log/description summary txt */}
        <div className="col-span-12 lg:col-span-4 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-3 lg:pt-0">
          <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl min-h-[96px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                <span>决策链信息汇报:</span>
              </div>
              <p className="text-xs text-slate-100 mt-1 font-medium leading-relaxed">
                {simulation.description}
              </p>
              {simulation.active && activeNode && (
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed border-t border-slate-800/50 pt-2">
                  {activeNode.detail}
                </p>
              )}
            </div>
            {simulation.active && (
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-2 pt-2 border-t border-slate-900/50">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  时效评估: {simulation.step * 8 + 12}ms
                </span>
                <span>网络阻抗: 安全控制可信度 100%</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
