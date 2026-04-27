// ============================================================
// TimelineControls - 时间线控制面板
// 缩放、过滤、重置、事件搜索等操作
// ============================================================

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { EventCategory, FactionId, HistoricalEvent } from '../../types';
import { factions } from '../../data/factions';
import { categoryConfig } from '../../data/config';
import { persons } from '../../data/persons';

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
  events: HistoricalEvent[];
  onSearchEvent: (event: HistoricalEvent | null) => void;
}

// 简易拼音转换（常用三国人物名）
const EVENT_PINYIN: Record<string, string> = {
  '赤壁': 'chibi', '官渡': 'guandu', '夷陵': 'yiling', '街亭': 'jieting',
  '五丈原': 'wuzhangyuan', '合肥': 'hefei', '荆州': 'jingzhou',
  '成都': 'chengdu', '洛阳': 'luoyang', '长安': 'changan', '许昌': 'xuchang',
  '建业': 'jianye', '宛城': 'wancheng', '徐州': 'xuzhou', '汉中': 'hanzhong',
  '襄阳': 'xiangyang', '江东': 'jiangdong', '中原': 'zhongyuan',
  '黄巾': 'huangjin', '董卓': 'dongzhuo', '曹操': 'caocao', '刘备': 'liubei',
  '孙权': 'sunquan', '诸葛亮': 'zhugeliang', '关羽': 'guanyu', '张飞': 'zhangfei',
  '赵云': 'zhaoyun', '吕布': 'lvbu', '周瑜': 'zhouyu', '司马懿': 'simayi',
  '吕布': 'lvbu', '貂蝉': 'diaochan', '袁绍': 'yuanshao', '袁术': 'yuanshu',
  '吕蒙': 'lvmeng', '陆逊': 'luxun', '姜维': 'jiangwei', '庞统': 'pangtong',
  '法正': 'fazheng', '荀彧': 'xunyu', '郭嘉': 'guojia', '贾诩': 'jiaxu',
  '鲁肃': 'lusu', '黄忠': 'huangzhong', '马超': 'machao', '魏延': 'weiyan',
  '典韦': 'dianwei', '许褚': 'xuchu', '张辽': 'zhangliao', '徐晃': 'xuhuang',
  '张郃': 'zhanghe', '于禁': 'yujin', '乐进': 'yuejin', '曹仁': 'caoren',
  '夏侯惇': 'xiahoudun', '夏侯渊': 'xiahouyuan', '曹丕': 'caopi', '曹植': 'caozhi',
  '孙策': 'sunce', '甘宁': 'ganning', '太史慈': 'taishici', '黄盖': 'huanggai',
  '程普': 'chengpu', '马谡': 'masu', '王平': 'wangping', '廖化': 'liaohua',
  '邓艾': 'dengai', '钟会': 'zhonghui', '司马昭': 'simazhao', '司马师': 'simashi',
  '陈寿': 'chenshou', '华佗': 'huatuo', '张仲景': 'zhangzhongjing',
  '曹冲': 'caochong', '蔡文姬': 'caiwenji', '甄宓': 'zhenmi',
};

