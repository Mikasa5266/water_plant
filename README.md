# 智能水厂项目

本项目用于复刻甲方未采纳水厂项目的核心功能，并在此基础上增加 Agent 运作流展示和更形象的 3D 动画演示。

当前阶段只做项目初始化和协作规范沉淀，不接入真实硬件，不实现后端业务。

## 当前技术栈

- 前端：Vue 3 + TypeScript + Vite + Vue Router + Pinia
- 后端：Python，当前仅预留 `backend/` 入口
- 3D：建模源文件放在 `assets/models/source/`，前端运行时模型放在 `assets/models/exported/`
- 接口契约：统一放在 `contracts/`

## 快速开始

```sh
cd frontend
npm install
npm run dev
```

提交前至少运行：

```sh
cd frontend
npm run lint
npm run build
```

## 必读文档

- [开发协作规范](docs/DEVELOPMENT_GUIDE.md)
- [Agent 使用约束](AGENTS.md)
- [架构约定草案](docs/ARCHITECTURE.md)
- [Git 协作流程](docs/GIT_WORKFLOW.md)
- [前端开发规范](docs/FRONTEND_GUIDE.md)
- [后端开发规范草案](docs/BACKEND_GUIDE.md)
- [3D 建模协作规范](docs/MODELING_GUIDE.md)

规范后续可以调整，但调整规范本身也需要走代码评审或团队确认。
