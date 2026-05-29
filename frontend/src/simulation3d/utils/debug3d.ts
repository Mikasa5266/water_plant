/**
 * debug3d — 3D 场景统一调试日志工具
 *
 * 用法：
 *   import { debug3d } from '../utils/debug3d';
 *   debug3d('bubble', { agentId, anchor, screenX, screenY });
 *   debug3d('particle', { intent, from, to, mode });
 *
 * 控制方式：
 * - process.env.NODE_ENV === 'development' → 默认开启关键日志
 * - window.__DEBUG_3D__ 可运行时切换
 *   在控制台输入：window.__DEBUG_3D__ = ['bubble', 'particle', 'phase']
 *   只开启特定类别；设置为 true 开启全部
 *
 * 类别：
 *   bubble   - 气泡锚点、投影坐标、偏移
 *   particle - 粒子路径起终点、弧线模式
 *   phase    - 场景阶段转换、intent 变化
 *   camera   - 相机聚焦、位置
 *   all      - 全部
 */

type LogCategory = 'bubble' | 'particle' | 'phase' | 'camera' | 'all';

/** 当前启用的日志类别（调试时可修改） */
let enabledCategories: Set<string> | null = null; // null = 未初始化

function getEnabled(): Set<string> | null {
  if (enabledCategories === null) {
    // 初始化：开发环境默认开启部分日志
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      enabledCategories = new Set(['phase']);
    } else {
      enabledCategories = new Set();
    }
    // 检查 window 开关
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      const debugFlag = win.__DEBUG_3D__;
      if (debugFlag === true) {
        enabledCategories = new Set(['bubble', 'particle', 'phase', 'camera']);
      } else if (Array.isArray(debugFlag)) {
        for (const cat of debugFlag) {
          enabledCategories?.add(cat);
        }
      }
    }
  }
  return enabledCategories;
}

/**
 * 受控 3D 调试日志
 * 仅在对应类别开启时输出，避免刷屏
 */
export function debug3d(
  category: LogCategory,
  data: Record<string, unknown>,
): void {
  const enabled = getEnabled();
  if (!enabled || enabled.size === 0) return;
  if (!enabled.has(category) && !enabled.has('all')) return;

  // 缩略打印：避免大对象刷屏
  const abbreviated: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && 'constructor' in val) {
      abbreviated[key] = val.constructor.name;
    } else if (Array.isArray(val) && val.length > 8) {
      abbreviated[key] = `Array(${val.length})`;
    } else {
      abbreviated[key] = val;
    }
  }

  console.log(
    `%c[3d:${category}]%c`,
    'color:#60a5fa;font-weight:600',
    'color:inherit',
    abbreviated,
  );
}

/**
 * 注册运行时调试开关（在控制台使用）
 * window.__DEBUG_3D__ = ['bubble', 'particle']
 * window.__DEBUG_3D__ = true  // 全部开启
 * window.__DEBUG_3D__ = false // 全部关闭
 */
export function registerDebugToggle(): void {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, '__DEBUG_3D__', {
      get: () => Array.from(enabledCategories ?? []),
      set: (val: unknown) => {
        if (val === true) {
          enabledCategories = new Set(['bubble', 'particle', 'phase', 'camera']);
          console.log('[debug3d] 已开启全部日志');
        } else if (val === false || val === null) {
          enabledCategories = new Set();
          console.log('[debug3d] 已关闭全部日志');
        } else if (Array.isArray(val)) {
          enabledCategories = new Set(val);
          console.log(`[debug3d] 已开启日志类别: ${val.join(', ')}`);
        }
      },
      configurable: true,
    });
  }
}

// 扩展 window 类型
declare global {
  interface Window {
    __DEBUG_3D__: boolean | string[] | undefined;
  }
}
