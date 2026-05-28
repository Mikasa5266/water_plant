import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DemoState } from '../../data/demoSnapshots';

export interface DemoControlPanelProps {
  currentState: DemoState;
  isSimulationActive: boolean;
  onTriggerAbnormal: () => void;
  onResetNormal: () => void;
  onApplyRecovered: () => void;
  onAutoDemo: () => void;
}

export function DemoControlPanel({
  currentState,
  isSimulationActive,
  onTriggerAbnormal,
  onResetNormal,
  onApplyRecovered,
  onAutoDemo,
}: DemoControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-20 left-6 z-40 flex items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-950/95 px-4 py-2 text-xs font-semibold text-cyan-300 shadow-lg backdrop-blur transition-colors hover:bg-slate-900"
      >
        <Play className="h-3.5 w-3.5" />
        演示控制
        <ChevronUp className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-6 z-40 w-64 rounded-lg border border-cyan-500/30 bg-slate-950/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <h3 className="text-xs font-semibold tracking-wide text-cyan-200">演示控制</h3>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          aria-label="折叠面板"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${
            currentState === 'normal' ? 'bg-emerald-400' :
            currentState === 'abnormal' ? 'bg-rose-400' : 'bg-teal-400'
          }`} />
          {currentState === 'normal' && '系统正常运行中'}
          {currentState === 'abnormal' && '异常场景进行中'}
          {currentState === 'recovered' && '恢复完成'}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onResetNormal}
            className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] font-medium transition-colors ${
              currentState === 'normal'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            正常
          </button>

          <button
            type="button"
            onClick={onTriggerAbnormal}
            disabled={isSimulationActive}
            className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] font-medium transition-colors ${
              currentState === 'abnormal'
                ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            异常
          </button>

          <button
            type="button"
            onClick={onApplyRecovered}
            className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] font-medium transition-colors ${
              currentState === 'recovered'
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            恢复
          </button>
        </div>

        <button
          type="button"
          onClick={onAutoDemo}
          disabled={isSimulationActive}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-[11px] font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5" />
          自动演示（加药异常全流程）
        </button>
      </div>
    </div>
  );
}
