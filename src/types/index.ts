// ============================================================
// 三国历史可视化 - 核心类型定义
// 所有模块共享的类型接口，确保模块间数据结构一致
// ============================================================

/** 势力标识 */
export type FactionId = 'wei' | 'shu' | 'wu' | 'han' | 'other';

/** 事件类型分类 */
export type EventCategory = 'military' | 'political' | 'person' | 'diplomacy' | 'rebellion' | 'construction' | 'other';

/** 事件重要程度 */
export type EventImportance = 'critical' | 'major' | 'minor';

/** 地理坐标 */
export interface GeoCoordinate {
  lat: number;
  lng: number;
}

/** 势力信息 */
export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  leader?: string;
  description?: string;
}

/** 人物信息 */
export interface Person {
  id: string;
  name: string;
  faction: FactionId;
  birthYear?: number;
  deathYear?: number;
  title?: string;
  description?: string;
  portraitUrl?: string;
}

/** 事件信息来源 */
export interface EventSource {
  /** 书名/文献名 */
  book: string;
  /** 卷/章/篇名 */
  chapter: string;
  /** 原文引用（简短） */
  text: string;
  /** 来源类型：正史/演义/其他 */
  type?: 'history' | 'fiction' | 'novel' | 'other';
}

/** 历史事件 - 核心数据结构 */
export interface HistoricalEvent {
  id: string;
  title: string;
  /** 起始年份（含） */
  startYear: number;
  /** 结束年份（含），与 startYear 相同则为瞬时事件 */
  endYear: number;
  category: EventCategory;
  importance: EventImportance;
  /** 关联势力 */
  factions: FactionId[];
  /** 关联人物 */
  persons: string[];
  /** 事件描述 */
  description: string;
  /** 详细描述（HTML 格式） */
  detailHtml?: string;
  /** 事件地点 */
  location?: {
    name: string;
    coordinate: GeoCoordinate;
  };
  /** 地图动画配置（预留接口） */
  mapAnimation?: MapAnimationConfig;
  /** 关联事件 ID */
  relatedEvents?: string[];
  /** 标签 */
  tags?: string[];
  /** 信息来源 */
  sources?: EventSource[];
}

/** 地图动画配置 */
export interface MapAnimationConfig {
  type?: string;
  /** 动画路径点（单阶段动画使用） */
  path: GeoCoordinate[];
  /** 动画持续时间（毫秒） */
  duration?: number;
  /** 动画颜色 */
  color?: string;
  /** 动画标签 */
  label?: string;
  /** 多阶段动画配置（复杂事件使用，与 path 互斥） */
  phases?: AnimationPhase[];
  /** 额外配置 */
  meta?: Record<string, unknown>;
}

/** 动画阶段（用于多阶段复杂动画） */
/** 路径节点叙事信息 */
export interface WaypointNarrative {
  /** 节点在 path 中的索引（0-based） */
  index: number;
  /** 节点名称 */
  name: string;
  /** 到达此节点时展示的叙事文字 */
  narrative: string;
  /** 在此节点停留的时间（毫秒），0 表示不停留 */
  dwellTime?: number;
}

export interface AnimationPhase {
  /** 阶段类型 */
  type: 'march' | 'battle' | 'siege' | 'expansion' | 'retreat' | 'fire' | 'ambush' | 'converge';
  /** 阶段路径点 */
  path: GeoCoordinate[];
  /** 阶段标签 */
  label: string;
  /** 阶段颜色 */
  color?: string;
  /** 阶段持续时间（毫秒） */
  duration?: number;
  /** 阶段延迟（毫秒，相对于前一个阶段结束） */
  delay?: number;
  /** 特效类型 */
  effect?: 'fire' | 'explosion' | 'arrow' | 'wave' | 'none';
  /** 特效颜色 */
  effectColor?: string;
  /** 路径节点叙事信息（到达节点时弹出叙事气泡） */
  waypoints?: WaypointNarrative[];
}

/** 关系图节点 */
export interface RelationNode {
  id: string;
  type: 'person' | 'faction' | 'location';
  label: string;
  faction?: FactionId;
}

/** 关系图边 */
export interface RelationEdge {
  source: string;
  target: string;
  type: 'ally' | 'enemy' | 'family' | 'subordinate' | 'rival' | 'other';
  label?: string;
  startYear?: number;
  endYear?: number;
}

/** 时间线视图状态 */
export interface TimelineViewState {
  /** 视口起始年份 */
  viewStart: number;
  /** 视口结束年份 */
  viewEnd: number;
  /** 缩放级别 */
  zoomLevel: number;
  /** 中心年份 */
  centerYear: number;
}

/** 时间线配置 */
export interface TimelineConfig {
  /** 时间范围 */
  minYear: number;
  maxYear: number;
  /** 默认视图范围 */
  defaultViewStart: number;
  defaultViewEnd: number;
  /** 最小缩放范围（年） */
  minViewRange: number;
  /** 最大缩放范围（年） */
  maxViewRange: number;
  /** 事件轨道分类 */
  tracks: EventCategory[];
}

// ============================================================
// 模块间通信事件类型（EventBus）
// ============================================================

export type AppEventType =
  | 'event:selected'          // 选中事件
  | 'event:highlight'         // 高亮事件
  | 'event:filter'            // 过滤事件
  | 'timeline:viewChange'     // 时间线视图变化
  | 'map:flyTo'              // 地图飞行到指定位置
  | 'map:playAnimation'      // 地图播放动画
  | 'map:clearAnimation'     // 清除地图动画
  | 'relation:focusNode'     // 关系图聚焦节点
  | 'relation:highlightNodes'// 关系图高亮多个节点
  | 'ai:search'              // AI 搜索
  | 'ai:result'              // AI 搜索结果
  | 'module:activate'        // 激活模块
  | 'module:deactivate'      // 停用模块
  | 'module:navigate'        // 跨模块页面跳转
  | 'dashboard:yearChange'   // 仪表盘年份变化
  | 'territory:yearChange';  // 疆域模块年份变化

export interface AppEvent {
  type: AppEventType;
  payload?: unknown;
  source?: string;
}
