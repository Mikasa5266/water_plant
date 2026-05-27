import type { AgentId, AgentLog, TelemetryState } from '../../types';

type StatusMap = Record<AgentId, 'idle' | 'monitoring' | 'processing' | 'warning'>;
type LogMap = Record<AgentId, AgentLog[]>;
type SetStr = (s: string) => void;
type SetLogs = (l: string[]) => void;

export function applyDosingStep(
  step: number, stamp: string,
  t: TelemetryState, aStatuses: StatusMap, aLogs: LogMap, payloadLogs: string[],
  setTitle: SetStr, setDesc: SetStr, setPayload: SetLogs
) {
  switch (step) {
    case 1:
      setTitle('【步骤1/8】混凝异常：原水短时浊度激增');
      setDesc('进水浊度感应单元警报。在混凝池检测到加药浓度不足，原水质发生波动风险。');
      t.inletTurbidity = 58.0;
      t.healthScore = 85;
      t.outletTurbidity = 0.12;
      aStatuses.dosing = 'warning';
      aLogs.dosing = [
        { id: `dos_${stamp}`, time: stamp, message: '警报：原水浊度激增至 58 NTU！瞬时药剂极值不足！', type: 'warning' },
        ...aLogs.dosing
      ];
      setPayload(['[系统警报] 进水工艺监测点异常触发现场高频波动。', '[加药智能体] 捕获反馈段混凝浑浊。']);
      break;
    case 2:
      setTitle('【步骤2/8】感知数据实时上送云管');
      setDesc('故障诊断传感器与加药智能体并行，将多维工艺异常断面指标高速注入总控制信道。');
      t.onlineRate = 99.8;
      aLogs.dosing = [
        { id: `dos_${stamp}`, time: stamp, message: '正在构建局部高维度工况快照并打包广播...', type: 'info' },
        ...aLogs.dosing
      ];
      setPayload([...payloadLogs, '[通信子网] 加药子段断面传感器实时上送多重分析值。', '[数据验证] 加药浓度失调归档，信道时延 15ms。']);
      break;
    case 3:
      setTitle('【步骤3/8】监管总管智能体工艺链深度归因分析');
      setDesc('总管智能体接管全链感知。比对投药模型与下级流速反馈，精准锁定原水突变与机械阀门设定偏差。');
      aStatuses.supervisor = 'warning';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '诊断广播：加药工况突变。计算归因：原水强冲击复合投药阀门饱和。', type: 'warning' },
        ...aLogs.supervisor
      ];
      setPayload([...payloadLogs, '[总控智能体] 启动关联推演。判定故障点：阀体暂无物理卡阻，纯属药耗负载过低引起失稳。']);
      break;
    case 4:
      setTitle('【步骤4/8】协同联合调度与指令派发');
      setDesc('总管智能体下发自适应干预指令：指令加药智能体提升投加速率，并告诫后段超滤单元提前预备。');
      aStatuses.supervisor = 'processing';
      aStatuses.uf = 'processing';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '派发控制链：指令【加药智能体】提高投加，通知【超滤】调大通量。', type: 'info' },
        ...aLogs.supervisor
      ];
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '接收调度指令：预计浊度冲击5分钟后到达，做好变频过闸调节。', type: 'info' },
        ...aLogs.uf
      ];
      setPayload([...payloadLogs, '[控制中心] 决策指令下达：混凝增药 + 反应层气密锁定。指令送达耗时：30ms。']);
      break;
    case 5:
      setTitle('【步骤5/8】智能极值补偿加药方案优化生成');
      setDesc('加药智能体融合神经网络回归预测，动态生成包含"1号混凝泵幅频提升22%、补偿加药量1.2mg/L"的优化配比方案。');
      t.dosingRate = 6.0;
      aStatuses.dosing = 'processing';
      aLogs.dosing = [
        { id: `dos_${stamp}`, time: stamp, message: '方案生成：1-A投加泵调频至45Hz，高精度工艺投药追加 +1.2 mg/L。', type: 'info' },
        ...aLogs.dosing
      ];
      setPayload([...payloadLogs, '[加药系统] AI算法完成模型迭代仿真。生成最优补偿剂量配比。']);
      break;
    case 6:
      setTitle('【步骤6/8】控制指令直接安全下发执行');
      setDesc('AI安全沙箱校验指令合法后，无需现场人工，直接向可编程控制器（PLC）变频器触发强制写入。');
      t.energyConsumption = 0.25;
      setPayload([...payloadLogs, '[执行控制] 沙箱比对完成，策略合法，无振荡冲突。向PLC设备安全高速覆写寄存器值。']);
      break;
    case 7:
      setTitle('【步骤7/8】高位智能执行机构高速到位动作');
      setDesc('混凝区变频加药泵高精度动作，流量计监测到加药量随之上升，浊度沉积链条迅速回归反应梯度中。');
      t.chemicalLevel = 70;
      aLogs.dosing = [
        { id: `dos_${stamp}`, time: stamp, message: 'PLC执行器反馈：1-A泵调频确认，液流量已稳定升至6.0 mg/L。', type: 'success' },
        ...aLogs.dosing
      ];
      setPayload([...payloadLogs, '[现场硬件] 1-A混凝增压变频泵高速闭环。工艺回流反应形成。']);
      break;
    case 8:
      setTitle('【步骤8/8】混凝浑浊消解，出水各项指标全面恢复');
      setDesc('由于智能闭环超速介入，浑浊杂质被彻底沉淀吸收。出水浊度重返0.04 NTU完美线，多智能体恢复低功耗巡检。');
      t.inletTurbidity = 18.5;
      t.outletTurbidity = 0.04;
      t.healthScore = 99;
      aStatuses.supervisor = 'monitoring';
      aStatuses.dosing = 'monitoring';
      aStatuses.uf = 'monitoring';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '水质跟踪显示浊度完全脱困。智能体联勤网络变回常态巡视阶段。', type: 'success' },
        ...aLogs.supervisor
      ];
      aLogs.dosing = [
        { id: `dos_${stamp}`, time: stamp, message: '本轮混凝极值波动处置结束。过程药剂配比完美命中。', type: 'success' },
        ...aLogs.dosing
      ];
      setPayload([...payloadLogs, '[运营总结] 闭环运行良好。受灾区间持续为0s，本轮协同减低多余药耗费率达 14.5%！', '[运营状态] 全厂指标全面复苏。']);
      break;
  }
}

