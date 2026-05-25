# Git 协作流程

最后更新：2026-05-25

## 1. 分支命名

建议使用：

```text
feat/frontend-dashboard
feat/backend-device-api
feat/simulation3d-equipment-animation
fix/frontend-routing
docs/development-guide
chore/project-init
```

如果使用 Codex 桌面应用创建分支，可以使用默认 `codex/` 前缀，例如：

```text
codex/project-standards
```

## 2. 提交信息

使用 Conventional Commits：

```text
feat(frontend): 添加水厂总览页面
feat(simulation3d): 接入沉淀池模型
feat(agent): 展示工具调用时间线
fix(contracts): 修正设备状态字段类型
docs(workflow): 补充协作规范
chore(frontend): 初始化 Vue3 工程
```

常用类型：

- `feat`: 新功能。
- `fix`: 缺陷修复。
- `docs`: 文档。
- `style`: 代码格式，不改变逻辑。
- `refactor`: 重构，不改变行为。
- `test`: 测试。
- `chore`: 工程配置、依赖、脚手架。

## 3. 提交前检查

前端改动至少运行：

```sh
cd frontend
npm run lint
npm run build
```

后端初始化后，应在本文档补充 Python lint、test、format 命令。

## 4. 禁止提交

- `node_modules/`
- `dist/`、构建产物、缓存
- `.env` 和任何真实密钥
- 客户内网地址、硬件真实连接参数
- 未压缩的大体积临时模型文件
- 与当前任务无关的大面积格式化

## 5. 推荐 PR 描述

PR 必须说明：

- 改动目的。
- 涉及范围。
- 验证方式。
- 是否影响 `contracts/`。
- UI 或 3D 改动的截图、录屏或复现路径。

## 6. Agent 参与提交

AI Agent 可以协助修改代码和文档，但默认不得执行：

- `git add`
- `git commit`
- `git push`
- 分支删除
- 历史重写

除非用户明确要求，否则 Agent 只给出变更和验证结果。
