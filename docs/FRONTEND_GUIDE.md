# 前端开发规范
最后更新：2026-05-26

## 1. 当前定位

本仓库前端当前是一个 **纯前端 Demo**，技术栈以 **React + TypeScript + Vite** 为准。

这一阶段的重点是：

1. 把现有 Demo 里的页面、状态、3D 场景和交互逻辑拆分清楚。
2. 形成稳定的目录边界，方便多人协作。
3. 预留未来对接真实接口的入口，但本阶段 **不推进后端实现**。

## 2. 技术栈

- React
- TypeScript
- Vite
- React DOM
- lucide-react
- motion
- Tailwind CSS

如果后续需要引入状态管理或 3D 相关库，再根据实际拆分补充，不在本阶段预先堆叠。

## 3. 目录结构

```text
frontend/src/
  app/           # 应用装配层：全局布局、路由壳、Provider、入口编排
  pages/         # 页面级组件，只做组合，不堆业务逻辑
  features/      # 按业务能力拆分的功能模块
  components/    # 跨业务复用的 UI 组件
  simulation3d/  # 3D 场景、相机、设备、动画、几何工具
  api/           # 接口适配层：真实接口、mock、数据转换、客户端封装
  stores/        # 跨页面共享状态
  hooks/         # 可复用逻辑
  types/         # 类型定义
  utils/         # 通用工具
  data/          # 静态配置、初始数据、场景字典
  styles/        # 全局样式与主题变量
```

## 4. 拆分原则

- `pages/` 只负责页面组合，不写复杂业务分支。
- `features/` 按业务域拆分，例如 `agent-flow`、`simulation-studio`、`telemetry-dashboard`。
- `simulation3d/` 只放 3D 场景相关代码，不混页面状态管理。
- `api/` 统一承接数据请求和 mock，组件内部不直接写请求细节。
- `types/` 统一放跨模块数据结构，接口字段变化先在这里收口。
- `data/` 放初始配置、场景脚本、静态枚举和 demo 数据。
- `components/` 放纯展示型复用组件，避免承载业务状态。

## 5. React 写法

- 统一使用函数组件。
- 统一使用 TypeScript 显式类型。
- 页面优先拆成 `page -> feature -> component` 三层。
- 事件处理逻辑优先提到 hook 或 feature 层。
- UI 状态尽量本地化；只有跨页面复用才进入 store。
- 共享数据先抽 `types/`，再决定是否进入 `api/` 或 `data/`。

## 6. 状态边界

建议把状态分成四类：

1. 视图状态：弹窗开关、tab、hover、dragging。
2. 业务状态：设备状态、Agent 状态、演练步骤、告警流转。
3. 场景状态：3D 相机、动画、粒子、视角焦点。
4. 数据状态：telemetry、日志、配置、接口返回。

原则是：

- 页面级状态留在页面或 feature 容器中。
- 可复用的状态逻辑才抽成 hook/store。
- 3D 场景内部状态不要直接反向污染页面层。

## 7. 接口预留

本阶段虽然不接后端，但要提前把真实接口的入口整理出来：

- `api/client.ts`：请求客户端统一封装
- `api/*.ts`：按业务模块组织接口
- `api/mock/*.ts`：demo 和联调期间的模拟数据
- `types/*.ts`：接口数据和前端视图模型分离

要求是：

- 组件里不硬编码 URL。
- mock 数据尽量贴近最终接口字段。
- 一旦接口字段要变，先改 `types/` 和 `api/`，再改 UI。

## 8. 3D 相关

- 3D 场景建议独立在 `simulation3d/` 下。
- 场景编排、相机控制、设备投影、动画驱动分开写。
- 几何工具和投影算法放 `simulation3d/utils/` 或 `utils/`，不要散在组件里。
- 3D 组件只接收明确输入，不直接读取页面里复杂状态树。

## 9. 命名

- React 组件：`PascalCase.tsx`
- Hook：`useXxx.ts`
- 工具函数：`camelCase.ts`
- 类型文件：`xxx.types.ts` 或 `types.ts`
- 常量文件：`xxx.constants.ts`
- 业务模块目录：`kebab-case/`

## 10. 验证

前端改动前后，至少检查：

```sh
cd frontend
npm run lint
npm run build
```

如果涉及 UI 或 3D 改动，再补截图或运行效果说明。
