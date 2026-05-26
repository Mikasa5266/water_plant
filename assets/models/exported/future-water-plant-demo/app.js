(function () {
  var dataModel;
  var graph3dView;
  var sceneNodes = {};
  var sceneLinks = {};
  var autoTimer = null;
  var flowTimer = null;
  var blinkTimer = null;
  var bubbleTimer = null;
  var activeScenarioId = 'dosing';
  var currentStepIndex = 0;
  var pendingConfirmation = null;
  var shouldAutoFocus = true;

  var TEXT = {
    supervisor: '监管总管智能体',
    dosing: '加药智能体',
    uf: '超滤智能体',
    ro: '膜智能体',
    loaded: '已加载，可演示。',
    done: '演示完成，可切换其他链路或继续自由操作。',
    confirmWait: '当前链路进入确认阶段，请点击左侧或右侧确认执行。',
    reset: '系统场景已重置。',
    init: '系统初始化完成，已加载未来水厂三维演示场景。',
    confirmTitleIdle: '暂无待确认操作',
    confirmDescIdle: '当场景涉及高危操作时，系统将在此处等待人工确认。',
    confirmTitleWait: '待确认高危操作',
    confirmTitleDone: '确认完成，准备执行',
    confirmDescDone: '系统已收到人工确认，进入设备动作阶段。',
    manualExecute: '已手动触发执行方案。',
    selectSupervisor: '监管总管智能体已选中，当前负责全局监控与派发。',
    riskFocus: '重点关注',
    riskGood: '良好'
  };

  var agents = [
    { id: 'supervisor', name: TEXT.supervisor, role: '统一采集、异常归因、任务派发、执行闭环', idle: '在线' },
    { id: 'dosing', name: TEXT.dosing, role: '药剂分析、投加控制、投加曲线优化', idle: '待命' },
    { id: 'uf', name: TEXT.uf, role: '压差监测、反洗推演、阀组联动', idle: '待命' },
    { id: 'ro', name: TEXT.ro, role: '膜区分析、冲洗执行、模式恢复', idle: '待命' }
  ];

  var scenarios = [
    {
      id: 'dosing',
      name: '加药异常处置',
      subtitle: '浓度偏差告警 -> 总管分析 -> 加药智能体调节投加',
      risk: 'low',
      moduleKey: 'dosing',
      abnormalMetric: '药剂浓度偏低 18%',
      metrics: [
        { label: '投加流量', value: '18.6 L/min' },
        { label: '药剂余量', value: '63%' },
        { label: '出水浊度', value: '1.4 NTU' },
        { label: '恢复时间', value: '2 分钟' }
      ],
      handoff: [
        { agent: TEXT.supervisor, title: '采集异常', desc: '采集浓度、流量、药箱余量，确认偏差超阈值。' },
        { agent: TEXT.supervisor, title: '根因归因', desc: '判断为投加不足，而不是传感器瞬时漂移。' },
        { agent: TEXT.dosing, title: '专项推演', desc: '计算补偿投加量、泵频率与阀门开度。' },
        { agent: TEXT.dosing, title: '执行闭环', desc: '联动加药泵与阀门，并把恢复结果回传总管。' }
      ],
      thinkingByStage: [
        {
          title: '监管总管智能体正在做异常甄别',
          summary: '当前先核验异常是否真实存在，再判断是药剂不足、泵效率下降还是投加节奏偏移。',
          points: ['对比最近 15 分钟浓度与浊度曲线', '校核药箱余量是否支持补偿投加', '确认是否需要专项智能体介入']
        },
        {
          title: '加药智能体正在生成投加方案',
          summary: '加药智能体根据当前流量、药剂余量和目标浊度推演投加策略，避免过冲。',
          points: ['提升加药泵频率至目标区间', '打开加药支路阀门', '跟踪出水浊度恢复曲线']
        },
        {
          title: '执行反馈正在回传监管总管智能体',
          summary: '加药执行完成后，系统会持续监测恢复效果，并把结果回传给总管完成闭环。',
          points: ['记录泵频率和阀门开度变化', '判断出水浊度是否回到安全区间', '形成异常处置结论']
        }
      ],
      feedback: [
        { stage: '执行中', title: '投加泵反馈', desc: '加药泵频率已提升至目标区间，当前运行稳定。' },
        { stage: '执行中', title: '阀门反馈', desc: '加药支路阀门已打开，投加流量正在提升。' },
        { stage: '恢复中', title: '指标反馈', desc: '出水浊度开始回落，浓度偏差正在收敛。' }
      ],
      planTitle: '加药量动态补偿与加药泵联动启停',
      planDescription: '系统建议提升加药泵频率并打开支路阀门，通过短时补偿投加恢复出水指标。',
      planPoints: [
        '提升加药泵频率至 56Hz，持续 90 秒',
        '打开加药支路阀门，增强投加流量',
        '监测出水浊度回落情况并回归常规模式'
      ],
      steps: [
        { title: '异常触发', desc: '加药区浓度偏差超阈值，模块发出告警闪烁。', agent: 'supervisor', action: 'alarm' },
        { title: '数据上送', desc: '浓度、流量、药箱余量等数据流向监管总管智能体。', agent: 'supervisor', action: 'upstream' },
        { title: '总管分析', desc: '总管智能体完成异常归因，确认需要加药智能体介入。', agent: 'supervisor', action: 'analyze' },
        { title: '派发任务', desc: '总管将任务派发给加药智能体，进入专项推演。', agent: 'dosing', action: 'dispatch' },
        { title: '方案生成', desc: '加药智能体完成配比推演并形成执行方案。', agent: 'dosing', action: 'plan' },
        { title: '直接执行', desc: '当前风险等级较低，系统自动执行操作。', agent: 'dosing', action: 'execute' },
        { title: '设备动作', desc: '加药泵提频、阀门打开、投加链路开始补偿。', agent: 'dosing', action: 'hardware' },
        { title: '指标恢复', desc: '出水浊度回稳，浓度偏差回归阈值以内。', agent: 'supervisor', action: 'recover' }
      ]
    },
    {
      id: 'uf',
      name: '超滤异常处置',
      subtitle: '压差异常告警 -> 总管分析 -> 超滤智能体切换反洗策略',
      risk: 'high',
      moduleKey: 'uf',
      abnormalMetric: '跨膜压差升高 26%',
      metrics: [
        { label: '跨膜压差', value: '0.29 MPa' },
        { label: '产水流量', value: '245 m3/h' },
        { label: '阀组状态', value: '待切换' },
        { label: '恢复时间', value: '5 分钟' }
      ],
      handoff: [
        { agent: TEXT.supervisor, title: '采集异常', desc: '采集跨膜压差、流量、阀组状态，确认超滤区风险升高。' },
        { agent: TEXT.supervisor, title: '风险分级', desc: '识别该链路涉及关键阀组联动，标记为高危。' },
        { agent: TEXT.uf, title: '专项推演', desc: '推演反洗持续时间、阀组切换次序与压差回落目标。' },
        { agent: TEXT.uf, title: '执行闭环', desc: '等待人工确认后，执行反洗与阀组切换并回传结果。' }
      ],
      thinkingByStage: [
        {
          title: '监管总管智能体正在做风险分级',
          summary: '总管智能体先确认压差异常是否持续，再判断是否触发关键阀组联动和高危确认流程。',
          points: ['核验压差是否持续超出安全阈值', '判断是否属于瞬时波动', '确认是否需要超滤智能体接管']
        },
        {
          title: '超滤智能体正在推演反洗策略',
          summary: '超滤智能体会推演反洗时长、阀组切换顺序和对主流程的影响，避免粗暴切换。',
          points: ['确定反洗持续时间', '计算阀组切换窗口', '评估压差回落速度']
        },
        {
          title: '执行反馈正在回传监管总管智能体',
          summary: '执行完成后，系统会回传阀组状态、反洗结果和压差恢复趋势，形成闭环反馈。',
          points: ['回传阀组切换结果', '监测跨膜压差回落情况', '确认产水是否稳定恢复']
        }
      ],
      feedback: [
        { stage: '执行中', title: '反洗泵反馈', desc: '反洗泵已启动，当前流量进入短时提升阶段。' },
        { stage: '执行中', title: '阀组反馈', desc: '关键阀组切换已完成，超滤模块开始反洗恢复。' },
        { stage: '恢复中', title: '压差反馈', desc: '跨膜压差开始回落，预计在目标窗口内恢复。' }
      ],
      planTitle: '超滤反洗联动与阀组切换执行',
      planDescription: '系统建议启动短时反洗并切换关键阀组，以尽快恢复跨膜压差和超滤产水稳定性。',
      planPoints: [
        '开启反洗泵并切换超滤阀组',
        '降低运行通量 8%，持续 120 秒',
        '监测压差回落后恢复正常运行曲线'
      ],
      steps: [
        { title: '异常触发', desc: '超滤区跨膜压差异常升高，区域设备红色闪烁。', agent: 'supervisor', action: 'alarm' },
        { title: '数据上送', desc: '压差、流量、阀组状态传输至监管总管智能体。', agent: 'supervisor', action: 'upstream' },
        { title: '总管分析', desc: '总管智能体识别超滤堵塞趋势并完成风险分级。', agent: 'supervisor', action: 'analyze' },
        { title: '派发任务', desc: '任务下发至超滤智能体，进入反洗策略推演。', agent: 'uf', action: 'dispatch' },
        { title: '方案生成', desc: '超滤智能体输出阀组切换与反洗联动方案。', agent: 'uf', action: 'plan' },
        { title: '人工确认', desc: '该动作涉及关键阀组联动，需人工确认。', agent: 'uf', action: 'confirm' },
        { title: '设备动作', desc: '阀门切换、反洗泵启动、超滤模块状态恢复。', agent: 'uf', action: 'hardware' },
        { title: '指标恢复', desc: '跨膜压差回落，超滤产水稳定。', agent: 'supervisor', action: 'recover' }
      ]
    },
    {
      id: 'ro',
      name: '膜处理异常处置',
      subtitle: '膜压差告警 -> 总管分析 -> 膜智能体执行冲洗与模式切换',
      risk: 'high',
      moduleKey: 'ro',
      abnormalMetric: '膜压差偏高 21%',
      metrics: [
        { label: '膜压差', value: '0.41 MPa' },
        { label: '产水电导率', value: '18 us/cm' },
        { label: '冲洗模式', value: '待激活' },
        { label: '恢复时间', value: '6 分钟' }
      ],
      handoff: [
        { agent: TEXT.supervisor, title: '采集异常', desc: '采集膜压差、电导率、产水状态，确认膜区偏离稳定工况。' },
        { agent: TEXT.supervisor, title: '初步研判', desc: '初判为膜污染趋势上升，而不是瞬时波动。' },
        { agent: TEXT.ro, title: '专项推演', desc: '推演冲洗持续时间、循环泵参数与模式切换方案。' },
        { agent: TEXT.ro, title: '执行闭环', desc: '等待确认后发起冲洗与模式切换，并回传恢复结果。' }
      ],
      thinkingByStage: [
        {
          title: '监管总管智能体正在确认膜区异常类型',
          summary: '总管智能体会先判断膜压差异常是否持续扩大，再确认是否需要膜智能体介入。',
          points: ['校核膜压差与电导率联动变化', '排除瞬时负荷波动', '确认是否触发模式切换条件']
        },
        {
          title: '膜智能体正在推演冲洗与模式切换',
          summary: '膜智能体会在冲洗强度、循环泵参数与模式切换之间做权衡，保证恢复与稳定兼顾。',
          points: ['确定冲洗持续时间', '推演循环泵运行参数', '评估模式切换后的恢复曲线']
        },
        {
          title: '执行反馈正在回传监管总管智能体',
          summary: '执行结束后，系统将持续监测膜压差和产水指标，并将结果回传给总管智能体。',
          points: ['确认冲洗回路是否稳定', '检查膜压差是否开始回落', '汇总产水恢复趋势']
        }
      ],
      feedback: [
        { stage: '执行中', title: '冲洗回路反馈', desc: '膜冲洗回路已启用，循环泵进入运行状态。' },
        { stage: '执行中', title: '模式切换反馈', desc: '膜系统已切换至修复态，运行模式稳定。' },
        { stage: '恢复中', title: '产水反馈', desc: '膜压差回落，产水质量指标逐步恢复。' }
      ],
      planTitle: '膜系统冲洗与运行模式切换',
      planDescription: '系统建议启动短时冲洗并切换运行模式，通过膜智能体闭环控制恢复膜区稳定性。',
      planPoints: [
        '启动膜冲洗回路与循环泵',
        '切换膜运行模式至修复态',
        '跟踪产水电导与膜压差恢复情况'
      ],
      steps: [
        { title: '异常触发', desc: '膜处理区压差异常，系统提示运行风险上升。', agent: 'supervisor', action: 'alarm' },
        { title: '数据上送', desc: '压差、电导率、产水状态送至监管总管智能体。', agent: 'supervisor', action: 'upstream' },
        { title: '总管分析', desc: '总管智能体综合评估膜污染趋势并完成初判。', agent: 'supervisor', action: 'analyze' },
        { title: '派发任务', desc: '任务派发至膜智能体，进入冲洗策略推演。', agent: 'ro', action: 'dispatch' },
        { title: '方案生成', desc: '膜智能体生成冲洗与模式切换方案。', agent: 'ro', action: 'plan' },
        { title: '人工确认', desc: '该动作涉及模式切换，需人工确认后执行。', agent: 'ro', action: 'confirm' },
        { title: '设备动作', desc: '冲洗管路启动、循环泵运转、膜状态切换。', agent: 'ro', action: 'hardware' },
        { title: '指标恢复', desc: '膜压差回落，产水稳定恢复。', agent: 'supervisor', action: 'recover' }
      ]
    }
  ];

  function init() {
    renderScenarioList();
    renderAgentList();
    bindControls();
    initClock();
    initStage();
    setScenario(activeScenarioId, true);
    appendLog(TEXT.init);
  }

  function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  function updateClock() {
    var now = new Date();
    document.getElementById('clockLabel').textContent = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(':');
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function getScenario(id) {
    return scenarios.find(function (item) {
      return item.id === id;
    });
  }

  function renderScenarioList() {
    var container = document.getElementById('scenarioList');
    container.innerHTML = '';
    scenarios.forEach(function (scenario) {
      var card = document.createElement('div');
      card.className = 'scenario-item ' + (scenario.risk === 'high' ? 'high-risk' : '');
      card.dataset.scenario = scenario.id;
      card.innerHTML =
        '<h3>' + scenario.name + '</h3>' +
        '<p>' + scenario.subtitle + '</p>' +
        '<div class="scenario-meta">' +
        '<span class="risk-pill ' + scenario.risk + '">' + (scenario.risk === 'high' ? 'HIGH RISK' : 'LOW RISK') + '</span>' +
        '<button class="scenario-trigger" data-run="' + scenario.id + '">启动链路</button>' +
        '</div>';
      container.appendChild(card);
    });
  }

  function renderAgentList() {
    var container = document.getElementById('agentList');
    container.innerHTML = '';
    agents.forEach(function (agent) {
      var card = document.createElement('div');
      card.className = 'agent-card';
      card.id = 'agent-' + agent.id;
      card.innerHTML =
        '<div class="agent-card-header">' +
        '<h3>' + agent.name + '</h3>' +
        '<span class="agent-state">' + agent.idle + '</span>' +
        '</div>' +
        '<p>' + agent.role + '</p>';
      container.appendChild(card);
    });
  }

  function renderMetrics(scenario) {
    var container = document.getElementById('metricGrid');
    container.innerHTML = '';
    scenario.metrics.forEach(function (metric) {
      var item = document.createElement('div');
      item.className = 'metric-card';
      item.innerHTML = '<span>' + metric.label + '</span><strong>' + metric.value + '</strong>';
      container.appendChild(item);
    });
  }

  function renderTimeline(scenario) {
    var container = document.getElementById('timelineSteps');
    container.innerHTML = '';
    scenario.steps.forEach(function (step, index) {
      var item = document.createElement('div');
      item.className = 'timeline-step';
      item.dataset.index = index;
      item.innerHTML = '<span class="step-index">' + (index + 1) + '</span><h4>' + step.title + '</h4><p>' + step.desc + '</p>';
      container.appendChild(item);
    });
  }

  function renderReasoning(scenario) {
    var container = document.getElementById('reasoningFlow');
    container.innerHTML = '';
    scenario.steps.forEach(function (step, index) {
      var item = document.createElement('div');
      item.className = 'reasoning-step';
      item.dataset.index = index;
      item.innerHTML = '<span class="step-index">' + (index + 1) + '</span><h4>' + step.title + '</h4><p>' + step.desc + '</p>';
      container.appendChild(item);
    });
  }

  function renderHandoff(scenario) {
    var container = document.getElementById('handoffTrack');
    container.innerHTML = '';
    scenario.handoff.forEach(function (handoff, index) {
      var item = document.createElement('div');
      item.className = 'handoff-step';
      item.dataset.index = index;
      item.innerHTML = '<small>' + handoff.agent + '</small><h4>' + handoff.title + '</h4><p>' + handoff.desc + '</p>';
      container.appendChild(item);
    });
  }

  function renderThinking(stage) {
    var container = document.getElementById('thinkingCard');
    var points = stage.points.map(function (point) {
      return '<li>' + point + '</li>';
    }).join('');
    container.innerHTML = '<h3>' + stage.title + '</h3><p>' + stage.summary + '</p><ul class="thinking-points">' + points + '</ul>';
  }

  function renderFeedback(scenario) {
    var container = document.getElementById('feedbackList');
    container.innerHTML = '';
    scenario.feedback.forEach(function (feedback, index) {
      var item = document.createElement('div');
      item.className = 'feedback-item';
      item.dataset.index = index;
      item.innerHTML = '<small>' + feedback.stage + '</small><h4>' + feedback.title + '</h4><p>' + feedback.desc + '</p>';
      container.appendChild(item);
    });
  }

  function renderPlan(scenario) {
    var badge = document.getElementById('riskBadge');
    badge.textContent = scenario.risk === 'high' ? 'HIGH RISK' : 'LOW RISK';
    badge.className = 'plan-level ' + scenario.risk;
    document.getElementById('planTitle').textContent = scenario.planTitle;
    document.getElementById('planDescription').textContent = scenario.planDescription;
    var list = document.getElementById('planPoints');
    list.innerHTML = '';
    scenario.planPoints.forEach(function (point) {
      var item = document.createElement('li');
      item.textContent = point;
      list.appendChild(item);
    });
  }

  function bindControls() {
    document.getElementById('scenarioList').addEventListener('click', function (event) {
      var runId = event.target.getAttribute('data-run');
      if (runId) {
        runScenario(runId);
        return;
      }
      var card = event.target.closest('.scenario-item');
      if (card) {
        setScenario(card.dataset.scenario, true);
      }
    });

    document.getElementById('autoPlayBtn').addEventListener('click', function () {
      runScenario(activeScenarioId);
    });
    document.getElementById('stepPlayBtn').addEventListener('click', stepForward);
    document.getElementById('prevStepBtn').addEventListener('click', stepBackward);
    document.getElementById('nextStepBtn').addEventListener('click', stepForward);
    document.getElementById('resetBtn').addEventListener('click', function () {
      resetScene();
      appendLog(TEXT.reset);
    });
    document.getElementById('executeBtn').addEventListener('click', executeCurrentScenarioPlan);
    document.getElementById('confirmActionBtn').addEventListener('click', function () {
      if (pendingConfirmation) {
        pendingConfirmation();
      }
    });
  }

  function setScenario(id, resetStep) {
    var scenario = getScenario(id);
    activeScenarioId = id;
    if (resetStep) {
      currentStepIndex = 0;
    }

    document.querySelectorAll('.scenario-item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.scenario === id);
    });

    document.getElementById('activeScenarioName').textContent = scenario.name;
    document.getElementById('alarmCount').textContent = scenario.risk === 'high' ? '05' : '03';
    document.getElementById('loadLabel').textContent = scenario.id === 'dosing' ? '81%' : scenario.id === 'uf' ? '76%' : '79%';
    document.getElementById('healthLabel').textContent = scenario.risk === 'high' ? TEXT.riskFocus : TEXT.riskGood;

    renderMetrics(scenario);
    renderTimeline(scenario);
    renderReasoning(scenario);
    renderHandoff(scenario);
    renderFeedback(scenario);
    renderPlan(scenario);
    renderThinking(scenario.thinkingByStage[0]);

    pendingConfirmation = null;
    document.getElementById('confirmActionBtn').disabled = true;
    document.querySelector('.confirm-title').textContent = TEXT.confirmTitleIdle;
    document.querySelector('.confirm-desc').textContent = TEXT.confirmDescIdle;

    resetSceneVisuals();
    applyAnnotationVisibility(scenario.moduleKey);
    setActiveAgentBubble('supervisor', '监测中');
    focusModule(scenario.moduleKey, true);
    setAgentsIdle(scenario);
    highlightStep(0);
    updateScenarioStatus(TEXT.loaded);
  }

  function setAgentsIdle(scenario) {
    syncAgentState('supervisor', '在线', false);
    syncAgentState('dosing', scenario.id === 'dosing' ? '待命' : '监测中', false);
    syncAgentState('uf', scenario.id === 'uf' ? '待命' : '监测中', false);
    syncAgentState('ro', scenario.id === 'ro' ? '待命' : '监测中', false);
  }

  function highlightStep(index) {
    currentStepIndex = index;
    document.querySelectorAll('.timeline-step').forEach(function (item) {
      item.classList.toggle('active', Number(item.dataset.index) === index);
    });
    document.querySelectorAll('.reasoning-step').forEach(function (item) {
      item.classList.toggle('active', Number(item.dataset.index) === index);
    });
    document.querySelectorAll('.handoff-step').forEach(function (item) {
      item.classList.toggle('active', Number(item.dataset.index) <= Math.min(index, 3));
    });
    document.querySelectorAll('.feedback-item').forEach(function (item) {
      item.classList.toggle('active', index >= 5 && Number(item.dataset.index) <= Math.max(0, index - 5));
    });
  }

  function updateScenarioStatus(text) {
    document.getElementById('controlNote').textContent = text;
  }

  function runScenario(id) {
    clearAutoPlay();
    setScenario(id, true);
    appendLog('开始演示链路：' + getScenario(id).name);
    autoAdvance(0);
  }

  function clearAutoPlay() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function autoAdvance(index) {
    var scenario = getScenario(activeScenarioId);
    if (index >= scenario.steps.length) {
      updateScenarioStatus(TEXT.done);
      return;
    }
    performStep(index, function (paused) {
      if (paused) {
        updateScenarioStatus(TEXT.confirmWait);
        return;
      }
      autoTimer = setTimeout(function () {
        autoAdvance(index + 1);
      }, getStepDelay(scenario.steps[index]));
    });
  }

  function getStepDelay(step) {
    if (step.action === 'upstream' || step.action === 'dispatch') {
      return 2400;
    }
    if (step.action === 'analyze' || step.action === 'plan') {
      return 2200;
    }
    if (step.action === 'recover') {
      return 1900;
    }
    return 1650;
  }

  function stepForward() {
    var scenario = getScenario(activeScenarioId);
    if (currentStepIndex >= scenario.steps.length) {
      return;
    }
    performStep(currentStepIndex, function () {});
  }

  function stepBackward() {
    if (currentStepIndex <= 0) {
      return;
    }
    var target = currentStepIndex - 1;
    setScenario(activeScenarioId, true);
    for (var i = 0; i < target; i += 1) {
      performStep(i, function () {}, true);
    }
    highlightStep(target);
    currentStepIndex = target;
    updateScenarioStatus('已回退一步，可继续分步演示。');
  }

  function executeCurrentScenarioPlan() {
    if (pendingConfirmation) {
      pendingConfirmation();
      return;
    }
    var scenario = getScenario(activeScenarioId);
    performHardwareAction(scenario.moduleKey);
    updateScenarioStatus(TEXT.manualExecute);
    appendLog('已手动执行当前工艺方案：' + scenario.planTitle);
  }

  function performStep(index, callback, silent) {
    var scenario = getScenario(activeScenarioId);
    var step = scenario.steps[index];
    highlightStep(index);
    updateThinkingForStep(scenario, index);
    updateAgentsForStep(scenario, step, index);
    applyStepVisual(scenario, step, index);
    if (!silent) {
      appendLog('[' + scenario.name + '] ' + step.title + '：' + step.desc);
    }

    if (step.action === 'confirm') {
      pendingConfirmation = function () {
        document.getElementById('confirmActionBtn').disabled = true;
        document.querySelector('.confirm-title').textContent = TEXT.confirmTitleDone;
        document.querySelector('.confirm-desc').textContent = TEXT.confirmDescDone;
        pendingConfirmation = null;
        performStep(index + 1, function () {
          if (callback) {
            callback(false);
          }
        }, silent);
      };
      document.getElementById('confirmActionBtn').disabled = false;
      document.querySelector('.confirm-title').textContent = TEXT.confirmTitleWait;
      document.querySelector('.confirm-desc').textContent = scenario.planTitle;
      if (callback) {
        callback(true);
      }
      return;
    }

    currentStepIndex = index + 1;
    if (callback) {
      callback(false);
    }
  }

  function updateThinkingForStep(scenario, index) {
    if (index <= 2) {
      renderThinking(scenario.thinkingByStage[0]);
      setActiveAgentBubble('supervisor', index === 0 ? '异常识别' : index === 1 ? '数据接收' : '归因分析');
    } else if (index <= 5) {
      renderThinking(scenario.thinkingByStage[1]);
      setActiveAgentBubble(scenario.moduleKey, index === 3 ? '任务接收' : index === 4 ? '方案推演' : '等待执行');
    } else {
      renderThinking(scenario.thinkingByStage[2]);
      setActiveAgentBubble(scenario.moduleKey, index === 6 ? '执行中' : '反馈回传');
    }
  }

  function updateAgentsForStep(scenario, step, index) {
    setAgentsIdle(scenario);
    if (index <= 2) {
      syncAgentState('supervisor', '分析中', true);
    } else if (index <= 5) {
      syncAgentState('supervisor', '已分发', true);
      syncAgentState(step.agent, step.action === 'confirm' ? '待确认' : '推演中', true);
    } else {
      syncAgentState(step.agent, '执行中', true);
      syncAgentState('supervisor', '回传中', true);
    }
  }

  function syncAgentState(agentId, status, active) {
    var card = document.getElementById('agent-' + agentId);
    if (!card) {
      return;
    }
    card.querySelector('.agent-state').textContent = status;
    card.classList.toggle('active', !!active);
  }

  function appendLog(text) {
    var container = document.getElementById('logList');
    var item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = '<small>' + [pad(new Date().getHours()), pad(new Date().getMinutes()), pad(new Date().getSeconds())].join(':') + '</small><p>' + text + '</p>';
    container.prepend(item);
    while (container.children.length > 10) {
      container.removeChild(container.lastChild);
    }
  }

  function initStage() {
    dataModel = new ht.DataModel();
    graph3dView = new ht.graph3d.Graph3dView(dataModel);
    graph3dView.setEye([0, 250, 520]);
    graph3dView.setCenter([0, 56, 50]);
    graph3dView.setGridVisible(false);
    graph3dView.setMovableFunc(function () {
      return false;
    });

    var container = document.getElementById('stage3d');
    graph3dView.getView().className = 'stage-viewport-inner';
    container.appendChild(graph3dView.getView());

    ['wheel', 'pointerdown', 'mousedown', 'touchstart'].forEach(function (eventName) {
      container.addEventListener(eventName, function () {
        shouldAutoFocus = false;
      }, { passive: true });
    });

    window.addEventListener('resize', resizeStage);
    createBaseScene();
    resizeStage();
  }

  function resizeStage() {
    if (!graph3dView) {
      return;
    }
    graph3dView.invalidate();
    graph3dView.iv();
  }

  function createBaseScene() {
    createGround();
    createSupervisorHub();
    createModules();
    createAgentNodes();
    createPipes();
    createFlows();
  }

  function createGround() {
    createNode('box', [0, -10, 40], [720, 8, 340], { 'all.color': '#0a2038', 'wf.visible': true, 'wf.color': '#123962' }, 'site-floor').a('moduleKey', 'overview');
    var rawPool = createNode('box', [-220, 0, -40], [130, 16, 80], { 'all.color': 'rgba(36,116,255,0.4)', 'all.transparent': true, 'all.reverse.cull': true, 'wf.visible': true, 'wf.color': '#3578ff' }, 'raw-pool');
    rawPool.a('moduleKey', 'overview');
    setSceneNote(rawPool, '原水池');
    rawPool.a('annotationGroup', 'overview');
  }

  function createSupervisorHub() {
    var hub = createNode('cylinder', [0, 72, 54], [92, 130, 92], { 'shape3d.side': 30, 'all.color': '#25c8ff', 'wf.visible': true, 'wf.color': '#89f3ff' }, 'supervisor');
    hub.a('moduleKey', 'supervisor');
    hub.a('annotationGroup', 'supervisor');
    setSceneNote(hub, TEXT.supervisor);
    var ring = createNode('torus', [0, 146, 54], [132, 18, 132], { 'shape3d.side': 36, 'all.color': '#56f0ff', 'all.opacity': 0.55, 'all.transparent': true }, 'supervisor-ring');
    ring.a('moduleKey', 'supervisor');
  }

  function createModules() {
    createModulePart('dosing-base', 'box', [-210, 20, 56], [132, 40, 90], '#0f355d', '#2c77b5', 'dosing');
    var dosingTank = createModulePart('dosing-tank', 'cylinder', [-258, 72, 42], [44, 118, 44], '#2ca7ff', '#90dcff', 'dosing', true);
    setSceneNote(dosingTank, '药箱');
    var dosingPump = createModulePart('dosing-pump', 'cylinder', [-184, 42, 74], [34, 38, 34], '#1de3c0', '#6ff7e3', 'dosing', true);
    dosingPump.r3([Math.PI / 2, 0, 0]);
    dosingPump.a('baseRotation', [Math.PI / 2, 0, 0]);
    setSceneNote(dosingPump, '加药泵');
    var dosingValve = createModulePart('dosing-valve', 'torus', [-132, 42, 74], [28, 28, 28], '#6f7f95', '#9cc5ff', 'dosing', true);
    setSceneNote(dosingValve, '阀门');

    createModulePart('uf-base', 'box', [-18, 20, 146], [168, 40, 96], '#102f4b', '#3979ad', 'uf');
    var ufa = createModulePart('uf-column-a', 'box', [-76, 70, 156], [28, 110, 28], '#31b8ff', '#9fdcff', 'uf', true);
    var ufb = createModulePart('uf-column-b', 'box', [-18, 70, 156], [28, 110, 28], '#31b8ff', '#9fdcff', 'uf', true);
    var ufc = createModulePart('uf-column-c', 'box', [40, 70, 156], [28, 110, 28], '#31b8ff', '#9fdcff', 'uf', true);
    setSceneNote(ufa, '超滤A');
    setSceneNote(ufb, '超滤B');
    setSceneNote(ufc, '超滤C');
    var ufValve = createModulePart('uf-valve', 'torus', [104, 42, 142], [28, 28, 28], '#6f7f95', '#9cc5ff', 'uf', true);
    setSceneNote(ufValve, '阀组');

    createModulePart('ro-base', 'box', [212, 20, 52], [150, 40, 92], '#102d42', '#2f77ab', 'ro');
    var roA = createModulePart('ro-unit-a', 'cylinder', [170, 64, 48], [30, 112, 30], '#34c8ff', '#97e7ff', 'ro', true);
    roA.r3([Math.PI / 2, 0, 0]);
    roA.a('baseRotation', [Math.PI / 2, 0, 0]);
    setSceneNote(roA, '膜组A');
    var roB = createModulePart('ro-unit-b', 'cylinder', [220, 64, 48], [30, 112, 30], '#34c8ff', '#97e7ff', 'ro', true);
    roB.r3([Math.PI / 2, 0, 0]);
    roB.a('baseRotation', [Math.PI / 2, 0, 0]);
    setSceneNote(roB, '膜组B');
    var roC = createModulePart('ro-unit-c', 'cylinder', [270, 64, 48], [30, 112, 30], '#34c8ff', '#97e7ff', 'ro', true);
    roC.r3([Math.PI / 2, 0, 0]);
    roC.a('baseRotation', [Math.PI / 2, 0, 0]);
    setSceneNote(roC, '膜组C');
    var roPump = createModulePart('ro-pump', 'sphere', [222, 42, 88], [26, 26, 26], '#1de3c0', '#6ff7e3', 'ro', true);
    setSceneNote(roPump, '循环泵');
  }

  function createAgentNodes() {
    createAgentNode('agent-dosing', [-160, 138, 16], '#4df0ff', '#b9fbff', TEXT.dosing, 'dosing');
    createAgentNode('agent-uf', [-170, 156, 236], '#8b9dff', '#d7dcff', TEXT.uf, 'uf');
    createAgentNode('agent-ro', [220, 138, 10], '#68f8c7', '#d1fff0', TEXT.ro, 'ro');
  }

  function createPipes() {
    createPipe('pipe-dosing-main', [-132, 42, 74], [-42, 42, 74], '#2f8dff');
    createPipe('pipe-hub-main', [-42, 42, 74], [0, 42, 12], '#2f8dff');
    createPipe('pipe-uf-main', [104, 42, 142], [22, 42, 70], '#2f8dff');
    createPipe('pipe-ro-main', [222, 42, 88], [72, 42, 16], '#2f8dff');
  }

  function createFlows() {
    sceneLinks.dosingToSupervisor = createFlow(sceneNodes['dosing-tank'], sceneNodes.supervisor, '#4df0ff');
    sceneLinks.supervisorToDosing = createFlow(sceneNodes.supervisor, sceneNodes['agent-dosing'], '#4df0ff');
    sceneLinks.agentToDosing = createFlow(sceneNodes['agent-dosing'], sceneNodes['dosing-pump'], '#4df0ff');

    sceneLinks.ufToSupervisor = createFlow(sceneNodes['uf-column-b'], sceneNodes.supervisor, '#8b9dff');
    sceneLinks.supervisorToUf = createFlow(sceneNodes.supervisor, sceneNodes['agent-uf'], '#8b9dff');
    sceneLinks.agentToUf = createFlow(sceneNodes['agent-uf'], sceneNodes['uf-column-b'], '#8b9dff');

    sceneLinks.roToSupervisor = createFlow(sceneNodes['ro-unit-b'], sceneNodes.supervisor, '#68f8c7');
    sceneLinks.supervisorToRo = createFlow(sceneNodes.supervisor, sceneNodes['agent-ro'], '#68f8c7');
    sceneLinks.agentToRo = createFlow(sceneNodes['agent-ro'], sceneNodes['ro-unit-b'], '#68f8c7');
  }

  function createModulePart(id, shape, position, size, color, wire, moduleKey, pulseTarget) {
    var node = createNode(shape, position, size, { 'all.color': color, 'wf.visible': true, 'wf.color': wire }, id);
    node.a('moduleKey', moduleKey);
    node.a('annotationGroup', moduleKey);
    if (pulseTarget) {
      node.a('pulseTarget', true);
    }
    return node;
  }

  function createAgentNode(id, position, color, wire, label, moduleKey) {
    var node = createNode('sphere', position, [20, 20, 20], { 'shape3d.side': 20, 'all.color': color, 'wf.visible': true, 'wf.color': wire }, id);
    node.a('moduleKey', moduleKey);
    node.a('annotationGroup', moduleKey);
    node.a('pulseTarget', true);
    setSceneNote(node, label);
    return node;
  }

  function createPipe(id, start, end, color) {
    var a = createNode('sphere', start, [8, 8, 8], { 'all.opacity': 0.01, 'all.transparent': true }, id + '-a');
    var b = createNode('sphere', end, [8, 8, 8], { 'all.opacity': 0.01, 'all.transparent': true }, id + '-b');
    var edge = new ht.Edge(a, b);
    edge.s({ 'edge.width': 10, 'shape3d': 'cylinder', 'shape3d.color': color, 'shape3d.top.cap': 'round', 'shape3d.bottom.cap': 'round', 'all.opacity': 0.95 });
    dataModel.add(edge);
    sceneLinks[id] = edge;
    setPipeLabel(id, edge);
    return edge;
  }

  function createFlow(source, target, color) {
    var edge = new ht.Edge(source, target);
    edge.s({ 'edge.width': 5, 'edge.center': true, 'shape3d': 'cylinder', 'shape3d.color': color, 'shape3d.top.cap': 'round', 'shape3d.bottom.cap': 'round', 'all.opacity': 0.92 });
    edge.a('isFlowLink', true);
    edge.a('baseColor', color);
    dataModel.add(edge);
    return edge;
  }

  function setSceneNote(node, label) {
    node.a('baseNote', label);
    node.s('note', label);
    node.s('note.face', 'top');
    node.s('note.autorotate', true);
    node.s('note.color', '#dff7ff');
    node.s('note.background', 'rgba(10,32,56,0.9)');
  }

  function setPipeLabel(id, edge) {
    var labelMap = {
      'pipe-dosing-main': '加药管线',
      'pipe-hub-main': '汇流管线',
      'pipe-uf-main': '超滤管线',
      'pipe-ro-main': '膜区管线'
    };
    if (!labelMap[id]) {
      return;
    }
    edge.a('baseLabel', labelMap[id]);
    if (id === 'pipe-dosing-main') {
      edge.a('annotationGroup', 'dosing');
    } else if (id === 'pipe-hub-main') {
      edge.a('annotationGroup', 'dosing');
    } else if (id === 'pipe-uf-main') {
      edge.a('annotationGroup', 'uf');
    } else if (id === 'pipe-ro-main') {
      edge.a('annotationGroup', 'ro');
    }
    edge.s('label', labelMap[id]);
    edge.s('label.color', '#bfefff');
  }

  function applyAnnotationVisibility(moduleKey) {
    Object.keys(sceneNodes).forEach(function (id) {
      var node = sceneNodes[id];
      var baseNote = node.a('baseNote');
      if (!baseNote) {
        return;
      }
      var group = node.a('annotationGroup');
      var visible = group === 'supervisor' || group === moduleKey || (group === 'overview' && moduleKey === 'dosing');
      node.s('note', visible ? baseNote : '');
    });

    Object.keys(sceneLinks).forEach(function (key) {
      var link = sceneLinks[key];
      var baseLabel = link.a && link.a('baseLabel');
      if (!baseLabel) {
        return;
      }
      var visible = link.a('annotationGroup') === moduleKey;
      link.s('label', visible ? baseLabel : '');
    });
  }

  function setActiveAgentBubble(agentKey, text) {
    clearAgentBubble();
    var nodeId = agentKey === 'supervisor' ? 'supervisor' : 'agent-' + agentKey;
    var node = sceneNodes[nodeId];
    if (!node) {
      return;
    }
    var baseNote = node.a('baseNote') || '';
    node.s('note', baseNote + ' · ' + text);
    node.s('note.background', 'rgba(18,56,96,0.96)');
    node.s('note.color', '#ffffff');
    bubbleTimer = setTimeout(function () {
      var restore = node.a('baseNote') || '';
      node.s('note', restore);
      node.s('note.background', 'rgba(10,32,56,0.9)');
      node.s('note.color', '#dff7ff');
      bubbleTimer = null;
    }, 2200);
  }

  function clearAgentBubble() {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }
    Object.keys(sceneNodes).forEach(function (id) {
      var node = sceneNodes[id];
      var baseNote = node.a('baseNote');
      if (baseNote) {
        node.s('note', baseNote);
        node.s('note.background', 'rgba(10,32,56,0.9)');
        node.s('note.color', '#dff7ff');
      }
    });
  }

  function createNode(shape, position, size, styles, id) {
    var node = new ht.Node();
    node.setStyle('shape3d', shape);
    node.p3(position);
    node.s3(size);
    node.a('baseSize', size.slice());
    node.a('baseRotation', [0, 0, 0]);
    Object.keys(styles).forEach(function (key) {
      node.s(key, styles[key]);
    });
    dataModel.add(node);
    sceneNodes[id] = node;
    return node;
  }

  function focusModule(moduleKey, force) {
    if (!force && !shouldAutoFocus) {
      return;
    }
    if (moduleKey === 'dosing') {
      graph3dView.setEye([-150, 150, 300]);
      graph3dView.setCenter([-190, 54, 58]);
    } else if (moduleKey === 'uf') {
      graph3dView.setEye([-28, 182, 360]);
      graph3dView.setCenter([-26, 64, 142]);
    } else if (moduleKey === 'ro') {
      graph3dView.setEye([176, 150, 320]);
      graph3dView.setCenter([212, 54, 52]);
    } else {
      graph3dView.setEye([0, 250, 520]);
      graph3dView.setCenter([0, 56, 50]);
    }
  }

  function applyStepVisual(scenario, step, index) {
    resetSceneVisuals();
    if (index <= 1) {
      focusModule(scenario.moduleKey, false);
    }

    if (step.action === 'alarm') {
      startBlink(getModuleTargets(scenario.moduleKey), '#ff6d7a', getModuleBaseColor(scenario.moduleKey));
      updateScenarioStatus('检测到异常：' + scenario.abnormalMetric);
    } else if (step.action === 'upstream') {
      activateFlow(getFlowMap(scenario.moduleKey).upstream);
      pulseNode(sceneNodes.supervisor, '#4df0ff', 1.08);
      updateScenarioStatus('异常数据已上送至监管总管智能体。');
    } else if (step.action === 'analyze') {
      pulseNode(sceneNodes.supervisor, '#4df0ff', 1.12);
      pulseNode(sceneNodes['supervisor-ring'], '#9af6ff', 1.08);
      updateScenarioStatus('监管总管智能体正在进行异常归因与风险分级。');
    } else if (step.action === 'dispatch') {
      activateFlow(getFlowMap(scenario.moduleKey).dispatch);
      pulseNode(sceneNodes.supervisor, '#ffd268', 1.05);
      pulseNode(sceneNodes[getFlowMap(scenario.moduleKey).agentNode], '#ffd268', 1.08);
      updateScenarioStatus('总管智能体已派发任务至对应专项智能体。');
    } else if (step.action === 'plan') {
      startBlink(getModuleTargets(scenario.moduleKey).concat([getFlowMap(scenario.moduleKey).agentNode]), '#ffd268', getModuleBaseColor(scenario.moduleKey));
      updateScenarioStatus('专项智能体正在进行工艺推演并生成执行方案。');
    } else if (step.action === 'execute' || step.action === 'hardware') {
      performHardwareAction(scenario.moduleKey);
      updateScenarioStatus('硬件执行链已触发，当前正在恢复运行状态。');
    } else if (step.action === 'recover') {
      pulseNode(sceneNodes.supervisor, '#5ff2af', 1.08);
      startBlink(getModuleTargets(scenario.moduleKey), '#5ff2af', getModuleBaseColor(scenario.moduleKey));
      updateScenarioStatus('关键指标恢复，当前链路已完成闭环。');
    }
  }

  function getFlowMap(moduleKey) {
    if (moduleKey === 'dosing') {
      return { upstream: ['dosingToSupervisor'], dispatch: ['supervisorToDosing', 'agentToDosing'], agentNode: 'agent-dosing' };
    }
    if (moduleKey === 'uf') {
      return { upstream: ['ufToSupervisor'], dispatch: ['supervisorToUf', 'agentToUf'], agentNode: 'agent-uf' };
    }
    return { upstream: ['roToSupervisor'], dispatch: ['supervisorToRo', 'agentToRo'], agentNode: 'agent-ro' };
  }

  function getModuleTargets(moduleKey) {
    if (moduleKey === 'dosing') {
      return ['dosing-tank', 'dosing-pump', 'dosing-valve'];
    }
    if (moduleKey === 'uf') {
      return ['uf-column-a', 'uf-column-b', 'uf-column-c', 'uf-valve'];
    }
    return ['ro-unit-a', 'ro-unit-b', 'ro-unit-c', 'ro-pump'];
  }

  function getModuleBaseColor(moduleKey) {
    if (moduleKey === 'dosing') {
      return '#2ca7ff';
    }
    if (moduleKey === 'uf') {
      return '#31b8ff';
    }
    return '#34c8ff';
  }

  function startBlink(targetIds, primaryColor, secondaryColor) {
    stopBlink();
    var targets = targetIds.map(function (id) {
      return sceneNodes[id];
    }).filter(Boolean);
    var visible = false;
    blinkTimer = setInterval(function () {
      visible = !visible;
      targets.forEach(function (node) {
        node.s('all.color', visible ? primaryColor : secondaryColor);
        node.s('all.opacity', visible ? 1 : 0.88);
      });
    }, 260);
  }

  function stopBlink() {
    if (blinkTimer) {
      clearInterval(blinkTimer);
      blinkTimer = null;
    }
  }

  function activateFlow(linkKeys) {
    stopFlow();
    var links = linkKeys.map(function (key) {
      return sceneLinks[key];
    }).filter(Boolean);
    var visible = false;
    flowTimer = setInterval(function () {
      visible = !visible;
      links.forEach(function (link) {
        link.s('shape3d.color', visible ? '#ffffff' : link.a('baseColor'));
        link.s('edge.width', visible ? 14 : 6);
        link.s('all.opacity', visible ? 1 : 0.76);
      });
    }, 320);
  }

  function stopFlow() {
    if (flowTimer) {
      clearInterval(flowTimer);
      flowTimer = null;
    }
    Object.keys(sceneLinks).forEach(function (key) {
      var link = sceneLinks[key];
      if (link && link.a && link.a('isFlowLink')) {
        link.s('shape3d.color', link.a('baseColor'));
        link.s('edge.width', 6);
        link.s('all.opacity', 0.92);
      }
    });
  }

  function pulseNode(node, color, scale) {
    if (!node) {
      return;
    }
    var baseSize = node.a('baseSize') || node.s3();
    node.s('all.color', color);
    node.s('all.opacity', 1);
    node.s3([baseSize[0] * scale, baseSize[1] * scale, baseSize[2] * scale]);
  }

  function performHardwareAction(moduleKey) {
    var flowMap = getFlowMap(moduleKey);
    activateFlow(flowMap.dispatch);
    if (moduleKey === 'dosing') {
      startBlink(['dosing-tank', 'dosing-pump', 'agent-dosing'], '#5ff2af', '#1de3c0');
      pulseNode(sceneNodes['dosing-pump'], '#5ff2af', 1.16);
      pulseNode(sceneNodes['dosing-tank'], '#7cf7c7', 1.05);
      sceneNodes['dosing-valve'].r3([0, 0, Math.PI / 1.8]);
      sceneLinks['pipe-dosing-main'].s('shape3d.color', '#5ff2af');
      sceneLinks['pipe-hub-main'].s('shape3d.color', '#5ff2af');
      sceneLinks['pipe-dosing-main'].s('edge.width', 14);
      sceneLinks['pipe-hub-main'].s('edge.width', 14);
    } else if (moduleKey === 'uf') {
      startBlink(['uf-column-a', 'uf-column-b', 'uf-column-c', 'agent-uf'], '#5ff2af', '#31b8ff');
      sceneNodes['uf-valve'].r3([0, Math.PI / 2.2, 0]);
      pulseNode(sceneNodes['uf-column-a'], '#5ff2af', 1.06);
      pulseNode(sceneNodes['uf-column-b'], '#5ff2af', 1.06);
      pulseNode(sceneNodes['uf-column-c'], '#5ff2af', 1.06);
      sceneLinks['pipe-uf-main'].s('shape3d.color', '#5ff2af');
      sceneLinks['pipe-uf-main'].s('edge.width', 14);
    } else {
      startBlink(['ro-unit-a', 'ro-unit-b', 'ro-unit-c', 'agent-ro'], '#5ff2af', '#34c8ff');
      pulseNode(sceneNodes['ro-pump'], '#5ff2af', 1.18);
      pulseNode(sceneNodes['ro-unit-a'], '#5ff2af', 1.05);
      pulseNode(sceneNodes['ro-unit-b'], '#5ff2af', 1.05);
      pulseNode(sceneNodes['ro-unit-c'], '#5ff2af', 1.05);
      sceneLinks['pipe-ro-main'].s('shape3d.color', '#5ff2af');
      sceneLinks['pipe-ro-main'].s('edge.width', 14);
    }
  }

  function resetSceneVisuals() {
    stopFlow();
    stopBlink();
    clearAgentBubble();
    Object.keys(sceneNodes).forEach(function (id) {
      var node = sceneNodes[id];
      var size = node.a('baseSize');
      var rotation = node.a('baseRotation');
      if (size) {
        node.s3(size.slice());
      }
      if (rotation) {
        node.r3(rotation.slice());
      }
    });
    applyBaseColor('supervisor', '#25c8ff', 0.95);
    applyBaseColor('supervisor-ring', '#56f0ff', 0.55);
    applyBaseColor('dosing-base', '#0f355d', 0.95);
    applyBaseColor('dosing-tank', '#2ca7ff', 0.95);
    applyBaseColor('dosing-pump', '#1de3c0', 0.95);
    applyBaseColor('dosing-valve', '#6f7f95', 0.95);
    applyBaseColor('uf-base', '#102f4b', 0.95);
    applyBaseColor('uf-column-a', '#31b8ff', 0.95);
    applyBaseColor('uf-column-b', '#31b8ff', 0.95);
    applyBaseColor('uf-column-c', '#31b8ff', 0.95);
    applyBaseColor('uf-valve', '#6f7f95', 0.95);
    applyBaseColor('ro-base', '#102d42', 0.95);
    applyBaseColor('ro-unit-a', '#34c8ff', 0.95);
    applyBaseColor('ro-unit-b', '#34c8ff', 0.95);
    applyBaseColor('ro-unit-c', '#34c8ff', 0.95);
    applyBaseColor('ro-pump', '#1de3c0', 0.95);
    applyBaseColor('agent-dosing', '#4df0ff', 0.95);
    applyBaseColor('agent-uf', '#8b9dff', 0.95);
    applyBaseColor('agent-ro', '#68f8c7', 0.95);
  }

  function applyBaseColor(id, color, opacity) {
    if (!sceneNodes[id]) {
      return;
    }
    sceneNodes[id].s('all.color', color);
    sceneNodes[id].s('all.opacity', opacity);
  }

  function resetScene() {
    clearAutoPlay();
    shouldAutoFocus = true;
    setScenario(activeScenarioId, true);
  }

  init();
})();
