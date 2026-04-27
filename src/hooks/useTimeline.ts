// ============================================================
// useTimeline - 时间线状态管理 Hook
// 处理缩放、平移、事件选择等核心逻辑
// ============================================================

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { HistoricalEvent, TimelineViewState, EventCategory, FactionId } from '../types';
import { eventBus } from '../core/EventBus';
import { timelineConfig } from '../data/config';


interface UseTimelineOptions {
  events: HistoricalEvent[];
}

interface UseTimelineReturn {
  viewState: TimelineViewState;
  selectedEvent: HistoricalEvent | null;
  hoveredEvent: HistoricalEvent | null;
  filters: {
    categories: Set<EventCategory>;
    factions: Set<FactionId>;
    importance: Set<string>;
  };
  zoomIn: () => void;
  zoomOut: () => void;
  zoom: (delta: number, pivotYear?: number) => void;
  panTo: (centerYear: number) => void;
  panLeft: () => void;
  panRight: () => void;
  resetView: () => void;
  selectEvent: (event: HistoricalEvent | null) => void;
  hoverEvent: (event: HistoricalEvent | null) => void;
  toggleCategory: (category: EventCategory) => void;
  toggleFaction: (faction: FactionId) => void;
  clearFilters: () => void;
  filteredEvents: HistoricalEvent[];
  yearToX: (year: number, containerWidth: number) => number;
  xToYear: (x: number, containerWidth: number) => number;
  /** 画布区域滚轮：缩放（以鼠标位置为锚点），Ctrl+滚轮=精细缩放 */
  handleWheel: (e: React.WheelEvent) => void;
  /** 轨道区域滚轮：缩放（与画布一致），Ctrl+滚轮=精细缩放 */
  handleTracksWheel: (e: React.WheelEvent) => void;
  /** 鼠标按下（画布和轨道通用） */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** 鼠标移动（绑定在 document 上） */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** 鼠标松开（绑定在 document 上） */
  handleMouseUp: () => void;
  /** 触屏开始（画布和轨道通用） */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** 触屏移动 */
  handleTouchMove: (e: React.TouchEvent) => void;
  /** 触屏结束 */
  handleTouchEnd: () => void;
  /** 键盘控制 */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isDragging: boolean;
  /** 判断当前是否在拖拽中（用于阻止事件条 onClick 误触发） */
  hasDragged: boolean;
}

/** 拖拽判定阈值（像素） */
const DRAG_THRESHOLD = 4;

