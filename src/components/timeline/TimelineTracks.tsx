// ============================================================
// TimelineTracks - 事件轨道区域
// 按分类显示事件线段，自动碰撞检测分配子行避免重叠
// ============================================================

import React, { useMemo, useRef } from 'react';
import type { HistoricalEvent, EventCategory, TimelineViewState } from '../../types';
import { EventBar } from './EventBar';
import { categoryConfig } from '../../data/config';

interface TimelineTracksProps {
  events: HistoricalEvent[];
  viewState: TimelineViewState;
  yearToX: (year: number, width: number) => number;
  width: number;
  selectedEvent: HistoricalEvent | null;
  hoveredEvent: HistoricalEvent | null;
  activeFaction: string | null; // 当前筛选的势力 ID
  onSelectEvent: (event: HistoricalEvent) => void;
  onHoverEvent: (event: HistoricalEvent | null) => void;
  hasDragged: boolean; // 是否在拖拽中（用于阻止事件条 onClick 误触发）
}

const TRACK_GAP = 6;
const TRACK_PADDING_TOP = 12;
const SUB_ROW_HEIGHT = 22;
const LABEL_AREA_WIDTH = 65; // 左侧标签区域宽度，事件条不会进入此区域

export const TimelineTracks: React.FC<TimelineTracksProps> = React.memo(({
  events,
  viewState,
  yearToX,
  width,
  selectedEvent,
  hoveredEvent,
  activeFaction,
  onSelectEvent,
  onHoverEvent,
  hasDragged,
}) => {
  const containerRef = useRef<HTMLDivElement>( null);

  // 按轨道分组 + 碰撞检测分配子行
  const trackLayout = useMemo(() => {
    const activeCategories = new Set<EventCategory>();

    const visibleEvents = events.filter(evt =>
      evt.endYear >= viewState.viewStart &&
      evt.startYear <= viewState.viewEnd
    );

    visibleEvents.forEach(evt => {
      activeCategories.add(evt.category);
    });

    const layout: Array<{
      category: EventCategory;
      trackIndex: number;
      subRows: Array<{
        events: Array<{
          event: HistoricalEvent;
          x: number;
          barWidth: number;
        }>;
      }>;
      totalSubRows: number;
      height: number;
      baseY: number;
    }> = [];

    activeCategories.forEach(cat => {
      const trackIndex = categoryConfig[cat].trackIndex;
      const catEvents = visibleEvents.filter(evt => evt.category === cat);

      // 计算每个事件的像素位置，最小 x = LABEL_AREA_WIDTH
      const positioned = catEvents.map(event => {
        const rawX = yearToX(event.startYear, width);
        const startX = Math.max(LABEL_AREA_WIDTH, rawX);
        const endX = Math.max(LABEL_AREA_WIDTH, Math.min(width, yearToX(event.endYear, width)));
        const barWidth = endX - startX;
        return { event, x: startX, barWidth };
      });

      // 按开始年份排序
      positioned.sort((a, b) => a.event.startYear - b.event.startYear || a.event.endYear - b.event.endYear);

      // 碰撞检测：贪心算法分配子行
      const subRows: Array<Array<typeof positioned[0]>> = [];
      const LABEL_WIDTH = 120;

      for (const item of positioned) {
        let placed = false;

        for (let i = 0; i < subRows.length; i++) {
          const lastInRow = subRows[i][subRows[i].length - 1];
          const lastEnd = lastInRow.x + Math.max(lastInRow.barWidth, 10) + LABEL_WIDTH;
          if (item.x >= lastEnd - 10) {
            subRows[i].push(item);
            placed = true;
            break;
          }
        }

        if (!placed) {
          subRows.push([item]);
        }
      }

      const totalSubRows = Math.max(subRows.length, 1);
      const height = totalSubRows * SUB_ROW_HEIGHT;

      layout.push({
        category: cat,
        trackIndex,
        subRows: subRows.map(row => ({ events: row })),
        totalSubRows,
        height,
        baseY: 0,
      });
    });

    // 按 trackIndex 排序并计算 Y 坐标
    layout.sort((a, b) => a.trackIndex - b.trackIndex);
    let currentY = TRACK_PADDING_TOP;
    for (const track of layout) {
      track.baseY = currentY;
      currentY += track.height + TRACK_GAP;
    }

    return { layout, totalHeight: currentY };
  }, [events, viewState, yearToX, width]);

  return (
    <div
      ref={containerRef}
      className="timeline-tracks"
      data-has-highlight={hoveredEvent ? 'true' : undefined}
      style={{ width, height: trackLayout.totalHeight, position: 'relative' }}
    >
      {trackLayout.layout.map(track => {
        const config = categoryConfig[track.category];

        return (
          <React.Fragment key={track.category}>
            {/* 轨道分类标签 - 带半透明背景 */}
            <div
              className="timeline-track-label"
              style={{
                position: 'absolute',
                left: 0,
                top: track.baseY,
                width: LABEL_AREA_WIDTH - 5,
                height: track.height,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                paddingLeft: 4,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                background: 'rgba(26, 26, 46, 0.85)',
                borderRight: '1px solid rgba(201, 169, 110, 0.15)',
                borderRadius: '4px 0 0 4px',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </div>

            {/* 轨道背景（交替色） */}
            <div
              style={{
                position: 'absolute',
                left: LABEL_AREA_WIDTH,
                top: track.baseY,
                right: 0,
                height: track.height,
                background: track.trackIndex % 2 === 0
                  ? 'rgba(201, 169, 110, 0.03)'
                  : 'rgba(201, 169, 110, 0.01)',
                borderRadius: 4,
                pointerEvents: 'none',
              }}
            />

            {/* 子行中的事件条 */}
            {track.subRows.map((subRow, subIdx) =>
              subRow.events.map(({ event, x, barWidth }) => {
                const y = track.baseY + subIdx * SUB_ROW_HEIGHT + (SUB_ROW_HEIGHT - (event.importance === 'critical' ? 28 : event.importance === 'major' ? 22 : 16)) / 2;

                return (
                  <EventBar
                    key={event.id}
                    event={event}
                    x={x}
                    width={barWidth}
                    trackY={y}
                    subRowIndex={subIdx}
                    isSelected={selectedEvent?.id === event.id}
                    isHovered={hoveredEvent?.id === event.id}
                    activeFaction={activeFaction}
                    onSelect={onSelectEvent}
                    onHover={onHoverEvent}
                    hasDragged={hasDragged}
                  />
                );
              })
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

TimelineTracks.displayName = 'TimelineTracks';
