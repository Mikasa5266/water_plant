# 前端实施计划 — 人员 A（OS 桌面 + UI 层）

> 日期：2026-05-28
> 职责范围：`components/`、`hooks/`、`stores/`、`features/`、`data/`、`api/`、`pages/`
> 不涉及：`simulation3d/` 目录（人员 B 负责）

---

## 当前完成度评估（A 负责部分）

| 模块 | 完成度 | 说明 |
|------|--------|------|
| OS 桌面框架（Dock/Taskbar/Window/Notification） | 95% | 全部组件可用 |
| Zustand 状态机（9 阶段） | 100% | 完整实现 |
| 模拟引擎（4 场景 × 8 步骤） | 100% | stepAppliers 完整 |
| Agent 窗口（拖拽/缩放/状态灯/数据卡片） | 95% | 四态映射已实现 |
| 键盘快捷键 + Esc 优先级 | 90% | Ctrl+1-4 触发，需改为 F1-F4 |
| 右侧 InfoPanel（思考/决策链/事件日志） | 85% | 基础实现，内容和动画需增强 |
| 演示控制面板 | 70% | 有基础触发，缺完整编排控制 |
| HeaderHUD 顶部指标 | 80% | 静态数字，缺动态效果 |

**核心差距：** 自动播放编排、参数渐变、AI 思维链深度内容、数据卡片动画。

---

## 第一优先级：演示流程打磨

### 1. 自动演示模式（Auto-Demo）

- **文件：** `src/features/simulation/useAutoDemo.ts`（新建）
- **现状：** DemoControlPanel 有基础触发，但需手动操作
- **目标：** 一键启动 → 系统全自动走完"异常检测→AI分析→派发→执行→恢复"全流程
- **实现要点：**
  - 提供 `startAutoDemo(scenarioId)` 方法
  - 内部用定时器按预设节奏推进每个阶段（每阶段停留时间可配置）
  - 支持暂停/继续/重播
  - 演示结束后自动回到 IDLE，等待下一次触发
  - 可选"循环模式"：4 个场景依次自动播放
  - 与 useSimulation 协作，不重复造轮子

### 2. AI 思维链内容丰富化

- **文件：** `src/data/thinkingScripts.ts`（新建）
- **现状：** 思考内容是简单几行文字
- **目标：** 每个场景编写 8-12 条逼真的 AI 推理要点
- **内容结构（以加药异常为例）：**
  ```
  阶段：监管分析
  - "检测到加药泵频率异常升高：当前 42.3Hz，正常范围 20-35Hz"
  - "关联分析：出水浊度同步上升至 3.2 NTU（阈值 2.5）"
  - "排除设备故障可能：泵体温度正常，无机械振动异常"
  - "初步判断：投加控制回路 PID 参数漂移，导致过量投加"
  - "置信度评估：87.3%（基于历史相似工况 23 例）"
  - "建议方案：切换备用泵 + 重置 PID 参数 + 观察 5min"

  阶段：专项 Agent 推演
  - "接收监管指令：执行加药系统应急处置"
  - "方案验证：备用泵 B 状态正常，最近维护时间 3 天前"
  - "计算切换时序：先降频→切换→升频，避免水锤效应"
  - "预计恢复时间：2-3 分钟"
  ```
- **4 个场景都需要完整脚本**（加药/超滤/反渗透/泵组）

### 3. 决策链可视化增强

- **文件：** `src/components/InfoPanel/DecisionChain.tsx`（新建或从 InfoPanel 拆出）
- **现状：** 简单步骤列表
- **增强内容：**
  - 步骤间竖向连线 + 当前步骤脉冲动画
  - 每步显示置信度百分比（如 "87.3%"）
  - 已完成步骤打勾 + 绿色
  - 当前步骤蓝色高亮 + 加载动画
  - 待执行步骤灰色
  - 底部显示"预计总耗时：2min 30s"

### 4. 参数渐变模拟（非跳变）

- **文件：** `src/features/simulation/telemetrySimulator.ts`（新建）
- **现状：** stepAppliers 离散跳变
- **目标：** 按规划书要求"正常数据→缓慢偏移(约3s)→超出阈值→触发告警"
- **实现要点：**
  - 提供 `animateValue(from, to, duration, easing)` 插值函数
  - 异常触发后，参数用 3s 渐变到越限值（不是瞬间跳变）
  - 恢复阶段，参数用 5s 渐变回正常值
  - 使用 requestAnimationFrame 驱动，每帧更新 store
  - 正常态下参数有 ±0.5% 的微小随机波动（看起来像真实采集）

---

## 第二优先级：UI 视觉增强

### 5. 顶部指标实时跳动

- **文件：** `src/components/HeaderHUD.tsx` 改造
- **增强内容：**
  - 数字变化时有滚动动画（CountUp 效果）
  - 正常态下数字有微小波动（每 2-3s 变化 ±1）
  - 异常时告警数字变红 + 脉冲放大
  - 健康度从"良好"变"注意"时有颜色过渡

### 6. Agent 窗口数据卡片动画

- **文件：** `src/components/AgentWindow/MetricCard.tsx`（新建或改造）
- **增强内容：**
  - 数值变化时平滑过渡（CSS transition 或 motion 库）
  - 越限值红色高亮 + 边框脉冲
  - 恢复时绿色渐变回白色
  - 参考范围以进度条形式可视化（当前值在范围内的位置）

### 7. InfoPanel 打字机效果优化

- **文件：** `src/components/InfoPanel/InfoPanel.tsx` 改造
- **增强内容：**
  - 思考内容逐条出现时有淡入 + 左滑动画
  - 正在输出的行末尾有光标闪烁
  - 输出完成后光标消失
  - 内容超出面板高度时自动滚动到底部

