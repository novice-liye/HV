// ============================================================
// VerticalTimeline - 竖向时间线（移动端专用）
// 年份从上到下排列，事件按时间顺序展示
// ============================================================

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { HistoricalEvent, EventCategory, FactionId } from '../../types';
import { categoryConfig } from '../../data/config';
import { factions } from '../../data/factions';

interface VerticalTimelineProps {
  events: HistoricalEvent[];
  selectedEvent: HistoricalEvent | null;
  onSelectEvent: (event: HistoricalEvent | null) => void;
  activeCategories: Set<EventCategory>;
  activeFactions: Set<FactionId>;
  onToggleCategory: (cat: EventCategory) => void;
  onToggleFaction: (faction: FactionId) => void;
  clearFilters: () => void;
}

// 按分类筛选后的排序事件
function getFilteredEvents(events: HistoricalEvent[], categories: Set<EventCategory>, factionsFilter: Set<FactionId>): HistoricalEvent[] {
  return events
    .filter(e => categories.has(e.category))
    .filter(e => factionsFilter.size === 0 || e.factions.some(f => factionsFilter.has(f)))
    .sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);
}

// 获取事件的主势力颜色
function getEventColor(event: HistoricalEvent): string {
  if (event.factions.length > 0) {
    const faction = factions[event.factions[0]];
    if (faction) return faction.color;
  }
  return '#8B8B8B';
}

// 获取事件的主势力名称
function getEventFactionName(event: HistoricalEvent): string {
  if (event.factions.length > 0) {
    const faction = factions[event.factions[0]];
    if (faction) return faction.name;
  }
  return '';
}

// 按年份分组
function groupByYear(events: HistoricalEvent[]): Map<number, HistoricalEvent[]> {
  const groups = new Map<number, HistoricalEvent[]>();
  for (const event of events) {
    const key = event.startYear;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return groups;
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  activeCategories,
  activeFactions,
  onToggleCategory,
  onToggleFaction,
  clearFilters,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<EventCategory>>(
    new Set(Object.keys(categoryConfig) as EventCategory[])
  );
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(
    () => getFilteredEvents(events, activeCategories, activeFactions),
    [events, activeCategories, activeFactions]
  );

  const yearGroups = useMemo(() => groupByYear(filteredEvents), [filteredEvents]);

  const toggleCategoryExpand = useCallback((cat: EventCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // 按分类分组统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const e of events) {
      stats[e.category] = (stats[e.category] || 0) + 1;
    }
    return stats;
  }, [events]);

  // 势力统计
  const factionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const e of events) {
      for (const f of e.factions) {
        stats[f] = (stats[f] || 0) + 1;
      }
    }
    return stats;
  }, [events]);

  return (
    <div className="vtl-root">
      {/* 顶部筛选栏 */}
      <div className="vtl-toolbar">
        <div className="vtl-toolbar__left">
          <span className="vtl-toolbar__count">{filteredEvents.length} 个事件</span>
          <button
            className="vtl-toolbar__btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '收起' : '筛选'}
          </button>
          {(activeCategories.size < 7 || activeFactions.size > 0) && (
            <button className="vtl-toolbar__btn vtl-toolbar__btn--clear" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="vtl-filters">
          <div className="vtl-filters__section">
            <div className="vtl-filters__label">分类</div>
            <div className="vtl-filters__tags">
              {(Object.keys(categoryConfig) as EventCategory[]).map(cat => (
                <button
                  key={cat}
                  className={`vtl-filter-tag ${activeCategories.has(cat) ? 'vtl-filter-tag--active' : ''}`}
                  onClick={() => onToggleCategory(cat)}
                  style={activeCategories.has(cat) ? {
                    borderColor: categoryConfig[cat].icon === '⚔️' ? '#E74C3C' :
                      categoryConfig[cat].icon === '🏛️' ? '#3498DB' :
                      categoryConfig[cat].icon === '👤' ? '#2ECC71' :
                      categoryConfig[cat].icon === '🤝' ? '#F39C12' :
                      categoryConfig[cat].icon === '🔥' ? '#E67E22' :
                      categoryConfig[cat].icon === '🏗️' ? '#9B59B6' : '#95A5A6',
                  } : {}}
                >
                  {categoryConfig[cat].icon} {categoryConfig[cat].label}
                  <span className="vtl-filter-tag__count">{categoryStats[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vtl-filters__section">
            <div className="vtl-filters__label">势力</div>
            <div className="vtl-filters__tags">
              {(['wei', 'shu', 'wu', 'han', 'other'] as FactionId[]).map(fId => {
                const f = factions[fId];
                if (!f) return null;
                return (
                  <button
                    key={fId}
                    className={`vtl-filter-tag ${activeFactions.has(fId) ? 'vtl-filter-tag--active' : ''}`}
                    onClick={() => onToggleFaction(fId)}
                    style={activeFactions.has(fId) ? { borderColor: f.color } : {}}
                  >
                    {f.name}
                    <span className="vtl-filter-tag__count">{factionStats[fId] || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 竖向时间线列表 */}
      <div className="vtl-list" ref={listRef}>
        {filteredEvents.length === 0 && (
          <div className="vtl-empty">暂无匹配的事件</div>
        )}
        {Array.from(yearGroups.entries()).map(([year, yearEvents]) => (
          <div key={year} className="vtl-year-group">
            {/* 年份标记 */}
            <div className="vtl-year-marker">
              <div className="vtl-year-marker__dot" />
              <div className="vtl-year-marker__line" />
            </div>
            <div className="vtl-year-label">公元 {year} 年</div>

            {/* 该年份的事件 */}
            <div className="vtl-events">
              {yearEvents.map(event => {
                const color = getEventColor(event);
                const factionName = getEventFactionName(event);
                const cat = categoryConfig[event.category];
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    className={`vtl-event ${isSelected ? 'vtl-event--selected' : ''}`}
                    onClick={() => onSelectEvent(isSelected ? null : event)}
                  >
                    <div className="vtl-event__dot" style={{ background: color }} />
                    <div className="vtl-event__content">
                      <div className="vtl-event__header">
                        <span className="vtl-event__title">{event.title}</span>
                        {event.endYear !== event.startYear && (
                          <span className="vtl-event__duration">
                            {event.startYear}-{event.endYear}
                          </span>
                        )}
                      </div>
                      <div className="vtl-event__meta">
                        <span className="vtl-event__cat" style={{ color }}>
                          {cat?.icon} {cat?.label}
                        </span>
                        {factionName && (
                          <span className="vtl-event__faction">{factionName}</span>
                        )}
                        {event.importance === 'critical' && (
                          <span className="vtl-event__importance">关键</span>
                        )}
                      </div>
                      <div className="vtl-event__desc">{event.description}</div>
                      {event.persons.length > 0 && (
                        <div className="vtl-event__persons">
                          {event.persons.slice(0, 5).map(p => (
                            <span key={p} className="vtl-event__person">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
