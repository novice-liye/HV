// ============================================================
// 跨模块导航工具
// 通过 EventBus 实现模块间的页面跳转
// ============================================================

import { eventBus } from './EventBus';
import type { Route } from './router';

/** 跳转到指定模块页面 */
export function navigateToModule(route: Route, source: string) {
  eventBus.emit('module:navigate', route, source);
}

/** 在当前模块中监听跳转请求 */
export function useModuleNavigation(source: string, onNavigate?: (route: Route) => void) {
  return eventBus.on('module:navigate', (payload) => {
    const route = payload as Route;
    if (onNavigate) onNavigate(route);
  }, source);
}