function getEventPinyin(text: string): string {
  let result = text;
  for (const [cn, py] of Object.entries(EVENT_PINYIN)) {
    result = result.replace(new RegExp(cn, 'g'), py);
  }
  return result.toLowerCase();
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
  events,
  onSearchEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchBoxRect, setSearchBoxRect] = useState<DOMRect | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // 搜索结果：多维度匹配
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();

    // 检查是否为年份搜索（如 "200" 或 "200-220"）
    const yearMatch = q.match(/^(\d{3})(?:-(\d{3}))?$/);

    return events
      .filter(e => {
        // 年份搜索
        if (yearMatch) {
          const y1 = parseInt(yearMatch[1]);
          const y2 = yearMatch[2] ? parseInt(yearMatch[2]) : y1;
          if (yearMatch[2]) {
            // 范围搜索：事件年份与搜索范围有交集
            return e.startYear <= y2 && e.endYear >= y1;
          } else {
            // 单年份搜索
            return e.startYear <= y1 && e.endYear >= y1;
          }
        }

        // 标题匹配
        if (e.title.toLowerCase().includes(q)) return true;

        // 描述匹配
        if (e.description && e.description.toLowerCase().includes(q)) return true;

        // 人物名匹配
        if (e.persons && e.persons.length > 0) {
          for (const pid of e.persons) {
            const person = persons.find(p => p.id === pid);
            if (person && person.name.toLowerCase().includes(q)) return true;
          }
        }

        // 地点名匹配
        if (e.location && e.location.name.toLowerCase().includes(q)) return true;

        // 拼音匹配（标题 + 地点）
        const titlePinyin = getEventPinyin(e.title);
        if (titlePinyin.includes(q)) return true;
        if (e.location) {
          const locPinyin = getEventPinyin(e.location.name);
          if (locPinyin.includes(q)) return true;
        }

        return false;
      })
      .slice(0, 12);
  }, [searchQuery, events]);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (isComposingRef.current) return;
    setShowResults(value.trim().length > 0);
    // 更新搜索框位置（用于 fixed 定位）
    if (searchInputRef.current) {
      setSearchBoxRect(searchInputRef.current.getBoundingClientRect());
    }
  }, []);

  const handleSearchSelect = (event: HistoricalEvent) => {
    onSearchEvent(event);
    setSearchQuery('');
    setShowResults(false);
  };

  // 获取事件关联的人物名列表
  const getPersonNames = useCallback((event: HistoricalEvent): string => {
    if (!event.persons || event.persons.length === 0) return '';
    return event.persons
      .slice(0, 3)
      .map(pid => {
        const p = persons.find(pp => pp.id === pid);
        return p?.name || pid;
      })
      .join('、') + (event.persons.length > 3 ? ' 等' : '');
  }, []);

  return (
    <div className="timeline-controls">
      {/* 事件搜索 */}
      <div className="timeline-controls__section" ref={searchRef}>
        <div className="timeline-controls__title">🔍 事件搜索</div>
        <div className="timeline-controls__search">
          <input
            className="timeline-controls__search-input"
            ref={searchInputRef}
            type="text"
            placeholder="搜索事件、人物、地点、年份..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) {
                setShowResults(true);
                if (searchInputRef.current) setSearchBoxRect(searchInputRef.current.getBoundingClientRect());
              }
            }}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              handleSearchChange((e.target as HTMLInputElement).value);
            }}
          />
          {searchQuery && (
            <button
              className="timeline-controls__search-clear"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
            >
              ✕
            </button>
          )}
        </div>
        {showResults && searchResults.length > 0 && (
          <div
            className="timeline-controls__search-results"
            style={searchBoxRect ? {
              top: searchBoxRect.bottom + 4,
              left: searchBoxRect.left,
            } : undefined}
          >
            {searchResults.map(event => {
              const mainFaction = factions[event.factions[0]] || factions.other;
              const catCfg = categoryConfig[event.category];
              const yearText = event.startYear === event.endYear
                ? `${event.startYear}年`
                : `${event.startYear}-${event.endYear}年`;
              const personNames = getPersonNames(event);
              return (
                <button
                  key={event.id}
                  className="timeline-controls__search-item"
                  onClick={() => handleSearchSelect(event)}
                >
                  <div className="timeline-controls__search-item-header">
                    <span
                      className="timeline-controls__search-item-dot"
                      style={{ backgroundColor: mainFaction.color }}
                    />
                    <span className="timeline-controls__search-item-title">{event.title}</span>
                    <span className="timeline-controls__search-item-year">{yearText}</span>
                  </div>
                  <div className="timeline-controls__search-item-meta">
                    <span className="timeline-controls__search-item-tag" style={{
                      color: mainFaction.color,
                      borderColor: mainFaction.color + '44',
                    }}>
                      {mainFaction.name}
                    </span>
                    {catCfg && (
                      <span className="timeline-controls__search-item-tag">
                        {catCfg.icon} {catCfg.label}
                      </span>
                    )}
                  </div>
                  {personNames && (
                    <div className="timeline-controls__search-item-persons">
                      👤 {personNames}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {showResults && searchQuery.trim() && searchResults.length === 0 && (
          <div className="timeline-controls__search-empty">
            未找到匹配事件
            <div className="timeline-controls__search-empty-hint">
              支持搜索：事件名、人物、地点、年份（如 208、200-220）
            </div>
          </div>
        )}
      </div>

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
