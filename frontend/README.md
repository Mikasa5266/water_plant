# 智能水厂前端

Vue 3 + TypeScript + Vite frontend for the smart water plant project.

当前只完成前端初始化，不包含业务页面。

## Setup

```sh
npm install
npm run dev
```

## Checks

npm run lint
npm run build
```

## Directory Rules

- `src/api/`: request clients and mock entrypoints.
- `src/app/`: app-level setup.
- `src/components/`: reusable UI components.
- `src/features/`: domain features.
- `src/pages/`: route pages.
- `src/simulation3d/`: 3D scene and animation integration.

See `../docs/DEVELOPMENT_GUIDE.md` before adding business code.

## Import Alias

Use `@/` for imports from `src/`, for example:

```ts
import ExamplePanel from '@/components/ExamplePanel.vue'
```
