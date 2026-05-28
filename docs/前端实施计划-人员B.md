# 前端实施计划 — 人员 B（3D 场景 + 动画引擎）

> 日期：2026-05-28
> 职责范围：`simulation3d/` 目录
> 不涉及：`components/`、`stores/`（只读消费 store，不写入）

---

## 当前完成度评估（B 负责部分）

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 3D 场景布局（5 模块空间定位） | 95% | 几何体占位完成 |
| 监管中枢模型（发光圆柱+光环） | 100% | SupervisorHub 完整 |
| 4 个专项 Agent 球体 | 100% | AgentNode 完整 |
| 管道系统 | 90% | PipelineSystem 完整 |
| 粒子飞行系统（红/橙/绿） | 90% | ParticleSystem 完整 |
| 摄像机聚焦/恢复 | 100% | CameraController 完整 |
| 思考气泡（3D HTML overlay） | 90% | ThinkingBubble 完整 |
| 设备动画（阀门旋转/泵转动） | 85% | DeviceAction 基础实现 |
| 设备闪烁（AlarmFlash） | 90% | 基础实现 |
| 恢复渐变（RecoveryGradient） | 90% | 基础实现 |
| 环境氛围（地面/雾气/光照） | 30% | 仅基础光照 |
| IDLE 态背景动画 | 40% | Agent 呼吸有，设备微动/水流缺 |
| LOD 降级 | 0% | 未实现 |
| 设备点击交互 | 0% | 未实现 |
| GLB 模型加载器 | 0% | 未实现（等厂家模型） |

---

## 第一优先级：IDLE 态活力（让系统看起来"活着"）

### 1. IDLE 态背景动画

- **文件：** `src/simulation3d/effects/IdleAnimation.tsx`（新建）
- **实现内容：**
  - 监管中枢光环缓慢旋转（已有，确认速度合适）
  - 管道内低速蓝色粒子持续流动（表示水在流）
  - 设备微动：泵组轻微振动、超滤柱顶部压力表指针微摆
  - Agent 球体缓慢呼吸发光（已有）
  - 偶尔的数据采集粒子（每 8-10s 一次低速蓝色粒子从随机设备飞向监管，表示"正常数据上报"）

### 2. 管道内水流效果

- **文件：** `src/simulation3d/pipelines/WaterFlow.tsx`（新建）
- **实现方式：**
  - 管道材质使用自定义 shader（UV offset 动画）
  - 或：管道内部放置小型半透明粒子沿路径匀速移动
  - 颜色：淡蓝色半透明，速度缓慢
  - IDLE 态持续运行，异常时可变色（偏红）

---

## 第二优先级：环境氛围（视觉冲击力）

### 3. 3D 场景环境氛围

- **文件：** `src/simulation3d/environment/SceneEnvironment.tsx`（新建）
- **实现内容：**
  - 深色反射地面（MeshReflectorMaterial from drei）
  - 环境雾气（fog near=80 far=200，深蓝色）
  - 设备底部柔光圈（ContactShadows from drei）
  - 可选：简单星空/网格天空盒（科技感）
  - 整体色调：深蓝+青色，工业科技风

### 4. 设备标签 HUD

- **文件：** `src/simulation3d/labels/DeviceLabel.tsx`（新建）
- **实现方式：**
  - 使用 `<Html>` from @react-three/drei
  - 每个设备模块上方悬浮标签："加药模块"、"超滤模块"、"反渗透模块"、"泵组模块"、"监管中枢"
  - 样式：半透明深色背景 + 白色文字 + 细边框
  - 异常时标签变红
  - 距离远时自动隐藏（occlude）

---

## 第三优先级：交互增强

### 5. 3D 设备点击交互

- **文件：** `src/simulation3d/interactions/ClickHandler.tsx`（新建）
- **实现：**
  - 每个设备模块包裹可点击区域（invisible box collider）
  - 鼠标悬停时设备边缘发光（outline effect 或 emissive 增强）
  - 点击 → 调用 windowStore.openWindow(agentId)（唯一允许写 store 的场景）
  - 使用 R3F 的 `onClick` + `onPointerOver/Out` 事件
  - cursor 变为 pointer

