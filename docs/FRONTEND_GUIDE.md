# 前端开发规范

最后更新：2026-05-25

## 1. 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- ESLint + Oxlint + Prettier

使用 npm，不混用 pnpm、yarn、bun。

## 2. 代码组织

```text
src/
  api/
  app/
  assets/
  components/
  features/
  pages/
  router/
  shared/
  simulation3d/
  stores/
  types/
  utils/
```

放置规则：

- `pages/`: 路由页面，负责组合，不写复杂逻辑。
- `features/`: 水厂业务模块，例如设备、告警、工艺流程、Agent 流程。
- `components/`: 跨业务复用组件。
- `shared/`: 轻量共享逻辑和常量。
- `api/`: HTTP 客户端、mock、接口封装。
- `simulation3d/`: 3D 场景加载、动画控制、设备状态映射。
- `stores/`: Pinia store。
- `types/`: 前端全局类型，跨端类型优先来自 `contracts/`。

## 3. 命名

- Vue 组件：`PascalCase.vue`
- 组合式函数：`useXxx.ts`
- 工具函数：`camelCase.ts`
- 类型文件：`xxx.types.ts`
- 常量文件：`xxx.constants.ts`
- 业务模块目录：小写短横线，例如 `agent-flow/`

## 4. Vue 写法

- 优先使用 `<script setup lang="ts">`。
- 组件 props 和 emit 必须显式声明类型。
- 页面级数据请求集中在页面或 feature 容器，子组件尽量通过 props 接收。
- 不在组件中硬编码后端地址，统一走 `src/api/`。
- 不把 mock 数据散落在组件中，mock 统一放到 `api/` 或对应 feature 的 mock 文件。

## 5. 状态管理

- 局部 UI 状态优先用组件状态。
- 跨页面共享状态使用 Pinia。
- 接口返回数据不要无理由复制到多个 store。
- Agent 运行流、设备状态、3D 状态要有清晰边界，避免互相直接改内部状态。

## 6. 3D 接入

- 3D 逻辑放 `src/simulation3d/`。
- UI 组件只发送明确事件或状态，不直接操纵模型内部对象。
- 设备动画事件应对应 `contracts/simulation-events.schema.json`。
- 模型路径和设备 ID 必须稳定，避免靠中文显示名做逻辑匹配。

## 7. 样式

- 先遵循现有样式系统；没有系统前，保持克制和一致。
- 不在多个组件重复写同一套布局规则。
- 业务页面优先信息密度和可读性，不做营销式落地页。

## 8. 验证

提交前运行：

```sh
npm run lint
npm run build
```

涉及 UI/3D 的改动还需要提供截图、录屏或清晰复现步骤。
