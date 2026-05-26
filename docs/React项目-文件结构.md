# 水厂智能操作系统 — React 项目文件结构

> 技术栈：React 18 + TypeScript + Vite + React Three Fiber + Zustand

---

## 目录结构

```
water-plant-os/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                               # 入口：渲染 App
│   ├── App.tsx                                # 根组件：SystemProvider + Desktop
│   ├── vite-env.d.ts
│   │
│   ├── types/                                 # TypeScript 类型定义
│   │   ├── agent.ts                           # Agent 类型（状态、数据、角色）
│   │   ├── scenario.ts                        # 场景/事件类型 + ScenarioPhase 枚举
│   │   ├── equipment.ts                       # 设备参数类型（阈值、单位、参考范围）
│   │   └── index.ts                           # 统一导出
│   │
│   ├── store/                                 # Zustand 状态管理
│   │   ├── useSystemStore.ts                  # 全局系统状态（在线/告警/健康度/日志）
│   │   ├── useAgentStore.ts                   # 5个Agent的实时数据（仅存数据值）
│   │   ├── useScenarioStore.ts                # 场景阶段主控（phase + 步骤 + 动画触发）
│   │   └── useUIStore.ts                      # UI状态（窗口列表/面板/聚焦目标）
│   │
│   │   # 数据流动约束（唯一状态源）：
│   │   # useScenarioStore.phase → useDataSimulation
│   │   #   → useAgentStore（更新实时数据）
│   │   #   → useSystemStore（聚合派生状态：告警数/健康度）
│   │   # 不允许跨 store 互写

│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts            # 键盘快捷键 F1~F4/?/Esc/Ctrl+Shift+D
│   │   ├── useDataSimulation.ts               # 唯一模拟引擎：渐进偏移 + 阶段驱动 + 背景波动
│   │   ├── useCameraFocus.ts                  # 3D 摄像机聚焦/恢复过渡控制
│   │   └── useAgentStatus.ts                  # Agent 四态机（正常→待处理→异常闪烁→恢复）
│   │
│   ├── components/
│   │   ├── desktop/                           # ===== OS 桌面层 =====
│   │   │   ├── Desktop.tsx                    # 桌面容器（Grid: Dock | 3D | InfoPanel）
│   │   │   ├── TopBar.tsx                     # 顶栏：系统名称 + 状态指示
│   │   │   ├── Taskbar.tsx                    # 底部任务栏：首页按钮/窗口标签/通知图标/时钟
│   │   │   ├── Dock.tsx                       # 左侧应用坞：5个Agent图标
│   │   │   ├── DockIcon.tsx                   # 单个图标（状态灯+角标+闪烁）
│   │   │   ├── NotificationToast.tsx          # 系统通知弹窗（右上角弹出，单条队列）
│   │   │   └── ShortcutHelp.tsx               # 快捷键帮助浮层（? 触发）
│   │   │
│   │   │   ├── info/                          # — 右侧信息面板（替代原 panels/）—
│   │   │   │   ├── InfoPanel.tsx              # 右侧面板容器
│   │   │   │   ├── CurrentAgentBadge.tsx      # 当前代理显示
│   │   │   │   ├── ThinkingCard.tsx           # AI 思考摘要（与 3D 气泡同步）
│   │   │   │   ├── DecisionChain.tsx          # 场景阶段步骤链
│   │   │   │   └── EventLog.tsx               # 事件日志列表（max 20条）
│   │   │   │
│   │   │   └── overlay/                       # — 3D 视口覆盖层 —
│   │   │       ├── MetricsOverlay.tsx         # 顶部概览指标（告警数/产水/健康度）
│   │   │       └── TimelineBar.tsx            # 底部流程时间轴
│   │   │
│   │   ├── window/                            # ===== 窗口系统 =====
│   │   │   ├── WindowManager.tsx              # 多窗口管理器（单例窗口，最多5个）
│   │   │   ├── AgentWindow.tsx                # 通用窗口外壳
│   │   │   ├── WindowTitleBar.tsx             # 标题栏（状态灯+名称+最小化/关闭）
│   │   │   └── ResizeHandle.tsx               # 缩放手柄
│   │   │
│   │   ├── scene3d/                           # ===== 3D 场景 (R3F) =====
│   │   │   ├── Scene3D.tsx                    # 主场景（Canvas + 全局配置）
│   │   │   ├── CameraController.tsx           # OrbitControls + 聚焦过渡
│   │   │   ├── Ground.tsx                     # 地面/网格
│   │   │   │
│   │   │   ├── equipment/                     # — 设备模型（第一阶段几何体占位）—
│   │   │   │   ├── SupervisorHub.tsx          # 监管中枢（发光圆柱+光环，含自身思考气泡）
│   │   │   │   ├── DosingModule.tsx           # 加药模块（药箱+泵+阀门）
│   │   │   │   ├── UFModule.tsx               # 超滤模块（3超滤柱+阀组）
│   │   │   │   ├── ROModule.tsx               # 反渗透模块（3膜组+循环泵）
│   │   │   │   └── PumpModule.tsx             # 泵组模块
│   │   │   │
│   │   │   ├── agents/                        # — 4个专项Agent 3D表现（不含监管）—
│   │   │   │   ├── AgentNode.tsx              # 发光球体（×4，悬浮设备上方）
│   │   │   │   ├── StatusGlow.tsx             # 闪烁/颜色状态效果
│   │   │   │   └── ThinkingBubble.tsx         # 3D思考气泡（打字机效果，点击跳转）
│   │   │   │
│   │   │   ├── pipelines/                     # — 管道与粒子 —
│   │   │   │   ├── PipelineSystem.tsx         # 管道系统（监管↔各模块）
│   │   │   │   ├── ParticleFlow.tsx           # 粒子沿管道飞行（三色切换）
│   │   │   │   └── ParticleEmitter.tsx        # 粒子发射器
│   │   │   │
│   │   │   └── effects/                       # — 视觉特效 —
│   │   │       ├── AlarmFlash.tsx             # 设备红色闪烁
│   │   │       ├── RecoveryGradient.tsx       # 红→绿恢复
│   │   │       └── DeviceAction.tsx           # 阀门旋转/泵转动
│   │   │
│   │   ├── agent-detail/                      # ===== Agent 详情窗口 =====
│   │   │   ├── SupervisorPanel.tsx            # 监管智能体详情
│   │   │   ├── DosingPanel.tsx                # 加药智能体详情
│   │   │   ├── UFPanel.tsx                    # 超滤智能体详情
│   │   │   ├── ROPanel.tsx                    # 反渗透智能体详情
│   │   │   ├── PumpPanel.tsx                  # 泵组智能体详情
│   │   │   ├── MetricsCard.tsx                # 单个参数卡片（数值+参考范围+状态色）
│   │   │   ├── AIAnalysisView.tsx             # AI 根因分析展示
│   │   │   └── ControlPanel.tsx               # 执行按钮
│   │   │
│   │   └── common/                            # ===== 通用组件 =====
│   │       ├── StatusLight.tsx                # 状态灯（绿/黄/红/闪烁/呼吸）
│   │       ├── RiskBadge.tsx                  # 风险等级徽章
│   │       └── IconButton.tsx                 # 主题按钮
│   │
│   ├── data/                                  # 数据定义 & 模拟
│   │   ├── agents.ts                          # 5个Agent元数据（名称/颜色/角色/设备清单）
│   │   ├── scenarios.ts                       # 4个异常场景的完整剧本
│   │   ├── equipmentConfig.ts                 # 各设备参数阈值/单位/参考范围
│   │   └── constants.ts                       # 颜色/动画时长/场景尺寸/快捷键
│   │
│   ├── utils/
│   │   ├── format.ts                          # 数值格式化/单位拼接
│   │   └── cameraTransitions.ts               # 摄像机平滑过渡算法
│   │
│   └── styles/
│       ├── theme.css                          # CSS 变量（深色科技风配色系数）
│       └── global.css                         # 全局重置/字体/滚动条
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 核心组件依赖关系

```
App.tsx
└── SystemProvider（提供 store 上下文）
    └── Desktop（Grid: Dock | 3D + overlay | InfoPanel）
        ├── TopBar                              ← useSystemStore
        │
        ├── Dock                                ← useAgentStore
        │   └── DockIcon ×5                     ← 各自状态
        │
        ├── Scene3D (Canvas)
        │   ├── CameraController                ← useCameraFocus
        │   ├── Lights / Ground
        │   ├── SupervisorHub                   ← useScenarioStore(phase)
        │   ├── DosingModule / UFModule / ROModule / PumpModule
        │   │                                   ← useAgentStore(各自metrics)
        │   ├── AgentNode ×4                    ← useAgentStore(各自status)
        │   │   └── ThinkingBubble              ← useScenarioStore(phase)
        │   │   └── StatusGlow                  ← useAgentStore(状态)
        │   ├── PipelineSystem
        │   ├── ParticleFlow                    ← useScenarioStore(phase)
        │   ├── AlarmFlash                      ← useScenarioStore(phase==detected)
        │   ├── DeviceAction                    ← useScenarioStore(phase==operating)
        │   ├── RecoveryGradient                ← useScenarioStore(phase==recovering)
        │   │
        │   ├── MetricsOverlay (top)            ← useSystemStore
        │   └── TimelineBar (bottom)            ← useScenarioStore(step)
        │
        ├── InfoPanel (right)
        │   ├── CurrentAgentBadge               ← useScenarioStore
        │   ├── ThinkingCard                    ← useScenarioStore
        │   ├── DecisionChain                   ← useScenarioStore
        │   └── EventLog                        ← useSystemStore
        │
        ├── Taskbar                             ← useUIStore
        │   ├── HomeButton
        │   ├── WindowTabs
        │   └── SystemTray
        │
        ├── NotificationToast                   ← useSystemStore(notifications)
        └── ShortcutHelp                        ← useUIStore

    └── WindowManager（position:absolute，最多5窗口）
        └── AgentWindow ×N（单例，可拖拽）
            ├── WindowTitleBar                  ← 四态样式映射
            ├── DosingPanel / UFPanel / ROPanel / PumpPanel / SupervisorPanel
            │   ├── MetricsCard ×4
            │   ├── AIAnalysisView
            │   └── ControlPanel
            └── ResizeHandle
