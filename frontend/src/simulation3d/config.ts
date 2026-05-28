/**
 * 3D 场景全局配置
 *
 * 核心设计：所有 3D 内容统一由 SCENE_SCALE 缩放。
 * 修改此值即可整体调整场景大小，无需逐文件修改。
 *
 * 坐标映射：Three.js [x, y, z] = [data.x, data.z, data.y]
 * 设备中心坐标：原始设备模块几何中心（data 空间的 z 值 = 设备半高）
 *
 * 调参优先级：相机 → 锚点 → 地面 → 管道 → SCENE_SCALE（最后微调）
 */

/** 全局场景缩放因子（改这一个数联动全部；最后微调，不用它救构图） */
export const SCENE_SCALE = 0.7;

/**
 * 默认相机参数（在 scale group 外面，不受 SCENE_SCALE 影响）
 *
 * 开场构图原则：
 * - 场景布局跨度（data 空间）：x: [-60, 80]，y: [-70, 75]
 * - 乘以 SCENE_SCALE=0.7 后相机空间跨度约 x:[-42,56] z:[-49,53]，宽约 100，深约 100
 * - 相机正上方偏前，position y 需足够高，z 拉到场景外侧
 * - 目标：入场一眼同时看到 supervisor + dosing/uf/ro/pump 四角设备的完整轮廓
 *
 * 推荐：position 偏中央正前方，略偏正y轴外侧 + 偏高，fov 适当放大
 */
export const CAMERA_DEFAULTS = {
  /**
   * 正面偏右斜上方，确保场景四角均在视野内
   * x 居中偏右（场景 x 重心约 14），y 拉高，z 拉远到场景前方
   */
  position: [10, 85, 130] as [number, number, number],
  /** 放大视角，全景更自然，边缘不易被裁 */
  fov: 58,
  near: 0.1,
  far: 2000,
  /**
   * OrbitControls lookAt 目标：朝向场景中央偏上（包围盒中心）
   * 场景 x 重心 ≈ 7，高度约 8（scale后），z 重心 ≈ 0
   */
  target: [7, 6, 0] as [number, number, number],
  minDistance: 15,
  maxDistance: 300,
} as const;

/**
 * 演示基础视角（scale group 内坐标，CameraController 会×SCENE_SCALE 转换）
 *
 * 聚焦动画的统一起点：
 * - 无论用户把相机拖到哪里，触发 EXECUTING 聚焦时先跳到此视角，再飞向目标设备
 * - 这样聚焦路径始终干净，不会出现"横穿场景"的乱飞
 * - 等价于 CAMERA_DEFAULTS 在 scale 内的表示（position 除以 SCENE_SCALE）
 */
export const DEMO_ORBIT_START = {
  /** 对应 CAMERA_DEFAULTS.position / SCENE_SCALE ≈ [14, 121, 186] */
  position: [14, 121, 186] as [number, number, number],
  /** 对应 CAMERA_DEFAULTS.target / SCENE_SCALE ≈ [10, 9, 0] */
  lookAt: [10, 9, 0] as [number, number, number],
} as const;

/**
 * 设备本体中心坐标（data 空间，scale group 内）
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
 * 设备聚焦预设（data 空间，scale group 内坐标）
 *
 * 设计原则：
 * - 相机落在"设备前上方"，而非设备正上方或几何中心
 * - lookAt 对准设备整体可视中心（偏上 1/2~2/3 处），不要对准底部
 * - 相机与 lookAt 的距离应让设备整体入镜（不要钻进内部）
 * - 边缘设备从场景中心方向朝外看，避免穿越其他模型
 *
 * 坐标系：Three.js [x, y, z] = [data.x, data.z, data.y]
 * 故 data.z（高度）映射到 Three.y，data.y（水平）映射到 Three.z
 * CameraController 的 toCameraSpace() 会对这些坐标 ×SCENE_SCALE
 *
 * 聚焦流程（见 CameraController）：
 *  1. 锁住 OrbitControls（禁止用户拖拽）
 *  2. 快速收敛到 DEMO_ORBIT_START（0.4s）
 *  3. 从 DEMO_ORBIT_START 飞向本预设（duration - 0.4s）
 *  4. 到位后解锁 OrbitControls（用户可自由调整视角）
 */
export const DEVICE_FOCUS_PRESETS: Record<
  string,
  { cameraPos: [number, number, number]; lookAt: [number, number, number]; duration?: number }
> = {
  /**
   * supervisor：从正面偏右上方看向中枢
   * data中心 (0,0,25) → Three (0,25,0)；相机在其前上方斜 45°
   * lookAt 对准圆柱顶端约 2/3 高度处（y≈20）
   */
  supervisor: {
    cameraPos: [35, 50, 60],
    lookAt: [0, 20, 0],
    duration: 2000,
  },
  /**
   * dosing：data位置 (-60,-70,9) → Three (-60,9,-70)
   * 从场景内侧（正x方向）看向加药设备，相机在其右前上方
   * lookAt 对准药箱中上部（y≈12，即约 2/3 高度）
   */
  dosing: {
    cameraPos: [-5, 38, -25],
    lookAt: [-42, 12, -49],
    duration: 2000,
  },
  /**
   * uf：data位置 (20,75,9) → Three (20,9,75)
   * 从场景内侧（负z方向）看向超滤，相机在其前上方
   * lookAt 对准滤柱中上部（y≈12）
   */
  uf: {
    cameraPos: [20, 38, 28],
    lookAt: [14, 12, 53],
    duration: 2000,
  },
  /**
   * ro：data位置 (80,10,5) → Three (80,5,10)
   * 从场景内侧（负x方向）看向RO，相机在其左前上方
   * lookAt 对准围栏中部（y≈6）
   */
  ro: {
    cameraPos: [32, 32, 32],
    lookAt: [56, 6, 7],
    duration: 2000,
  },
  /**
   * pump：data位置 (70,-55,5) → Three (70,5,-55)
   * 从场景内侧（负x+正z方向）看向泵组，相机在其左前上方
   * lookAt 对准泵体上方（y≈6）
   */
  pump: {
    cameraPos: [22, 32, -8],
    lookAt: [49, 6, -38],
    duration: 2000,
  },
};
