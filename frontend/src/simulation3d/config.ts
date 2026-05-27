/**
 * 3D 场景全局配置
 *
 * 核心设计：所有 3D 内容统一由 SCENE_SCALE 缩放。
 * 修改此值即可整体调整场景大小，无需逐文件修改。
 *
 * 坐标映射：Three.js [x, y, z] = [data.x, data.z, data.y]
 * 设备中心坐标：原始设备模块几何中心（data 空间的 z 值 = 设备半高）
 */

/** 全局场景缩放因子（改这一个数联动全部） */
export const SCENE_SCALE = 0.7;

/** 默认相机参数（在 scale group 外面，不受 SCENE_SCALE 影响） */
export const CAMERA_DEFAULTS = {
  position: [40, 35, 60] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: 2000,
  /** OrbitControls 默认 lookAt 目标 */
  target: [0, 8, 0] as [number, number, number],
  minDistance: 15,
  maxDistance: 180,
} as const;

/**
 * 设备本体中心坐标（data 空间）
 * 用于粒子路径终点、摄像机聚焦目标
 * z 值 = 设备几何中心高度（非 Agent 球体高度）
 */
export const DEVICE_CENTERS: Record<string, { x: number; y: number; z: number }> = {
  /** 监管中枢：主体圆柱中心 y≈12, 乘以2得到几何中心 ≈ 25 */
  supervisor: { x: 0, y: 0, z: 25 },
  /** 加药：药箱高 16, 底座 1.2, 中心 ≈ 9 */
  dosing: { x: -60, y: -70, z: 9 },
  /** 超滤：柱高 15, 底座 0.8, 中心 ≈ 9 */
  uf: { x: 20, y: 75, z: 9 },
  /** RO：围栏高 7, 底座 1.2, 中心 ≈ 5 */
  ro: { x: 80, y: 10, z: 5 },
  /** 泵组：泵体高 4.5, 底座 1.2, 中心 ≈ 5 */
  pump: { x: 70, y: -55, z: 5 },
};

/**
 * 聚焦时相机偏移量（绝对值，data 空间内）
 * 相机位置 = 设备中心 + offset
 * 值需足够大，确保聚焦后能看到完整设备及其操作，而非贴到设备中心
 */
export const FOCUS_OFFSET = {
  /** 侧向偏移 — 保持水平距离，避免贴到设备 */
  positionMul: 35,
  /** 高度偏移 — 略高于设备，俯视角度 */
  heightMul: 30,
  /** 深度偏移 — 前后拉开距离 */
  depthMul: 35,
} as const;