export function applyUfStep(
  step: number, stamp: string,
  t: TelemetryState, aStatuses: StatusMap, aLogs: LogMap, payloadLogs: string[],
  setTitle: SetStr, setDesc: SetStr, setPayload: SetLogs
) {
  switch (step) {
    case 1:
      setTitle('【步骤1/8】超滤阻塞：跨膜压差峰值恶化');
      setDesc('中部超滤A通道检测到细悬浮颗粒沉积，跨膜压差(TMP)瞬间从 82kPa 突破警报阈值 180kPa。');
      t.ufPressure = 220;
      t.healthScore = 80;
      aStatuses.uf = 'warning';
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '高能警告：超滤组A阀前端跨膜压力突破 220 kPa。过滤阻力升高！', type: 'warning' },
        ...aLogs.uf
      ];
      setPayload(['[系统警报] 中游超滤阀段跨膜压差瞬时超过二级极限。', '[超滤智能体] 捕获膜片孔道孔径极度压缩。']);
      break;
    case 2:
      setTitle('【步骤2/8】故障断面参数高速上送分析');
      setDesc('流变特性，液位反馈，及泵机瞬时负荷打包上传。多维监控看板启动全局渲染状态监控。');
      setPayload([...payloadLogs, '[信道传输] 超滤物理断面高速以双向光纤注入中心控制柜。', '[事件汇聚] A模块堵积系数 0.82 已建卡记录。']);
      break;
    case 3:
      setTitle('【步骤3/8】监管总管启动全拓扑联合诊断');
      setDesc('总管智能体整合工艺链路，发觉由于前期大颗粒穿透，引起超滤微通道局部堵塞。排除设备损坏，下发反洗调度。');
      aStatuses.supervisor = 'warning';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '分析结论：非泵机故障。应通过临时逆流脉冲反洗清理超滤A膜。', type: 'warning' },
        ...aLogs.supervisor
      ];
      setPayload([...payloadLogs, '[主管大脑] 进行工况拟合，证实为高杂质负荷吸附。触发针对性"逆流水气充能反洗"最优推算。']);
      break;
    case 4:
      setTitle('【步骤4/8】协调反洗任务下发与过流切换');
      setDesc('总管调度超滤单元关闭A管，切换流量载荷至B、C超滤常态组，确保全厂产水量无瞬态流失。');
      aStatuses.supervisor = 'processing';
      aStatuses.uf = 'processing';
      t.outletFlow = 1180;
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '正在对A滤柱执行切出并流闭合... 导向超滤备份B/C过水。', type: 'info' },
        ...aLogs.uf
      ];
      setPayload([...payloadLogs, '[工艺切换] 切换阀组动作中，流道2打开，流道1屏蔽，保证水产流输送无中断。']);
      break;
    case 5:
      setTitle('【步骤5/8】智能反洗气水联冲模型计算');
      setDesc('超滤智能体设计特定时长30秒、反洗水流量1.5倍、鼓气增压反冲方案。精准剥离管壁附着物，规避传统过度磨损。');
      t.energyConsumption = 0.32;
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '自适应反缩动力方案设定：气顶反冲 4.2bar，反洗强度 20 L/m²s。', type: 'info' },
        ...aLogs.uf
      ];
      setPayload([...payloadLogs, '[优化推导] 物理壁孔附着曲线建立。获取最佳冲洗时长及回转冲洗速度。']);
      break;
    case 6:
      setTitle('【步骤6/8】PLC指令覆盖与过程安全监护');
      setDesc('自动注入高精度冲洗参数至超滤PLC主板，系统监测管道水锤效应防止憋压破管。');
      setPayload([...payloadLogs, '[安全监管] 重负载动作自诊断无风险，冲洗命令启动写入。']);
      break;
    case 7:
      setTitle('【步骤7/8】反洗电动阀组动作与颗粒物强制排废');
      setDesc('气水双向气顶反洗，观察到压差开始飞速下落。污物回冲彻底冲离流道，导入地下沉泥网管。');
      t.ufPressure = 120;
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '脉冲反洗阀动作，鼓风泵注入完成，反洗阻力从高位脱出。', type: 'success' },
        ...aLogs.uf
      ];
      setPayload([...payloadLogs, '[执行回执] 压缩空气顶回成功。浑浊度沉降渣迅速回抽完毕。']);
      break;
    case 8:
      setTitle('【步骤8/8】阻力测定健康归零，系统产水无感恢复');
      setDesc('超滤A柱透水压差重返原点 (82 kPa)。产水通量完全顺滑复原。多智能体联控闭环保障完毕。');
      t.ufPressure = 82;
      t.outletFlow = 1210;
      t.healthScore = 98;
      aStatuses.supervisor = 'monitoring';
      aStatuses.uf = 'monitoring';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '超滤阻力异常故障修复，总管智能体切换全厂为低碳巡航模式。', type: 'success' },
        ...aLogs.supervisor
      ];
      aLogs.uf = [
        { id: `uf_${stamp}`, time: stamp, message: '跨膜压差重置：82 kPa！超滤柱通导重回最优。', type: 'success' },
        ...aLogs.uf
      ];
      setPayload([...payloadLogs, '[监控归档] 故障本底压差清理系数：100%。本轮免除人工检修工时 4.2小时。']);
      break;
  }
}

