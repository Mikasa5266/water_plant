# 3D 建模协作规范

最后更新：2026-05-25

## 1. 资源目录

```text
assets/models/source/    # 可编辑源文件
assets/models/exported/  # 前端运行时导出文件
```

## 2. 命名

模型文件使用英文小写短横线：

```text
water-pump.glb
sedimentation-tank.glb
chemical-dosing-room.glb
```

设备 ID 建议稳定、可读：

```text
pump-001
valve-001
sedimentation-tank-001
```

不要用中文显示名作为程序逻辑 ID。

## 3. 导出建议

- 前端运行时优先使用 `.glb`。
- 控制贴图大小，避免首屏加载过慢。
- 保留可编辑源文件，但大文件提交前先和团队确认。
- 导出文件变更时说明影响的设备和场景。

## 4. 动画约定

动画应围绕设备状态表达：

- `idle`: 待机。
- `running`: 运行中。
- `warning`: 预警。
- `fault`: 故障。
- `maintenance`: 维护。

动画事件契约见 `contracts/simulation-events.schema.json`。

## 5. 与前端交付

建模交付时至少说明：

- 模型文件路径。
- 包含哪些设备。
- 可控制的节点或动画名称。
- 单位、比例、坐标方向。
- 已知性能风险。
