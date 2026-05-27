# Frontend

这是 `water_plant` 的前端工作区，当前定位为一个 **React + TypeScript + Vite 的纯前端 Demo**。

## 当前目标

- 先把前端结构拆清楚，方便多人协作。
- 先做纯前端模拟，不推进后端实现。
- 预留真实接口入口，但接口联调放到后续阶段。

## 技术栈

- React
- TypeScript
- Vite
- lucide-react
- motion
- Tailwind CSS

## 目录约定

```text
src/
  app/
  pages/
  features/
  components/
  simulation3d/
  api/
  stores/
  hooks/
  types/
  utils/
  data/
  styles/
```

## 代码边界

- `pages/` 只做页面组合。
- `features/` 放业务拆分后的功能模块。
- `components/` 放跨业务复用组件。
- `simulation3d/` 放 3D 场景、动画、相机和设备表现。
- `api/` 放接口客户端、mock 和数据适配。
- `types/` 放共享类型定义。

## 开发命令

```sh
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

## 备注

当前仓库前端仍处在重构和拆分阶段，后续会继续把现有的演示逻辑拆成更清晰的模块边界。