export function applyRoStep(
  step: number, stamp: string,
  t: TelemetryState, aStatuses: StatusMap, aLogs: LogMap, payloadLogs: string[],
  setTitle: SetStr, setDesc: SetStr, setPayload: SetLogs
) {
  switch (step) {
    case 1:
      setTitle('【步骤1/8】膜组件衰减：产水通量滑落');
      setDesc('右侧高精膜区产水通量降至临界 45 LMH（额定 75 LMH）。系统能耗上升，膜组件出现浓化失衡迹象。');
      t.roFlux = 45;
      t.healthScore = 78;
      t.energyConsumption = 0.28;
      aStatuses.ro = 'warning';
      aLogs.ro = [
        { id: `memb_${stamp}`, time: stamp, message: '能效警告：终端膜区产水通量暴跌至 45 LMH，泵功耗升高！', type: 'warning' },
        ...aLogs.ro
      ];
      setPayload(['[工艺警报] 终端膜过滤区域产生有机沉淀物极化，膜通量滑落超25%。', '[膜智能体] 捕捉产水通道能效转换指数下滑。']);
      break;
    case 2:
      setTitle('【步骤2/8】感知探针工艺谱分析并上送中心');
      setDesc('膜丝表面浓差极化数据、实时透盐率、能耗指数封装广播。');
      setPayload([...payloadLogs, '[总线数据] 终端流阻衰减、实时温度、PH耦合信号上送。']);
      break;
    case 3:
      setTitle('【步骤3/8】监管总控制定自校正能效方案');
      setDesc('监管总管通过分析，决策不需整机停开机，而是通过在线瞬时提升错流流速并调整出水侧阻尼阀。');
      aStatuses.supervisor = 'warning';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '诊断广播：终端极化过载。推荐调高泵流速 + 出泥扫尾。', type: 'warning' },
        ...aLogs.supervisor
      ];
      setPayload([...payloadLogs, '[架构推演] 为避免深度堵塞，主管命令：对膜丝表面剪切力变频倍率提升 1.5 倍。']);
      break;
    case 4:
      setTitle('【步骤4/8】协同变压清洗并下发调度指令');
      setDesc('调度出水压力侧变频调校，并提示前置超滤智能体配合降低前端粗水阀，保护膜丝应力分布。');
      aStatuses.supervisor = 'processing';
      aStatuses.ro = 'processing';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '派发调度链：降低超滤排量 5%，提振膜区底压冲刷层。', type: 'info' },
        ...aLogs.supervisor
      ];
      aLogs.ro = [
        { id: `memb_${stamp}`, time: stamp, message: '接授命令，调升循环错流泵。膜丝自清洁阀完全启动。', type: 'info' },
        ...aLogs.ro
      ];
      setPayload([...payloadLogs, '[任务派发] 发起精细膜保护错流清洗指令，全流程联动。']);
      break;
    case 5:
      setTitle('【步骤5/8】两相错流剪切清洗曲线推算');
      setDesc('膜智能体自适应获取洗流流速，设定"增压泵调频至48Hz，自剪力层水力冲击 1.25 m/s"的三级冲洗工艺。');
      aLogs.ro = [
        { id: `memb_${stamp}`, time: stamp, message: '方案生成：循环冲刷流量 12.5 m³/s 错流高风清洗。', type: 'info' },
        ...aLogs.ro
      ];
      setPayload([...payloadLogs, '[模型寻优] 基于膜壁剪切阻抗矩阵算法，拟合出变压剪切冲刷路径。']);
      break;
    case 6:
      setTitle('【步骤6/8】网络安全校验及PLC软硬件握手');
      setDesc('系统校核压力突变曲线处于最高静水应力（0.6MPa）安全裕度内，指令被迅速注入底层。');
      setPayload([...payloadLogs, '[通信握手] PLC 侧完成膜体安全状态机锁定，动作开始。']);
      break;
    case 7:
      setTitle('【步骤7/8】高压冲洗机构响应，析出淤积附着物');
      setDesc('错流循环泵输出激升，冲刷掉膜表面的矿物质微细附着体，浊度与电导度快速恢复一致。');
      t.roFlux = 68;
      aLogs.ro = [
        { id: `memb_${stamp}`, time: stamp, message: '现场反馈：电液循环错洗启动。极化结晶析出通畅，产水能力上升！', type: 'success' },
        ...aLogs.ro
      ];
      setPayload([...payloadLogs, '[在线自洁] 精分孔错流剥离完成。浓缩物彻底回流排出。']);
      break;
    case 8:
      setTitle('【步骤8/8】产水通量完全回升，出水质量完美归拢');
      setDesc('最终末端膜通量跃升重回 75.2 LMH 峰值，单顿出水综合能耗重设为 0.18 kWh，警报全面解除。');
      t.roFlux = 75.2;
      t.energyConsumption = 0.18;
      t.healthScore = 98;
      aStatuses.supervisor = 'monitoring';
      aStatuses.ro = 'monitoring';
      aLogs.supervisor = [
        { id: `mast_${stamp}`, time: stamp, message: '膜通量自校正结束。全厂水力输出重回低耗静音状态。', type: 'success' },
        ...aLogs.supervisor
      ];
      aLogs.ro = [
        { id: `memb_${stamp}`, time: stamp, message: '自洗完成，通量调校为 75.2 LMH 额定产水点。工艺健壮性 100%', type: 'success' },
        ...aLogs.ro
      ];
      setPayload([...payloadLogs, '[闭环收盘] 本轮极化自清洁阻力降幅 94.1%。成功规避强酸化学酸洗。']);
      break;
  }
}
