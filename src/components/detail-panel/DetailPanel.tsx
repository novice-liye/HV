// ============================================================
// DetailPanel - 事件详情面板
// 显示选中事件的详细信息
// ============================================================

import React, { useEffect, useRef } from 'react';
import type { HistoricalEvent } from '../../types';
import { factions } from '../../data/factions';
import { categoryConfig } from '../../data/config';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { persons } from '../../data/persons';
import { events } from '../../data/events';

interface DetailPanelProps {
  event: HistoricalEvent;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ event, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const mainFaction = factions[event.factions[0]] || factions.other;
  const category = categoryConfig[event.category];

  // ESC 关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 通知地图模块 + 跳转到地图页面
  const handleShowOnMap = () => {
    // 先跳转，等地图组件挂载后再触发动画
    navigateToModule('territory', 'detail-panel');
    setTimeout(() => {
      if (event.location) {
        eventBus.emit('map:flyTo', event.location.coordinate, 'detail-panel');
      }
      if (event.mapAnimation) {
        eventBus.emit('map:playAnimation', event.mapAnimation, 'detail-panel');
        eventBus.emit('event:selected', event, 'detail-panel');
      }
    }, 300);
  };

  // 通知关系图模块 + 跳转到关系图页面
  const handleShowRelations = () => {
    if (event.persons.length) {
      eventBus.emit('relation:focusNode', event.persons[0], 'detail-panel');
    }
    navigateToModule('relation-graph', 'detail-panel');
  };

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="detail-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          '--panel-accent': mainFaction.color,
          '--panel-bg': mainFaction.bgColor,
        } as React.CSSProperties}
      >
        {/* 头部 */}
        <div className="detail-panel__header">
          <div className="detail-panel__header-left">
            <span className="detail-panel__icon">{category.icon}</span>
            <div>
              <h2 className="detail-panel__title">{event.title}</h2>
              <div className="detail-panel__meta">
                <span className="detail-panel__year">
                  {event.startYear === event.endYear
                    ? `公元 ${event.startYear} 年`
                    : `公元 ${event.startYear} — ${event.endYear} 年`}
                </span>
                <span className="detail-panel__category" style={{ color: mainFaction.color }}>
                  {category.label}
                </span>
              </div>
            </div>
          </div>
          <button className="detail-panel__close" onClick={onClose}>✕</button>
        </div>

        {/* 势力标签 */}
        <div className="detail-panel__factions">
          {event.factions.map(fid => {
            const f = factions[fid];
            if (!f) return null;
            return (
              <span
                key={fid}
                className="detail-panel__faction-tag"
                style={{
                  backgroundColor: f.bgColor,
                  borderColor: f.color,
                  color: f.color,
                }}
              >
                {f.name}
              </span>
            );
          })}
        </div>

        {/* 描述 */}
        <div className="detail-panel__description">
          {event.description}
        </div>

        {/* 详细内容 */}
        {event.detailHtml && (
          <div
            className="detail-panel__detail"
            dangerouslySetInnerHTML={{ __html: event.detailHtml }}
          />
        )}

        {/* 地点信息 */}
        {event.location && (
          <div className="detail-panel__location">
            <span className="detail-panel__location-icon">📍</span>
            <span>{event.location.name}</span>
            <button
              className="detail-panel__action-btn"
              onClick={handleShowOnMap}
              style={{ '--btn-color': mainFaction.color } as React.CSSProperties}
            >
              在地图上查看
            </button>
          </div>
        )}

        {/* 人物关联 */}
        {event.persons.length > 0 && (
          <div className="detail-panel__persons">
            <span className="detail-panel__persons-label">相关人物：</span>
            <div className="detail-panel__persons-list">
              {event.persons.map(pid => (
                <span
                  key={pid}
                  className="detail-panel__person-tag"
                >
                  {persons.find(p => p.id === pid)?.name || pid.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <button
              className="detail-panel__action-btn"
              onClick={handleShowRelations}
              style={{ '--btn-color': mainFaction.color } as React.CSSProperties}
            >
              查看关系图
            </button>
          </div>
        )}

        {/* 标签 */}
        {event.tags && event.tags.length > 0 && (
          <div className="detail-panel__tags">
            {event.tags.map(tag => (
              <span key={tag} className="detail-panel__tag">{tag}</span>
            ))}
          </div>
        )}

        {/* 关联事件 */}
        {event.relatedEvents && event.relatedEvents.length > 0 && (
          <div className="detail-panel__related">
            <span className="detail-panel__related-label">关联事件：</span>
            <div className="detail-panel__related-list">
              {event.relatedEvents.map(rid => (
                <span key={rid} className="detail-panel__related-tag">
                  {events.find(e => e.id === rid)?.title || rid}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 信息来源 */}
        {event.sources && event.sources.length > 0 && (
          <div className="detail-panel__sources">
            <div className="detail-panel__sources-title">📚 信息来源</div>
            {event.sources.map((src, i) => (
              <div
                key={i}
                className="detail-panel__source-item"
                style={{
                  borderLeftColor: src.type === 'history'
                    ? 'var(--panel-accent)'
                    : src.type === 'fiction'
                      ? '#C026D3'
                      : '#666',
                }}
              >
                <div className="detail-panel__source-header">
                  <span className="detail-panel__source-book">{src.book}</span>
                  <span className="detail-panel__source-chapter">{src.chapter}</span>
                  {src.type && (
                    <span
                      className="detail-panel__source-type"
                      style={{
                        background: src.type === 'history'
                          ? 'rgba(201,169,110,0.15)'
                          : src.type === 'fiction'
                            ? 'rgba(192,38,211,0.15)'
                            : 'rgba(255,255,255,0.05)',
                        color: src.type === 'history'
                          ? '#c9a96e'
                          : src.type === 'fiction'
                            ? '#C026D3'
                            : '#888',
                      }}
                    >
                      {src.type === 'history' ? '正史' : src.type === 'fiction' ? '演义' : '其他'}
                    </span>
                  )}
                </div>
                <div className="detail-panel__source-text">「{src.text}」</div>
              </div>
            ))}
          </div>
        )}

        {/* 地图动画预留区域 */}
        {event.mapAnimation && (
          <div className="detail-panel__map-preview">
            <div className="detail-panel__map-preview-label">
              🗺️ 地图动画可用
            </div>
            <button
              className="detail-panel__action-btn detail-panel__action-btn--primary"
              onClick={handleShowOnMap}
              style={{ '--btn-color': mainFaction.color } as React.CSSProperties}
            >
              播放动画
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
