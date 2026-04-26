// ============================================================
// TimelineControls - 时间线控制面板
// 缩放、过滤、重置等操作
// ============================================================

import React from 'react';
import type { EventCategory, FactionId } from '../../types';
import { factions } from '../../data/factions';
import { categoryConfig } from '../../data/config';

interface TimelineControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  activeCategories: Set<EventCategory>;
  activeFactions: Set<FactionId>;
  onToggleCategory: (cat: EventCategory) => void;
  onToggleFaction: (faction: FactionId) => void;
  viewRange: number;
  zoomLevel: number;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  activeCategories,
  activeFactions,
  onToggleCategory,
  onToggleFaction,
  viewRange,
  zoomLevel,
}) => {
  return (
    <div className="timeline-controls">
      {/* 缩放控制 */}
      <div className="timeline-controls__section">
        <div className="timeline-controls__title">视图控制</div>
        <div className="timeline-controls__zoom">
          <button
            className="timeline-controls__btn"
            onClick={onZoomOut}
            title="缩小"
          >
            −
          </button>
          <div className="timeline-controls__zoom-info">
            <span className="timeline-controls__zoom-level">
              {zoomLevel.toFixed(1)}x
            </span>
            <span className="timeline-controls__zoom-range">
              {viewRange.toFixed(0)}年
            </span>
          </div>
          <button
            className="timeline-controls__btn"
            onClick={onZoomIn}
            title="放大"
          >
            +
          </button>
        </div>
        <button
          className="timeline-controls__btn timeline-controls__btn--reset"
          onClick={onResetView}
        >
          重置视图
        </button>
      </div>

      {/* 势力过滤 */}
      <div className="timeline-controls__section">
        <div className="timeline-controls__title">势力筛选</div>
        <div className="timeline-controls__filters">
          {Object.values(factions).map(f => (
            <button
              key={f.id}
              className={`timeline-controls__filter-btn ${activeFactions.has(f.id as FactionId) ? 'timeline-controls__filter-btn--active' : ''}`}
              style={{
                '--filter-color': f.color,
                '--filter-bg': f.bgColor,
              } as React.CSSProperties}
              onClick={() => onToggleFaction(f.id as FactionId)}
            >
              <span
                className="timeline-controls__filter-dot"
                style={{ backgroundColor: f.color }}
              />
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* 类别过滤 */}
      <div className="timeline-controls__section">
        <div className="timeline-controls__title">类别筛选</div>
        <div className="timeline-controls__filters">
          {(Object.entries(categoryConfig) as [EventCategory, typeof categoryConfig[EventCategory]][]).map(([key, cfg]) => (
            <button
              key={key}
              className={`timeline-controls__filter-btn ${activeCategories.has(key) ? 'timeline-controls__filter-btn--active' : ''}`}
              onClick={() => onToggleCategory(key)}
            >
              <span className="timeline-controls__filter-icon">{cfg.icon}</span>
              {cfg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