### 6. 设备动画细化

- **文件：** `src/simulation3d/effects/DeviceAction.tsx` 改造
- **增强：**
  - 加药模块：阀门旋转 + 泵叶轮转动 + 液位变化
  - 超滤模块：阀组切换动画 + 反洗水流方向反转
  - 反渗透模块：膜片振动 + 循环泵加速
  - 泵组模块：泵体振动加剧 + 温度发红光
  - 每种设备的动画与 EXECUTING/DEVICE_OPERATING 阶段对应

---

## 第四优先级：性能

### 7. LOD 降级实现

- **文件：** `src/simulation3d/useLOD.ts`（新建）
- **逻辑：**
  - 每帧计算 FPS（useFrame + 滑动窗口平均）
  - FPS < 30 持续 2s → LOD1：粒子数量减半，关闭尾迹
  - FPS < 20 持续 2s → LOD2：关闭背景动画，仅保留关键闪烁
  - FPS < 15 持续 2s → LOD3：关闭所有特效，仅静态 3D
  - FPS 恢复后逐级升回
  - LOD 级别写入 useSystemStore.setLOD()，各 3D 组件按级别决定是否渲染

### 8. 粒子系统性能优化

- **文件：** `src/simulation3d/pipelines/ParticleSystem.tsx` 改造
- **确认/优化项：**
  - 使用 `<Points>` + `BufferGeometry` 而非独立 mesh
  - 粒子位置通过 attribute 更新而非 setState
  - useFrame 中用 ref 操作，不触发 React re-render
  - 粒子池化：预分配固定数量，复用而非创建/销毁

---

## 第五优先级：模型热替换准备

### 9. GLB 模型加载器

- **文件：** `src/simulation3d/loaders/ModelLoader.tsx`（新建）
- **实现：**
  - 封装 `useGLTF` + Suspense fallback
  - 配置文件 `src/simulation3d/loaders/modelConfig.ts` 定义每个模块的模型路径
  - 默认 `path: null` = 使用当前几何体占位
  - 模型到位后只需改配置路径，不改组件代码
  - fallback 显示当前几何体

### 10. 模型↔动画解耦验证

- **文件：** `src/simulation3d/equipment/` 各模块
- **检查并确保：**
  - 闪烁动画作用于 group 而非具体 mesh
  - 粒子路径终点是 group position 而非 mesh 内部坐标
  - 设备动画（旋转/振动）作用于可替换的子 group
  - 替换模型时只需替换 `<mesh>` 内容，外层 group + 动画逻辑不变
  - 每个 equipment 组件结构统一为：
    ```tsx
    <group position={pos}>           {/* 动画作用层 */}
      <group ref={animRef}>          {/* 可替换模型层 */}
        {modelPath ? <GLBModel /> : <GeometryPlaceholder />}
      </group>
      <AlarmFlash />                 {/* 特效层 */}
    </group>
    ```

---

## 执行节奏建议

```
第 1 周：任务 1-2（IDLE 态活力，系统看起来在运行）
第 2 周：任务 3-4（环境氛围，视觉冲击力）
第 3 周：任务 5-6（交互+动画细化）
第 4 周：任务 7-10（性能+模型准备，等厂家模型到位）
```

---

## 从 Store 消费的数据（只读）

| Store 字段 | 用途 |
|-----------|------|
| `scenarioStore.phase` | 驱动所有 3D 动画切换 |
| `scenarioStore.particleIntent` | 粒子颜色和方向 |
| `scenarioStore.cameraFocus` | 摄像机聚焦目标 |
| `scenarioStore.deviceFlashing` | 哪个设备需要闪烁 |
| `scenarioStore.activeAgent` | 哪个 Agent 球体高亮 |
| `scenarioStore.thinkingContent` | 思考气泡显示内容 |
| `scenarioStore.incidentType` | 当前异常类型（决定动画细节） |

**唯一允许写入的：** `systemStore.setFPS()` 用于 LOD 计算，`windowStore.openWindow()` 用于设备点击打开窗口。
