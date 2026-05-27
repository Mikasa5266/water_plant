import React from 'react';
import { Play, Pause, Zap, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { AnomalySimulation } from '../types';

interface BottomTimelineProps {
  simulation: AnomalySimulation;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSimulationIncident: (incidentType: 'dosing_abnormal' | 'uf_clogging' | 'membrane_decay') => void;
  runStepChange: (targetStep: number) => void;
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  simulation,
  isPlaying,
  setIsPlaying,
  triggerSimulationIncident,
  runStepChange
}) => {
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
            onClick={() => triggerSimulationIncident('membrane_decay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simulation.active && simulation.type === 'membrane_decay'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="终端微膜泥沉淀极化，产水率下降处置"
            id="btn-incident-membrane"
          >
            膜组件通量衰减极化
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
            {[
              { step: 1, label: '异常触发', desc: '指标越线/突变' },
              { step: 2, label: '数据上送', desc: '参数包云传' },
              { step: 3, label: '总管分析', desc: '多维归因推断' },
              { step: 4, label: '派发任务', desc: '子智能层调度' },
              { step: 5, label: '方案生成', desc: '高精极值寻求' },
              { step: 6, label: '直接执行', desc: 'PLC状态写入' },
              { step: 7, label: '设备动作', desc: '变频变压到位' },
              { step: 8, label: '指标恢复', desc: '闭环水质恢复' }
            ].map((node) => {
              const isActive = simulation.active && simulation.step === node.step;
              const isPassed = simulation.active && simulation.step > node.step;
              
              // Node Color variables
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
                  {/* Interactive Step item */}
                  <div 
                    onClick={() => {
                      if (simulation.active) {
                        runStepChange(node.step);
                      }
                    }}
                    className={`flex-1 flex flex-col items-center p-2 rounded-xl border border-transparent transition-all select-none ${
                      simulation.active ? 'cursor-pointer hover:border-slate-800/60 hover:bg-slate-900/30' : ''
                    } ${glowPill}`}
                  >
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[11px] transition-all duration-300 ${circleStyle}`}>
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : node.step}
                    </div>
                    <span className={`text-xs mt-1.5 text-center leading-tight tracking-wider ${textStyle}`}>
                      {node.label}
                    </span>
                    <span className="text-[9px] text-slate-500 text-center scale-90 mt-0.5 leading-none block">
                      {node.desc}
                    </span>
                  </div>
                  
                  {node.step < 8 && (
                    <div className="flex items-center" id={`timeline-connector-${node.step}`}>
                      <ChevronRight className={`w-3.5 h-3.5 ${isPassed ? 'text-teal-500/40' : 'text-slate-800'}`} />
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
