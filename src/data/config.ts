// ============================================================
// 时间线配置
// ============================================================

import type { TimelineConfig, EventCategory } from '../types';

export const categoryConfig: Record<EventCategory, { label: string; icon: string; trackIndex: number }> = {
  military: { label: '军事', icon: '⚔️', trackIndex: 0 },
  political: { label: '政治', icon: '🏛️', trackIndex: 1 },
  person: { label: '人物', icon: '👤', trackIndex: 2 },
  diplomacy: { label: '外交', icon: '🤝', trackIndex: 3 },
  rebellion: { label: '起义', icon: '🔥', trackIndex: 4 },
  construction: { label: '建设', icon: '🏗️', trackIndex: 5 },
  other: { label: '其他', icon: '📌', trackIndex: 6 },
};

export const timelineConfig: TimelineConfig = {
  minYear: 184,
  maxYear: 290,        // 延伸到290年，仅用于时间轴显示空间（事件数据仍到280年）
  defaultViewStart: 184,
  defaultViewEnd: 290,
  minViewRange: 5,    // 最小显示5年
  maxViewRange: 130,  // 最大显示130年（含延伸区域）
  tracks: ['military', 'political', 'person', 'diplomacy', 'rebellion', 'construction', 'other'],
};

/** 事件重要程度配置 */
export const importanceConfig = {
  critical: { label: '关键', height: 28, zIndex: 30 },
  major: { label: '重要', height: 22, zIndex: 20 },
  minor: { label: '次要', height: 16, zIndex: 10 },
} as const;