```

---

## 数据流

```
键盘 F1~F4
    │
    ▼
useKeyboardShortcuts
    │
    ▼
useScenarioStore.setPhase(ANOMALY_DETECTED)
    │
    ├── 红色粒子（设备→监管）
    ├── useDataSimulation（渐进偏移模拟）
    │       │
    │       └── useAgentStore.metrics（更新实时数据）
    │               │
    │               ├── Scene3D 渲染（设备闪烁、粒子飞行）
    │               └── InfoPanel / AgentWindow 渲染
    │
    ├── useScenarioStore.setPhase(SUPERVISOR_ANALYZING)
    │       └── 监管中枢发光 + 思考气泡弹出（打字机效果）
    │
    ├── useScenarioStore.setPhase(DISPATCHING)
    │       └── 橙色粒子（监管→专项Agent）
    │
    ├── useScenarioStore.setPhase(AGENT_ANALYZING)
    │       └── 专项Agent闪烁 + 思考气泡弹出
    │
    ├── useScenarioStore.setPhase(EXECUTING)
    │       ├── 绿色粒子（Agent→设备）
    │       ├── useCameraFocus.lockTo(equipment)
    │       └── DeviceAction 开始
    │
    ├── useScenarioStore.setPhase(DEVICE_OPERATING)
    │       └── 阀门旋转/泵转动/参数恢复（持续 2-3s）
    │
    ├── useScenarioStore.setPhase(RECOVERING)
    │       ├── useCameraFocus.release() → 恢复全局
    │       └── RecoveryGradient（红→绿）
    │
    └── useScenarioStore.setPhase(RECOVERED)
            ├── 保持 2s 后自动 setPhase(IDLE)
            └── selector 派生 → useSystemStore 展示态自动更新
```

---

## 依赖包

| 包名 | 用途 |
|------|------|
| `react`, `react-dom` | 核心框架 |
| `typescript` | 类型系统 |
| `vite` | 构建工具 |
| `@react-three/fiber` | React 化的 Three.js |
| `@react-three/drei` | 工具库（OrbitControls, Text, Html, Instances 等） |
| `three` | Three.js 引擎 |
| `zustand` | 轻量状态管理 |
| `react-draggable` | 窗口拖拽 |

> `@react-three/drei` 的 `Html` 用于 3D 空间渲染 HTML（思考气泡），`OrbitControls` 提供轨道控制，`CameraControls` 提供平滑聚焦。