export function useTimeline({ events }: UseTimelineOptions): UseTimelineReturn {
  const [viewState, setViewState] = useState<TimelineViewState>({
    viewStart: timelineConfig.defaultViewStart,
    viewEnd: timelineConfig.defaultViewEnd,
    zoomLevel: 1,
    centerYear: (timelineConfig.defaultViewStart + timelineConfig.defaultViewEnd) / 2,
  });

  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HistoricalEvent | null>(null);
  const [filters, setFilters] = useState({
    categories: new Set<EventCategory>(),
    factions: new Set<FactionId>(),
    importance: new Set<string>(),
  });

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, viewStart: 0, viewEnd: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // 年份 -> X 坐标
  const yearToX = useCallback((year: number, containerWidth: number): number => {
    const { viewStart, viewEnd } = viewState;
    return ((year - viewStart) / (viewEnd - viewStart)) * containerWidth;
  }, [viewState]);

  // X 坐标 -> 年份
  const xToYear = useCallback((x: number, containerWidth: number): number => {
    const { viewStart, viewEnd } = viewState;
    return viewStart + (x / containerWidth) * (viewEnd - viewStart);
  }, [viewState]);

  // ---- 缩放核心 ----
  const zoom = useCallback((delta: number, pivotYear?: number, fine?: boolean) => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      // fine=true 时使用更精细的缩放因子（Ctrl+滚轮）
      const baseFactor = fine ? 0.92 : 0.85;
      const zoomFactor = delta > 0 ? baseFactor : (1 / baseFactor);
      let newRange = range * zoomFactor;
      newRange = Math.max(timelineConfig.minViewRange, Math.min(timelineConfig.maxViewRange, newRange));

      const center = pivotYear ?? prev.centerYear;
      // 以 pivotYear 为锚点进行缩放
      const ratio = (center - prev.viewStart) / range;
      let newStart = center - newRange * ratio;
      let newEnd = newStart + newRange;

      // 限制范围
      if (newStart < timelineConfig.minYear - 5) {
        newStart = timelineConfig.minYear - 5;
        newEnd = newStart + newRange;
      }
      if (newEnd > timelineConfig.maxYear + 5) {
        newEnd = timelineConfig.maxYear + 5;
        newStart = newEnd - newRange;
      }

      const zoomLevel = (timelineConfig.maxViewRange) / newRange;
      return {
        viewStart: newStart,
        viewEnd: newEnd,
        zoomLevel,
        centerYear: (newStart + newEnd) / 2,
      };
    });
  }, []);

  const zoomIn = useCallback(() => zoom(1), [zoom]);
  const zoomOut = useCallback(() => zoom(-1), [zoom]);

  // ---- 平移核心 ----
  const panTo = useCallback((centerYear: number) => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      let newStart = centerYear - range / 2;
      let newEnd = centerYear + range / 2;
      if (newStart < timelineConfig.minYear - 5) {
        newStart = timelineConfig.minYear - 5;
        newEnd = newStart + range;
      }
      if (newEnd > timelineConfig.maxYear + 5) {
        newEnd = timelineConfig.maxYear + 5;
        newStart = newEnd - range;
      }
      return { ...prev, viewStart: newStart, viewEnd: newEnd, centerYear: (newStart + newEnd) / 2 };
    });
  }, []);

  const resetView = useCallback(() => {
    setViewState({
      viewStart: timelineConfig.defaultViewStart,
      viewEnd: timelineConfig.defaultViewEnd,
      zoomLevel: 1,
      centerYear: (timelineConfig.defaultViewStart + timelineConfig.defaultViewEnd) / 2,
    });
  }, []);

  // 用于避免 selectEvent 内部 emit 'event:selected' 导致循环
  const isInternalSelectRef = useRef(false);

  // ---- 选择事件 ----
  const selectEvent = useCallback((event: HistoricalEvent | null) => {
    isInternalSelectRef.current = true;
    setSelectedEvent(event);
    eventBus.emit('event:selected', event, 'timeline');
    if (event?.persons?.length) {
      eventBus.emit('relation:highlightNodes', event.persons, 'timeline');
    }
    // 在下一帧重置标记，确保事件处理完毕后再允许外部触发
    requestAnimationFrame(() => {
      isInternalSelectRef.current = false;
    });
  }, []);

  // ---- 悬停事件 ----
  const hoverEvent = useCallback((event: HistoricalEvent | null) => {
    setHoveredEvent(event);
    eventBus.emit('event:highlight', event, 'timeline');
  }, []);

  // ---- 过滤 ----
  const toggleCategory = useCallback((category: EventCategory) => {
    setFilters(prev => {
      const next = new Set(prev.categories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { ...prev, categories: next };
    });
  }, []);

  const toggleFaction = useCallback((faction: FactionId) => {
    setFilters(prev => {
      const next = new Set(prev.factions);
      if (next.has(faction)) next.delete(faction);
      else next.add(faction);
      return { ...prev, factions: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ categories: new Set(), factions: new Set(), importance: new Set() });
  }, []);

  // ---- 过滤后的事件 ----
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.categories.size > 0 && !filters.categories.has(event.category)) return false;
      if (filters.factions.size > 0 && !event.factions.some(f => filters.factions.has(f))) return false;
      return true;
    });
  }, [events, filters]);

  // ============================================================
  // PC端：滚轮缩放（以鼠标位置为锚点）
  // Ctrl+滚轮 = 精细缩放
  // ============================================================
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pivotYear = xToYear(x, rect.width);
    const fine = e.ctrlKey || e.metaKey;
    zoom(e.deltaY > 0 ? 1 : -1, pivotYear, fine);
  }, [zoom, xToYear]);

  // 轨道区域的滚轮处理：与画布完全一致（缩放，不是滚动）
  const handleTracksWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pivotYear = xToYear(x, rect.width);
    const fine = e.ctrlKey || e.metaKey;
    zoom(e.deltaY > 0 ? 1 : -1, pivotYear, fine);
  }, [zoom, xToYear]);

  // ============================================================
  // PC端：鼠标左键拖拽 = 水平平移
  // 画布和轨道区域统一使用同一套逻辑
  // ============================================================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 仅左键
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setHasDragged(false);
    dragStartRef.current = {
      x: e.clientX,
      viewStart: viewState.viewStart,
      viewEnd: viewState.viewEnd,
    };
  }, [viewState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;

    // 判断是否超过拖拽阈值
    if (!hasDraggedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      hasDraggedRef.current = true;
      setHasDragged(true);
    }

    // 计算容器宽度 - 使用 document.elementFromPoint 找到当前目标
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const range = dragStartRef.current.viewEnd - dragStartRef.current.viewStart;
    const yearDelta = -(dx / rect.width) * range;

    setViewState(prev => {
      let newStart = dragStartRef.current.viewStart + yearDelta;
      let newEnd = dragStartRef.current.viewEnd + yearDelta;
      if (newStart < timelineConfig.minYear - 5) {
        const shift = timelineConfig.minYear - 5 - newStart;
        newStart += shift;
        newEnd += shift;
      }
      if (newEnd > timelineConfig.maxYear + 5) {
        const shift = newEnd - (timelineConfig.maxYear + 5);
        newStart -= shift;
        newEnd -= shift;
      }
      return { ...prev, viewStart: newStart, viewEnd: newEnd, centerYear: (newStart + newEnd) / 2 };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    // hasDragged 在 mouseUp 后保持 true 一小段时间，供 onClick 判断
    // 通过 setTimeout 清除
    void hasDraggedRef.current;
    setTimeout(() => {
      setHasDragged(false);
      hasDraggedRef.current = false;
    }, 0);
  }, []);

  // ============================================================
  // 手机端：单指=水平平移，双指=缩放
  // 画布和轨道区域统一处理
  // ============================================================
  const touchRef = useRef<{
    isTouching: boolean;
    startX: number;
    startY: number;
    viewStart: number;
    viewEnd: number;
    initialPinchDist: number;
    initialRange: number;
    pinchCenterX: number;
    pinchCenterYear: number;
    isPinching: boolean;
    hasMoved: boolean;
  }>({
    isTouching: false,
    startX: 0,
    startY: 0,
    viewStart: 0,
    viewEnd: 0,
    initialPinchDist: 0,
    initialRange: 0,
    pinchCenterX: 0,
    pinchCenterYear: 0,
    isPinching: false,
    hasMoved: false,
  });

  const getPinchDist = useCallback((touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指：准备水平平移
      touchRef.current = {
        ...touchRef.current,
        isTouching: true,
        isPinching: false,
        hasMoved: false,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        viewStart: viewState.viewStart,
        viewEnd: viewState.viewEnd,
      };
      setIsDragging(true);
      setHasDragged(false);
    } else if (e.touches.length === 2) {
      // 双指：准备缩放
      const dist = getPinchDist(e.touches);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const centerYear = viewState.viewStart + (centerX / rect.width) * (viewState.viewEnd - viewState.viewStart);
      touchRef.current = {
        ...touchRef.current,
        isTouching: true,
        isPinching: true,
        hasMoved: true, // 双指操作视为拖拽，防止误触发 click
        initialPinchDist: dist,
        initialRange: viewState.viewEnd - viewState.viewStart,
        pinchCenterX: centerX,
        pinchCenterYear: centerYear,
        viewStart: viewState.viewStart,
        viewEnd: viewState.viewEnd,
      };
      setIsDragging(true);
      setHasDragged(true);
    }
  }, [viewState, getPinchDist]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.isTouching) return;

    if (e.touches.length === 2 && touchRef.current.isPinching) {
      // 双指缩放
      e.preventDefault();
      const dist = getPinchDist(e.touches);
      const scale = touchRef.current.initialPinchDist / dist;
      let newRange = touchRef.current.initialRange * scale;
      newRange = Math.max(timelineConfig.minViewRange, Math.min(timelineConfig.maxViewRange, newRange));

      const center = touchRef.current.pinchCenterYear;
      const ratio = (center - touchRef.current.viewStart) / touchRef.current.initialRange;
      let newStart = center - newRange * ratio;
      let newEnd = newStart + newRange;

      if (newStart < timelineConfig.minYear - 5) {
        newStart = timelineConfig.minYear - 5;
        newEnd = newStart + newRange;
      }
      if (newEnd > timelineConfig.maxYear + 5) {
        newEnd = timelineConfig.maxYear + 5;
        newStart = newEnd - newRange;
      }

      const zoomLevel = timelineConfig.maxViewRange / newRange;
      setViewState(prev => ({
        ...prev,
        viewStart: newStart,
        viewEnd: newEnd,
        zoomLevel,
        centerYear: (newStart + newEnd) / 2,
      }));
    } else if (e.touches.length === 1 && !touchRef.current.isPinching) {
      // 单指水平平移
      e.preventDefault();
      const dx = e.touches[0].clientX - touchRef.current.startX;

      if (!touchRef.current.hasMoved && Math.abs(dx) < DRAG_THRESHOLD) return;

      if (!touchRef.current.hasMoved) {
        touchRef.current.hasMoved = true;
        setHasDragged(true);
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const range = touchRef.current.viewEnd - touchRef.current.viewStart;
      const yearDelta = -(dx / rect.width) * range;

      setViewState(prev => {
        let newStart = touchRef.current.viewStart + yearDelta;
        let newEnd = touchRef.current.viewEnd + yearDelta;
        if (newStart < timelineConfig.minYear - 5) {
          const shift = timelineConfig.minYear - 5 - newStart;
          newStart += shift;
          newEnd += shift;
        }
        if (newEnd > timelineConfig.maxYear + 5) {
          const shift = newEnd - (timelineConfig.maxYear + 5);
          newStart -= shift;
          newEnd -= shift;
        }
        return { ...prev, viewStart: newStart, viewEnd: newEnd, centerYear: (newStart + newEnd) / 2 };
      });
    }
  }, [getPinchDist]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isTouching = false;
    touchRef.current.isPinching = false;
    setIsDragging(false);
    // hasDragged 保持到下一帧，供 click 判断
    void touchRef.current.hasMoved;
    setTimeout(() => {
      setHasDragged(false);
    }, 0);
  }, []);

  // ============================================================
  // 键盘控制
  // ← → = 水平平移，↑ ↓ = 平移（↑=更早，↓=更晚）
  // +/- = 缩放，Home/End = 跳转边界，Esc = 重置
  // ============================================================
  const panLeft = useCallback(() => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      const step = range * 0.15;
      let newStart = prev.viewStart - step;
      let newEnd = prev.viewEnd - step;
      if (newStart < timelineConfig.minYear - 5) {
        const shift = timelineConfig.minYear - 5 - newStart;
        newStart += shift;
        newEnd += shift;
      }
      return { ...prev, viewStart: newStart, viewEnd: newEnd, centerYear: (newStart + newEnd) / 2 };
    });
  }, []);

  const panRight = useCallback(() => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      const step = range * 0.15;
      let newStart = prev.viewStart + step;
      let newEnd = prev.viewEnd + step;
      if (newEnd > timelineConfig.maxYear + 5) {
        const shift = newEnd - (timelineConfig.maxYear + 5);
        newStart -= shift;
        newEnd -= shift;
      }
      return { ...prev, viewStart: newStart, viewEnd: newEnd, centerYear: (newStart + newEnd) / 2 };
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        panLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        panRight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        panLeft(); // ↑ = 更早的时间（向左平移）
        break;
      case 'ArrowDown':
        e.preventDefault();
        panRight(); // ↓ = 更晚的时间（向右平移）
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomOut();
        break;
      case 'Home':
        e.preventDefault();
        panTo(timelineConfig.minYear);
        break;
      case 'End':
        e.preventDefault();
        panTo(timelineConfig.maxYear);
        break;
      case 'Escape':
        e.preventDefault();
        resetView();
        break;
    }
  }, [panLeft, panRight, zoomIn, zoomOut, panTo, resetView]);

  // ---- 监听来自其他模块的事件 ----
  useEffect(() => {
    const unsubs = [
      eventBus.on('timeline:viewChange', (payload) => {
        const state = payload as TimelineViewState;
        setViewState(state);
      }, 'timeline'),
      eventBus.on('event:selected', (payload) => {
        const event = payload as HistoricalEvent | null;
        if (event && !isInternalSelectRef.current) {
          // 确保目标事件可见：如果被筛选掉了，临时清除筛选
          setFilters(prev => {
            const categoryBlocked = prev.categories.size > 0 && !prev.categories.has(event.category);
            const factionBlocked = prev.factions.size > 0 && !event.factions.some(f => prev.factions.has(f));
            if (categoryBlocked || factionBlocked) {
              return { categories: new Set(), factions: new Set(), importance: new Set() };
            }
            return prev;
          });
          const midYear = (event.startYear + event.endYear) / 2;
          panTo(midYear);
          // 延迟 300ms 后悬停高亮事件
          setTimeout(() => {
            hoverEvent(event);
          }, 300);
        }
      }, 'timeline'),
    ];
    return () => unsubs.forEach(u => u());
  }, [panTo, hoverEvent]);

  // ---- 视图变化时通知其他模块 ----
  useEffect(() => {
    eventBus.emit('timeline:viewChange', viewState, 'timeline');
  }, [viewState]);

  return {
    viewState,
    selectedEvent,
    hoveredEvent,
    filters,
    zoomIn,
    zoomOut,
    zoom,
    panTo,
    panLeft,
    panRight,
    resetView,
    selectEvent,
    hoverEvent,
    toggleCategory,
    toggleFaction,
    clearFilters,
    filteredEvents,
    yearToX,
    xToYear,
    handleWheel,
    handleTracksWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    isDragging,
    hasDragged,
  };
}
