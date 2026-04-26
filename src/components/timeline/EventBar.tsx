// ============================================================
// EventBar - 单个事件条组件
// 显示在时间线轨道上的事件线段
// 优化：小事件也显示名称标签，避免只显示单色圆点
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import type { HistoricalEvent } from '../../types';
import { factions } from '../../data/factions';
import { categoryConfig, importanceConfig } from '../../data/config';

interface EventBarProps {
  event: HistoricalEvent;
  x: number;
  width: number;
  trackY: number;
  subRowIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  activeFaction: string | null; // 当前筛选的势力 ID，null 表示未筛选
  onSelect: (event: HistoricalEvent) => void;
  onHover: (event: HistoricalEvent | null) => void;
}

export const EventBar: React.FC<EventBarProps> = React.memo(({
  event,
  x,
  width,
  trackY,
  isSelected,
  isHovered,
  activeFaction,
  onSelect,
  onHover,
}: EventBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 筛选状态下使用筛选势力的颜色，否则使用事件第一个势力的颜色
  const displayFaction = activeFaction
    ? (factions[activeFaction] || factions.other)
    : (factions[event.factions[0]] || factions.other);
  const category = categoryConfig[event.category];
  const importance = importanceConfig[event.importance];

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(event);
  }, [event, onSelect]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    onHover(event);
    setShowTooltip(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, [event, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
    setShowTooltip(false);
  }, [onHover]);

  // 事件太短时显示为圆点 + 标签
  const isPoint = width < 20;
  // 判断条形内是否能放下完整标题（估算：每个中文字约11px + icon 14px + padding 8px）
  const titleWidth = event.title.length * 11 + 22;
  const canFitTitle = !isPoint && width > titleWidth + 8;
  const barWidth = isPoint ? 10 : Math.max(width, 24);
  const barLeft = isPoint ? x - 5 : x;

  return (
    <>
      <div
        ref={barRef}
        role="button"
        tabIndex={0}
        aria-label={`${event.title} (${event.startYear}${event.startYear !== event.endYear ? '-' + event.endYear : ''}年)`}
        className={`event-bar ${isSelected ? 'event-bar--selected' : ''} ${isHovered ? 'event-bar--hovered' : ''}`}
        style={{
          position: 'absolute',
          left: barLeft,
          top: trackY,
          width: barWidth,
          height: importance.height,
          backgroundColor: displayFaction.color,
          borderColor: displayFaction.color,
          zIndex: importance.zIndex + (isHovered ? 100 : 0) + (isSelected ? 200 : 0),
          borderRadius: isPoint ? '50%' : '3px',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
          opacity: isHovered || isSelected ? 1 : 0.85,
          transform: isHovered || isSelected ? 'scaleY(1.15)' : 'scaleY(1)',
          boxShadow: isSelected
            ? `0 0 12px ${displayFaction.color}, 0 0 4px ${displayFaction.color}`
            : isHovered
              ? `0 0 8px ${displayFaction.color}80`
              : 'none',
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 事件名称标签 - 条形内显示（仅当空间足够时） */}
        {canFitTitle && (
          <span
            className="event-bar__label"
            style={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              maxWidth: width - 8,
            }}
          >
            {event.title}
          </span>
        )}
      </div>

      {/* 浮动名称标签 - 圆点事件 或 条形内放不下标题时 */}
      {(isPoint || !canFitTitle) && (
        <div
          className="event-bar__float-label"
          style={{
            position: 'absolute',
            left: barLeft + barWidth + 4,
            top: trackY + (importance.height - 14) / 2,
            fontSize: 11,
            color: isHovered || isSelected ? '#e8e0d0' : 'rgba(232, 224, 208, 0.75)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
            lineHeight: '14px',
            maxWidth: 150,
            zIndex: importance.zIndex + (isHovered ? 100 : 0) + (isSelected ? 200 : 0) - 1,
            transition: 'color 0.15s ease',
          }}
        >
          <span style={{ marginRight: 3, fontSize: 10 }}>{category.icon}</span>
          {event.title}
        </div>
      )}

      {/* 悬浮提示 */}
      {showTooltip && !isSelected && (
        <div
          className="event-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          <div className="event-tooltip__header" style={{ borderColor: displayFaction.color }}>
            <span className="event-tooltip__icon">{category.icon}</span>
            <span className="event-tooltip__title">{event.title}</span>
          </div>
          <div className="event-tooltip__meta">
            <span>{event.startYear === event.endYear ? `${event.startYear}年` : `${event.startYear}-${event.endYear}年`}</span>
            <span style={{ color: displayFaction.color }}>{displayFaction.name}</span>
          </div>
          <div className="event-tooltip__desc">{event.description.length > 60 ? event.description.slice(0, 60) + '...' : event.description}</div>
        </div>
      )}
    </>
  );
});

EventBar.displayName = 'EventBar';