### 8. 底部时间轴增强

- **文件：** `src/components/BottomTimeline.tsx` 改造
- **增强内容：**
  - 当前阶段节点有脉冲动画
  - 已完成阶段连线变亮（从灰到蓝/绿渐变）
  - 每个节点 hover 显示该阶段简要说明
  - 显示当前阶段的解说词（配合任务 14 的 narratives 数据）

---

## 第三优先级：交互完善

### 9. 演示控制面板重做

- **文件：** `src/components/DemoControlPanel/` 重构
- **新面板功能：**
  - 场景选择：加药异常 / 超滤堵塞 / 反渗透污染 / 泵组过载
  - 模式切换：自动演示 / 手动步进
  - 播放控制：播放 / 暂停 / 下一步 / 重置
  - 速度控制：0.5x / 1x / 2x
  - 当前进度：显示"第 3/8 步 - AI 分析中"
  - 面板位置：左下角，可折叠，不遮挡主视口
  - 快捷键提示：底部小字显示 F1-F4 对应场景

### 10. 通知→窗口联动

- **文件：** `src/components/Notification/Notification.tsx` 改造
- **改动：**
  - 通知增加"查看详情 →"按钮
  - 点击按钮 → 调用 windowStore.openWindow(agentId) + focusWindow
  - 异常通知关联对应的 agentId

### 11. 快捷键改为 F1-F4

- **文件：** `src/hooks/useKeyboard.ts` 改造
- **改动：**
  - F1 → 加药异常场景
  - F2 → 超滤异常场景
  - F3 → 反渗透异常场景
  - F4 → 泵组异常场景
  - 保留 Ctrl+1-4 作为备用（兼容）
  - 场景进行中按 F1-F4 忽略（规划书要求）

### 12. Esc 优先级完善

- **文件：** `src/hooks/useKeyboard.ts` 改造
- **确保优先级：**
  1. 帮助浮层打开 → 关闭浮层
  2. 场景进行中 → 终止场景回 IDLE
  3. 通知弹出 → 关闭通知
  4. Agent 窗口打开 → 最小化当前窗口
  5. 无打开项 → 无操作

### 13. HelpOverlay 快捷键面板完善

- **文件：** `src/components/HelpOverlay/HelpOverlay.tsx` 改造
- **内容：**
  - 更新为 F1-F4 映射
  - 加入所有辅助快捷键说明
  - 样式：半透明深色面板，居中显示
  - `?` 或 `F12` 触发显示/隐藏

---

## 第四优先级：数据层与可替换性

### 14. 场景脚本数据外置

- **文件：** `src/data/scenarioScripts/`（新建目录）
  - `dosing.ts` — 加药异常完整脚本
  - `uf.ts` — 超滤堵塞完整脚本
  - `ro.ts` — 反渗透污染完整脚本
  - `pump.ts` — 泵组过载完整脚本
- **每个脚本包含：**
  - 各阶段的思考内容（ThinkingContent）
  - 决策链步骤（DecisionStep[]）
  - 参数变化目标值和时序
  - 事件日志文本
  - 通知文案
- **目的：** 非开发人员可直接编辑演示话术

### 15. 演示话术/解说词配置

- **文件：** `src/data/narratives.ts`（新建）
- **用途：** 为演示人员提供每个阶段的解说提示
- **展示位置：** 底部时间轴的描述区域，或 InfoPanel 底部
- **示例：**
  ```
  ANOMALY_DETECTED: "此时系统检测到加药泵频率异常，数据自动上报至监管智能体"
  SUPERVISOR_ANALYZING: "监管智能体正在进行多维度关联分析，结合历史工况数据"
  DISPATCHING: "分析完成，监管智能体将处置任务派发给加药专项智能体"
  ```

### 16. Mock API 适配器模式

- **文件：** `src/api/mockAdapter.ts`（新建）
- **架构：**
  ```
  api/index.ts          → 统一入口
  api/mockAdapter.ts    → 演示阶段，返回本地 mock 数据
  api/realAdapter.ts    → 第二阶段，调真实后端 API
  api/types.ts          → 请求/响应类型定义
  ```
- **切换方式：** 环境变量 `VITE_API_MODE=mock|real`

---

## 执行节奏建议

```
第 1 周：任务 1-4（核心演示流程，做完可以内部试演）
第 2 周：任务 5-8（UI 动画打磨，做完看起来像成品）
第 3 周：任务 9-13（交互细节，做完演示不出错）
第 4 周：任务 14-16（数据外置+架构，为第二阶段铺路）
```

---

## 与人员 B（3D 场景）的协作接口

A 写入 store → B 从 store 读取驱动 3D 动画，具体：

| A 负责写入 | B 负责消费 | 说明 |
|-----------|-----------|------|
| `scenarioStore.phase` | 3D 动画切换 | A 推进阶段，B 按阶段播放对应动画 |
| `scenarioStore.particleIntent` | 粒子颜色/方向 | A 设置意图，B 渲染粒子 |
| `scenarioStore.cameraFocus` | 摄像机聚焦 | A 设置目标，B 执行聚焦 |
| `scenarioStore.deviceFlashing` | 设备闪烁 | A 设置哪个设备闪，B 渲染闪烁 |
| `scenarioStore.activeAgent` | Agent 节点高亮 | A 设置当前 Agent，B 高亮对应球体 |
| `scenarioStore.thinkingContent` | 思考气泡内容 | A 写入文本，B 在 3D 中渲染气泡 |
| `systemStore.fps` | LOD 降级 | B 写入 FPS，B 自己消费做降级 |

**原则：A 不改 `simulation3d/` 目录，B 不改 `components/` 目录。**
