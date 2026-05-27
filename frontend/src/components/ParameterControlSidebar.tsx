import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { TelemetryState } from '../types';

interface ParameterControlSidebarProps {
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
  resetToNormal: () => void;
}

export const ParameterControlSidebar: React.FC<ParameterControlSidebarProps> = ({
  telemetry,
  setTelemetry,
  resetToNormal
}) => {
  return (
    <aside 
      className="col-span-12 lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col min-h-0"
      id="engineering-studio-panel"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-teal-400" />
          智能水耗运行参数微调
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          调整以下底层反应量，可实时反映并在上部智能体控制卡中呈现工况反馈环流。
        </p>
      </div>

      {/* Dynamic knobs/sliders */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">原水池瞬时进水流量</span>
            <span className="text-teal-400 font-mono font-bold">{telemetry.inletFlow} m³/h</span>
          </div>
          <input 
            type="range" 
            min="500" 
            max="2200" 
            step="10"
            value={telemetry.inletFlow} 
            onChange={(e) => {
              const updatedFlow = parseInt(e.target.value);
              setTelemetry(prev => ({ 
                ...prev, 
                inletFlow: updatedFlow,
                outletFlow: Math.round(updatedFlow * 0.975) 
              }));
            }}
            className="w-full h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">源头原水进水浑浊度 (NTU)</span>
            <span className="text-teal-400 font-mono font-bold">{telemetry.inletTurbidity} NTU</span>
          </div>
          <input 
            type="range" 
            min="10.0" 
            max="120.0" 
            step="0.5"
            value={telemetry.inletTurbidity} 
            onChange={(e) => {
              const updatedTurb = parseFloat(e.target.value);
              setTelemetry(prev => ({ 
                ...prev, 
                inletTurbidity: updatedTurb,
                outletTurbidity: Math.max(0.01, parseFloat((updatedTurb * 0.002).toFixed(3)))
              }));
            }}
            className="w-full h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">混凝池加药投加速度</span>
            <span className="text-teal-400 font-mono font-bold">{telemetry.dosingRate} mg/L</span>
          </div>
          <input 
            type="range" 
            min="1.0" 
            max="10.0" 
            step="0.1"
            value={telemetry.dosingRate} 
            onChange={(e) => {
              const updatedDosing = parseFloat(e.target.value);
              setTelemetry(prev => ({ 
                ...prev, 
                dosingRate: updatedDosing,
                // High dosing or low dosing affects water health score
                healthScore: updatedDosing > 7.5 || updatedDosing < 3.2 ? 88 : 98
              }));
            }}
            className="w-full h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">跨膜反水阻力压差</span>
            <span className="text-teal-400 font-mono font-bold">{telemetry.ufPressure} kPa</span>
          </div>
          <input 
            type="range" 
            min="50" 
            max="300" 
            step="2"
            value={telemetry.ufPressure} 
            onChange={(e) => {
              const updatedPres = parseInt(e.target.value);
              setTelemetry(prev => ({ 
                ...prev, 
                ufPressure: updatedPres,
                energyConsumption: parseFloat((0.15 + (updatedPres / 800)).toFixed(3))
              }));
            }}
            className="w-full h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">精滤高精膜瞬时通量</span>
            <span className="text-teal-400 font-mono font-bold">{telemetry.roFlux} LMH</span>
          </div>
          <input 
            type="range" 
            min="30.0" 
            max="110.0" 
            step="0.5"
            value={telemetry.roFlux} 
            onChange={(e) => {
              const updatedFlux = parseFloat(e.target.value);
              setTelemetry(prev => ({ 
                ...prev, 
                roFlux: updatedFlux,
                outletFlow: Math.round(updatedFlux * 16.2)
              }));
            }}
            className="w-full h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
          />
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">💡 模拟反馈联动：</p>
          <p>1. 改变“原水进水浑浊度”，会间接影响“混凝加药量”的匹配难度。</p>
          <p>2. 越高的“跨膜压流阻压差”，表明超滤柱内泥沙及胶体堵塞情况加剧，会引发单吨耗电能耗指标相应上升。</p>
        </div>

      </div>

      {/* Reset inside sliders */}
      <button 
        onClick={resetToNormal}
        className="w-full py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium text-xs hover:bg-teal-500/20 transition-all cursor-pointer"
        id="btn-sidebar-reset"
      >
        还原出厂额定工况
      </button>
    </aside>
  );
};
