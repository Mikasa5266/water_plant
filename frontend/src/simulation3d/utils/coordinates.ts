/**
 * 坐标映射工具
 * 数据坐标 (x=水平, y=深度, z=高度) → Three.js 世界坐标 [X, Y, Z]
 * Three.js 使用 Y-up 右手坐标系
 */

export function toThreePos(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y];
}

export function toThreePosTuple(t: { x: number; y: number; z: number }): [number, number, number] {
  return [t.x, t.z, t.y];
}
