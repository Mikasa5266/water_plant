import type { AgentId, AgentData } from '../types';

export const INITIAL_AGENTS_DATA: Record<AgentId, Omit<AgentData, 'status' | 'logs'>> = {
  master: {
    id: 'master',
    name: '监督总管智能体',
    englishName: 'Master Supervisor Agent',
    role: '统一数据采集、异常归因分析、联合任务派发与闭环控制决策',
    x: 52,
    y: 19,
    desc: '全厂系统的神经中枢。协调各个子智能体运转，在发生异常时统筹决策并生成全自动/半自动协同处理方案。',
    capabilities: [
      '工艺全链归因诊断',
      '资源动态调度与派发',
      '多异常联动决策模型',
      '大模型自适应闭环验证'
    ],
    metrics: [
      { key: 'health', label: '协调健康度', value: 98, unit: '%', trend: 'stable' },
      { key: 'latency', label: '协同决策延迟', value: 120, unit: 'ms', trend: 'down' },
      { key: 'confidence', label: '诊断置信度', value: 99.4, unit: '%', trend: 'up' }
    ]
  },
  dosing: {
    id: 'dosing',
    name: '加药智能体',
    englishName: 'Dosing Optimization Agent',
    role: '原水分析、混凝加药控制、药耗动态优化与投加曲线修正',
    x: 34,
    y: 39,
    desc: '聚焦于水厂前段处理。基于原水浊度、pH值、瞬时流量，采用智能前馈-反馈控制模型，实现高精度加药投加。',
    capabilities: [
      '智能药耗预测引擎',
      'SS/浊度异常敏捷自适应',
      '泵机运行频率优化',
      '阀门投加比例高精度调校'
    ],
    metrics: [
      { key: 'dosing_accuracy', label: '加药稳态精度', value: 99.1, unit: '%', trend: 'up' },
      { key: 'chemical_saving', label: '累计药剂节省', value: 12.4, unit: '%', trend: 'up' },
      { key: 'response_time', label: '工艺响应时延', value: 8, unit: 's', trend: 'stable' }
    ]
  },
  uf: {
    id: 'uf',
    name: '超滤智能体',
    englishName: 'Ultrafiltration Monitor Agent',
    role: '跨膜压差(TMP)监测、反洗控制推演与阀组联动节能优化',
    x: 48,
    y: 71,
    desc: '全面监管超滤高压系统的安全与效能。实时分析压差阻力突变，自适应调整反冲洗周期，抑制滤膜污堵。',
    capabilities: [
      '跨膜压差(TMP)多点测定',
      '自适应反洗方案反推',
      '气水混合清洗协同',
      '滤阻发展建模预警'
    ],
    metrics: [
      { key: 'tmp', label: '跨膜压差 (TMP)', value: 85, unit: 'kPa', trend: 'stable' },
      { key: 'recovery_rate', label: '超滤回收率', value: 94.8, unit: '%', trend: 'stable' },
      { key: 'wash_cycle', label: '反水冲洗间隔', value: 120, unit: 'min', trend: 'up' }
    ]
  },
  membrane: {
    id: 'membrane',
    name: '膜智能体',
    englishName: 'Membrane Filtration Agent',
    role: '膜区产水质量监管、冲洗状态恢复判定与能耗自适应管理',
    x: 73,
    y: 43,
    desc: '管理终端高精过滤膜区。把控出水浊度、微生物屏障级别，结合变频泵耗损，自适应匹配恒流量产水能效策略。',
    capabilities: [
      '膜通量衰减建模',
      '精细化产水量动态匹配',
      '清洗状态终点识别',
      '单体能效(kW/m³)优化'
    ],
    metrics: [
      { key: 'flux', label: '产水通量', value: 75.2, unit: 'LMH', trend: 'stable' },
      { key: 'turbidity_out', label: '膜过滤后浊度', value: 0.08, unit: 'NTU', trend: 'down' },
      { key: 'energy_efficiency', label: '单吨产水能耗', value: 0.18, unit: 'kWh/m³', trend: 'down' }
    ]
  }
};
