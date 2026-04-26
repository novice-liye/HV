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
  const [containerWidth, setContainerWidth] = useState(1200);

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
    filteredEvents,
    yearToX,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    isDragging,
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

  // 点击空白区域取消选择
  const handleBackgroundClick = useCallback(() => {
    selectEvent(null);
  }, [selectEvent]);

  const viewRange = viewState.viewEnd - viewState.viewStart;

  return (
    <div className="timeline-root" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* 控制面板 */}
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
      />

      {/* 时间线主体 */}
      <div className="timeline-main">
        {/* 标题栏 */}
        <div className="timeline-header">
          <h1 className="timeline-title">三国历史时间线</h1>
          <span className="timeline-subtitle">
            公元 {timelineConfig.minYear} — {timelineConfig.maxYear} 年
          </span>
          <span className="timeline-event-count">
            {filteredEvents.length} 个事件
          </span>
        </div>

        {/* 时间线画布 */}
        <div
          ref={containerRef}
          className="timeline-canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleBackgroundClick}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          {/* 年份轴 */}
          <TimelineAxis
            viewState={viewState}
            yearToX={yearToX}
            width={containerWidth}
          />

          {/* 事件轨道 */}
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
          />
        </div>

        {/* 缩放提示 */}
        <div className="timeline-hint">
          滚轮/双指缩放 · 拖拽平移 · 方向键移动 · +/- 缩放 · Esc 重置
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


