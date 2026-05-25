# 智能水厂开发协作规范

最后更新：2026-05-25

## 1. 项目目标

近期目标分三步推进：

1. 复刻甲方既有水厂项目的核心功能。
2. 用 3D 动画演示设备运行、告警、控制和流程变化，不直接控制真实硬件。
3. 引入 Agent 运作流展示，重点展示调用链、推理步骤、工具调用和执行结果。

当前阶段只初始化项目结构和协作约束，不实现前端页面、不实现后端业务、不接入硬件。

## 2. 团队分工

- 前端负责人：维护 `frontend/`，实现 Vue 3 + TypeScript 前端、Agent 流程展示、3D 场景接入。
- 后端负责人：维护 `backend/`，实现 Python 服务、接口、数据处理和 Agent 后端能力。
- 建模负责人：维护 `assets/models/`，输出水厂场景、设备模型、动画资源和运行时模型。

跨职责改动必须先对齐，尤其是接口契约、模型命名、动画事件和 Agent 事件结构。

## 3. 顶层目录

```text
water_plant/
  AGENTS.md                 # AI Agent 行为约束
  README.md                 # 项目入口说明
  assets/                   # 共享素材和 3D 模型
  backend/                  # Python 后端入口
  contracts/                # API、事件、数据结构契约
  docs/                     # 团队规范和设计文档
  frontend/                 # Vue 3 + TypeScript 前端
```

## 4. 前端目录约定

```text
frontend/src/
  api/          # 请求客户端、接口封装、mock 入口
  app/          # 应用级初始化、Provider、全局配置
  assets/       # 前端专属静态资源
  components/   # 跨业务通用 UI 组件
  features/     # 业务功能模块
  pages/        # 路由页面
  router/       # Vue Router 配置
  shared/       # 跨模块共享组合式函数、常量、轻量组件
  simulation3d/ # 3D 场景、动画、设备状态映射
  stores/       # Pinia 状态
  types/        # 全局 TypeScript 类型
  utils/        # 无副作用工具函数
```

前端规则：

- 页面只负责路由级编排，不堆积复杂业务逻辑。
- 通用组件放 `components/`，业务组件放对应 `features/`。
- 后端请求只能从 `api/` 进入，不在组件里硬编码 URL。
- Agent 调用流、设备动作、3D 动画事件都先抽象成类型或契约，再接入 UI。
- 3D 运行时资源优先使用 `.glb` / `.gltf` 等浏览器友好格式。

## 5. 后端目录约定

当前只预留：

```text
backend/
  app/
```

后端后续初始化时应补充：

- Python 版本和依赖管理方案。
- 服务启动命令。
- 测试命令。
- 配置和密钥读取规则。
- 与 `contracts/` 对应的接口说明。

后端不得把真实生产密钥、硬件地址、客户内网信息提交到仓库。

## 6. 接口和 Agent 契约

所有跨端数据结构先放在 `contracts/`，包括：

- HTTP API 请求和响应。
- 设备状态字段。
- 3D 动画控制事件。
- Agent 消息、工具调用、调用结果、错误事件。
- Mock 数据样例。

在真实后端完成前，前端可以使用 mock，但 mock 字段必须尽量贴近 `contracts/`。

## 7. 3D 资源规范

- `assets/models/source/` 存建模源文件，例如 Blender 文件。
- `assets/models/exported/` 存前端可加载的导出文件。
- 模型命名使用小写短横线，例如 `sedimentation-tank.glb`。
- 大模型提交前需要压缩、检查加载性能，并说明来源。
- 动画只表达演示意图，不暗示已经接入真实硬件。

## 8. Git 工作流

建议分支：

- `main`：稳定分支。
- `develop`：多人集成分支，如果团队决定启用。
- `feat/<scope>-<name>`：功能分支。
- `fix/<scope>-<name>`：修复分支。
- `docs/<name>`：文档分支。

提交信息使用 Conventional Commits：

```text
feat(frontend): 添加设备状态面板
fix(api): 修正设备列表字段映射
docs(workflow): 补充 Agent 使用规范
chore(frontend): 初始化 Vue3 项目
refactor(simulation3d): 拆分设备动画控制器
```

提交规则：

- 一个提交只做一件事。
- 不提交无关格式化。
- 不提交 `node_modules/`、构建产物、缓存、私密配置。
- 不在未通过基础检查时合并。
- AI Agent 不得在未经明确授权时 stage、commit 或 push。

## 9. 评审要求

合并前说明：

- 本次改动解决什么问题。
- 修改了哪些模块。
- 如何验证。
- 是否影响接口契约、模型资源、Agent 事件。
- UI 或 3D 改动需提供截图、录屏或可复现步骤。

## 10. 前端命令

当前包管理器为 npm，不混用 pnpm、yarn、bun。

```sh
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

Node 版本以 `frontend/package.json` 的 `engines` 为准；当前 Vite 脚手架要求 Node `^20.19.0 || >=22.12.0`。

## 11. 依赖新增规则

新增依赖前必须确认：

- 是否真的需要，能否用现有栈解决。
- 是否仍在维护。
- 是否支持当前 Vue、Vite、TypeScript 版本。
- 是否会显著增加包体积或 3D 运行负担。

新增后必须提交 lockfile，并在评审说明中写明用途。

## 12. AI Agent 使用规范

- Agent 修改前必须阅读 `AGENTS.md` 和本文档。
- Agent 只能改动任务相关文件。
- Agent 不得擅自删除、移动、重命名他人文件。
- Agent 不得把后端逻辑塞进前端，也不得把前端 mock 当真实服务。
- Agent 不得编造接口字段；不确定时先补契约草案或询问负责人。
- Agent 输出结论前要说明验证结果，无法验证也要明确说明。

## 13. 规范修改流程

本规范是可迭代的。修改规范时需要：

1. 在文档中直接更新规则。
2. 在评审说明里解释为什么调整。
3. 通知受影响的负责人。

不要让口头约定长期停留在聊天记录里；稳定约定应沉淀到 `docs/` 或 `contracts/`。
