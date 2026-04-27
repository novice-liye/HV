// ============================================================
// Timeline - 时间线主组件
// 整合轴、轨道、控制器
// ============================================================

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTimeline } from '../../hooks/useTimeline';
import { TimelineAxis } from './TimelineAxis';
import { TimelineTracks } from './TimelineTracks';
import { TimelineControls } from './TimelineControls';
import { DetailPanel } from '../detail-panel/DetailPanel';
import { events } from '../../data/events';
import { timelineConfig } from '../../data/config';

export const Timeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  const {
    viewState,
    selectedEvent,
    hoveredEvent,
    filters,
    zoomIn,
    zoomOut,
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
    panTo,
  } = useTimeline({ events });

  // 监听容器大小
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ============================================================
  // 全局鼠标事件绑定（document 级别）
  // 确保 mousemove/mouseup 在鼠标移出元素后仍然正常工作
  // ============================================================
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // 将原生 MouseEvent 转换为 React.MouseEvent 格式
      handleMouseMove(e as unknown as React.MouseEvent);
    };
    const onMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 点击空白区域取消选择（仅在非拖拽时触发）
  const handleBackgroundClick = useCallback(() => {
    if (hasDragged) return;
    selectEvent(null);
  }, [selectEvent, hasDragged]);

  // 轨道区域鼠标按下 - 复用 hook 中的 handleMouseDown
  const handleTracksMouseDown = useCallback((e: React.MouseEvent) => {
    handleMouseDown(e);
  }, [handleMouseDown]);

  // 轨道区域触屏开始 - 复用 hook 中的 handleTouchStart
  const handleTracksTouchStart = useCallback((e: React.TouchEvent) => {
    handleTouchStart(e);
  }, [handleTouchStart]);

  // 轨道区域触屏移动 - 复用 hook 中的 handleTouchMove
  const handleTracksTouchMove = useCallback((e: React.TouchEvent) => {
    handleTouchMove(e);
  }, [handleTouchMove]);

  // 轨道区域触屏结束 - 复用 hook 中的 handleTouchEnd
  const handleTracksTouchEnd = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  // 轨道区域垂直滚动：通过 Shift+滚轮 或在轨道区域使用双指上下滑动
  // PC端：轨道区域的滚轮已被 handleTracksWheel 拦截为缩放
  // 手机端：轨道区域需要保留垂直滚动能力（通过 CSS overflow-y: auto）
  // 这里提供一个额外的 Shift+滚轮 = 垂直滚动轨道的功能
  const handleTracksShiftWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey) {
      // Shift+滚轮：允许原生垂直滚动
      // 不阻止默认行为，让浏览器处理滚动
      return;
    }
    // 非 Shift 滚轮：缩放（由 handleTracksWheel 处理）
    handleTracksWheel(e);
  }, [handleTracksWheel]);

  const viewRange = viewState.viewEnd - viewState.viewStart;

  // 搜索事件：清除筛选 → panTo → hoverEvent 高亮
  const handleSearchEvent = useCallback((event: import('../../types').HistoricalEvent | null) => {
    if (event) {
      clearFilters();
      const midYear = (event.startYear + event.endYear) / 2;
      panTo(midYear);
      setTimeout(() => {
        hoverEvent(event);
      }, 300);
    }
  }, [panTo, hoverEvent, clearFilters]);

  return (
    <div className="timeline-root" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* 控制面板 */}
      <div className={`timeline-controls-wrapper ${controlsCollapsed ? 'timeline-controls-wrapper--collapsed' : ''}`}>
        <TimelineControls
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
          activeCategories={filters.categories}
          activeFactions={filters.factions}
          onToggleCategory={toggleCategory}
          onToggleFaction={toggleFaction}
          viewRange={viewRange}
          zoomLevel={viewState.zoomLevel}
          events={events}
          onSearchEvent={handleSearchEvent}
        />
      </div>

      {/* 控制面板折叠/展开按钮 */}
      <button
        className={`timeline-controls-toggle ${controlsCollapsed ? 'timeline-controls-toggle--collapsed' : ''}`}
        onClick={() => setControlsCollapsed(prev => !prev)}
        title={controlsCollapsed ? '显示控制面板' : '隐藏控制面板'}
      >
        {controlsCollapsed ? '▶' : '◀'}
      </button>

      {/* 时间线主体 */}
      <div className="timeline-main">
        {/* 标题栏 */}
        <div className="timeline-header">
          <h1 className="timeline-title">三国历史时间线</h1>
          <span className="timeline-subtitle">
            公元 {timelineConfig.minYear} — 280 年
          </span>
          <span className="timeline-event-count">
            {filteredEvents.length} 个事件
          </span>
        </div>

        {/* 时间线画布 - 滚轮缩放 + 左键拖拽平移 + 双指缩放 + 单指平移 */}
        <div
          ref={containerRef}
          className="timeline-canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleBackgroundClick}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* 年份轴 - 固定在顶部 */}
          <TimelineAxis
            viewState={viewState}
            yearToX={yearToX}
            width={containerWidth}
          />
        </div>

        {/* 事件轨道 - 滚轮缩放 + 左键拖拽平移 + 双指缩放 + 单指平移 */}
        {/* Shift+滚轮 = 垂直滚动轨道（PC端查看更多事件） */}
        <div
          ref={tracksScrollRef}
          className="timeline-tracks-scroll"
          onWheel={handleTracksShiftWheel}
          onMouseDown={handleTracksMouseDown}
          onTouchStart={handleTracksTouchStart}
          onTouchMove={handleTracksTouchMove}
          onTouchEnd={handleTracksTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        >
          <TimelineTracks
            events={filteredEvents}
            viewState={viewState}
            yearToX={yearToX}
            width={containerWidth}
            selectedEvent={selectedEvent}
            hoveredEvent={hoveredEvent}
            activeFaction={filters.factions.size === 1 ? [...filters.factions][0] : null}
            onSelectEvent={selectEvent}
            onHoverEvent={hoverEvent}
            hasDragged={hasDragged}
          />
        </div>

        {/* 缩放提示 */}
        <div className="timeline-hint">
          滚轮缩放 · 拖拽平移 · Ctrl+滚轮精细缩放 · Shift+滚轮滚动轨道 · 方向键移动 · +/- 缩放 · Home/End 跳转 · Esc 重置
        </div>
      </div>

      {/* 详情面板 */}
      {selectedEvent && (
        <DetailPanel
          event={selectedEvent}
          onClose={() => selectEvent(null)}
        />
      )}
    </div>
  );
};
