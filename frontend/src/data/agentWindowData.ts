import type { AgentId, AgentMeta } from '../types/index';

export const AGENT_WINDOW_DATA: Record<AgentId, AgentMeta> = {
  supervisor: {
    id: 'supervisor',
    name: '监管总管智能体',
    englishName: 'Supervisor',
    color: '#378ADD',
    role: '统一采集全厂运行态势，完成异常归因、任务派发和闭环决策编排。',
    metrics: [
      { key: 'alarmCount', label: '系统告警数', value: 3, unit: '条', normalRange: { min: 0, max: 5 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'productionLoad', label: '产水负荷', value: 81, unit: '%', normalRange: { min: 60, max: 100 }, alarmRule: 'lower', shiftDirection: 'down' },
      { key: 'health', label: '系统健康度', value: '良好', unit: '', normalRange: ['良好', '注意', '严重'], alarmRule: null, shiftDirection: 'down' },
      { key: 'onlineRate', label: '设备在线率', value: 99.2, unit: '%', normalRange: { min: 95 }, alarmRule: 'lower', shiftDirection: 'down' },
    ],
  },
  dosing: {
    id: 'dosing',
    name: '加药智能体',
    englishName: 'Dosing',
    color: '#BA7517',
    role: '跟踪原水浊度、药剂余量和泵频率，推演混凝投加与泵频修正策略。',
    metrics: [
      { key: 'doseFlow', label: '投加流量', value: 62.4, unit: 'L/h', normalRange: { min: 50, max: 80 }, alarmRule: 'both', shiftDirection: 'up' },
      { key: 'chemicalLevel', label: '药剂余量', value: 63, unit: '%', normalRange: { min: 20, max: 100 }, alarmRule: 'lower', shiftDirection: 'down' },
      { key: 'turbidity', label: '出水浊度', value: 1.4, unit: 'NTU', normalRange: { max: 2.5 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'pumpFrequency', label: '泵频率', value: 28.5, unit: 'Hz', normalRange: { min: 20, max: 35 }, alarmRule: 'upper', shiftDirection: 'up' },
    ],
  },
  uf: {
    id: 'uf',
    name: '超滤智能体',
    englishName: 'UF',
    color: '#1D9E75',
    role: '监测跨膜压差、产水流量和阀组状态，辅助反洗周期与阀组切换判断。',
    metrics: [
      { key: 'tmp', label: '跨膜压差', value: 0.45, unit: 'MPa', normalRange: { min: 0.3, max: 0.6 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'flow', label: '产水流量', value: 245, unit: 'm3/h', normalRange: { min: 200, max: 300 }, alarmRule: 'both', shiftDirection: 'down' },
      { key: 'valves', label: '阀组状态', value: '已就绪', unit: '', normalRange: ['已就绪', '待切换'], alarmRule: null },
      { key: 'recoveryTime', label: '恢复时间', value: 0, unit: 'min', normalRange: { min: 0, max: 8 }, alarmRule: 'upper' },
    ],
  },
  ro: {
    id: 'ro',
    name: '反渗透智能体',
    englishName: 'RO',
    color: '#D85A30',
    role: '分析膜压差、产水电导率和冲洗状态，判断膜组恢复与能效优化路径。',
    metrics: [
      { key: 'pressureDiff', label: '膜压差', value: 0.45, unit: 'MPa', normalRange: { min: 0.3, max: 0.6 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'conductivity', label: '产水电导率', value: 18, unit: 'us/cm', normalRange: { max: 30 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'flushMode', label: '冲洗模式', value: '已就绪', unit: '', normalRange: ['已就绪', '待激活'], alarmRule: null },
      { key: 'recoveryTime', label: '恢复时间', value: 0, unit: 'min', normalRange: { min: 0, max: 8 }, alarmRule: 'upper' },
    ],
  },
  pump: {
    id: 'pump',
    name: '泵组智能体',
    englishName: 'Pump',
    color: '#534AB7',
    role: '持续评估泵组转速、电流、温度和过载趋势，给出负载切换建议。',
    metrics: [
      { key: 'speed', label: '转速', value: 1480, unit: 'rpm', normalRange: { min: 1450, max: 1500 }, alarmRule: 'both', shiftDirection: 'up' },
      { key: 'current', label: '电流', value: 28, unit: 'A', normalRange: { min: 25, max: 35 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'temperature', label: '温度', value: 55, unit: 'degC', normalRange: { max: 65 }, alarmRule: 'upper', shiftDirection: 'up' },
      { key: 'runState', label: '运行状态', value: '正常', unit: '', normalRange: ['正常', '过载'], alarmRule: null },
    ],
  },
};

export const AGENT_ORDER: AgentId[] = ['supervisor', 'uf', 'ro', 'dosing', 'pump'];
