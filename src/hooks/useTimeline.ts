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
  panTo: (centerYear: number) => void;
  panLeft: () => void;
  panRight: () => void;
  resetView: () => void;
  selectEvent: (event: HistoricalEvent | null) => void;
  hoverEvent: (event: HistoricalEvent | null) => void;
  toggleCategory: (category: EventCategory) => void;
  toggleFaction: (faction: FactionId) => void;
  filteredEvents: HistoricalEvent[];
  yearToX: (year: number, containerWidth: number) => number;
  xToYear: (x: number, containerWidth: number) => number;
  handleWheel: (e: React.WheelEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isDragging: boolean;
}

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
  const dragStartRef = useRef({ x: 0, viewStart: 0, viewEnd: 0 });
  const [isDragging, setIsDragging] = useState(false);

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

  // 缩放
  const zoom = useCallback((delta: number, pivotYear?: number) => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      const zoomFactor = delta > 0 ? 0.85 : 1.18;
      let newRange = range * zoomFactor;
      newRange = Math.max(timelineConfig.minViewRange, Math.min(timelineConfig.maxViewRange, newRange));

      const center = pivotYear ?? prev.centerYear;
      let newStart = center - newRange / 2;
      let newEnd = center + newRange / 2;

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

  // 平移
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

  // 选择事件
  const selectEvent = useCallback((event: HistoricalEvent | null) => {
    setSelectedEvent(event);
    // 通过 EventBus 通知其他模块（不自动跳转，由用户在详情面板中手动操作）
    eventBus.emit('event:selected', event, 'timeline');
    if (event?.persons?.length) {
      eventBus.emit('relation:highlightNodes', event.persons, 'timeline');
    }
  }, []);

  // 悬停事件
  const hoverEvent = useCallback((event: HistoricalEvent | null) => {
    setHoveredEvent(event);
    eventBus.emit('event:highlight', event, 'timeline');
  }, []);

  // 过滤
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

  // 过滤后的事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (filters.categories.size > 0 && !filters.categories.has(event.category)) return false;
      if (filters.factions.size > 0 && !event.factions.some(f => filters.factions.has(f))) return false;
      return true;
    });
  }, [events, filters]);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pivotYear = xToYear(x, rect.width);
    zoom(e.deltaY > 0 ? 1 : -1, pivotYear);
  }, [zoom, xToYear]);

  // 拖拽平移
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      viewStart: viewState.viewStart,
      viewEnd: viewState.viewEnd,
    };
  }, [viewState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.x;
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
  }, []);

  // ---- 触屏手势：单指拖拽 + 双指缩放 ----
  const touchRef = useRef<{
    isTouching: boolean;
    startX: number;
    viewStart: number;
    viewEnd: number;
    initialPinchDist: number;
    initialRange: number;
    pinchCenterX: number;
    pinchCenterYear: number;
    isPinching: boolean;
  }>({
    isTouching: false,
    startX: 0,
    viewStart: 0,
    viewEnd: 0,
    initialPinchDist: 0,
    initialRange: 0,
    pinchCenterX: 0,
    pinchCenterYear: 0,
    isPinching: false,
  });

  const getPinchDist = useCallback((touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 单指：准备拖拽
      touchRef.current = {
        ...touchRef.current,
        isTouching: true,
        startX: e.touches[0].clientX,
        viewStart: viewState.viewStart,
        viewEnd: viewState.viewEnd,
        isPinching: false,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // 双指：准备缩放
      const dist = getPinchDist(e.touches);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const centerYear = viewState.viewStart + (centerX / rect.width) * (viewState.viewEnd - viewState.viewStart);
      touchRef.current = {
        ...touchRef.current,
        isPinching: true,
        initialPinchDist: dist,
        initialRange: viewState.viewEnd - viewState.viewStart,
        pinchCenterX: centerX,
        pinchCenterYear: centerYear,
      };
    }
  }, [viewState, getPinchDist]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // 阻止页面滚动
    if (e.touches.length === 1 && touchRef.current.isTouching && !touchRef.current.isPinching) {
      // 单指拖拽
      const dx = e.touches[0].clientX - touchRef.current.startX;
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
    } else if (e.touches.length === 2 && touchRef.current.isPinching) {
      // 双指缩放
      const dist = getPinchDist(e.touches);
      const scale = touchRef.current.initialPinchDist / dist;
      let newRange = touchRef.current.initialRange * scale;
      newRange = Math.max(timelineConfig.minViewRange, Math.min(timelineConfig.maxViewRange, newRange));

      const center = touchRef.current.pinchCenterYear;
      let newStart = center - (center - touchRef.current.viewStart) * (newRange / touchRef.current.initialRange);
      let newEnd = center + (touchRef.current.viewEnd - center) * (newRange / touchRef.current.initialRange);

      // 限制范围
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
    }
  }, [getPinchDist]);

  const handleTouchEnd = useCallback(() => {
    touchRef.current.isTouching = false;
    touchRef.current.isPinching = false;
    setIsDragging(false);
  }, []);

  // ---- 键盘控制 ----
  const panLeft = useCallback(() => {
    setViewState(prev => {
      const range = prev.viewEnd - prev.viewStart;
      const step = range * 0.15; // 每次平移 15%
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
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case 'ArrowDown':
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

  // 监听来自其他模块的事件
  useEffect(() => {
    const unsubs = [
      eventBus.on('timeline:viewChange', (payload) => {
        const state = payload as TimelineViewState;
        setViewState(state);
      }, 'timeline'),
      eventBus.on('event:selected', (payload) => {
        const event = payload as HistoricalEvent | null;
        if (event) {
          const midYear = (event.startYear + event.endYear) / 2;
          panTo(midYear);
        }
      }, 'timeline'),
    ];
    return () => unsubs.forEach(u => u());
  }, [panTo]);

  // 视图变化时通知其他模块
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
    panTo,
    panLeft,
    panRight,
    resetView,
    selectEvent,
    hoverEvent,
    toggleCategory,
    toggleFaction,
    filteredEvents,
    yearToX,
    xToYear,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    isDragging,
  };
}
