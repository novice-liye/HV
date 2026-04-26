// ============================================================
// PersonGallery - 人物图鉴模块
// 卡片网格 + 势力筛选 + 年份过滤 + 人物详情面板
// 通过 EventBus 与时间线/关系图/仪表盘双向联动
// ============================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { persons, relationEdges } from '../../data/persons';
import { events } from '../../data/events';
import { factions } from '../../data/factions';
import type { FactionId, Person } from '../../types';

const ALL_FACTIONS: FactionId[] = ['wei', 'shu', 'wu', 'han', 'other'];

/** 获取人物相关事件 */
function getPersonEvents(personId: string) {
  return events.filter(e => e.persons.includes(personId));
}

/** 获取人物关系 */
function getPersonRelations(personId: string) {
  return relationEdges.filter(e => e.source === personId || e.target === personId);
}

/** 判断人物在指定年份是否在世 */
function isPersonAlive(person: Person, year: number): boolean {
  const birth = person.birthYear ?? 100;
  const death = person.deathYear ?? 300;
  return birth <= year && death >= year;
}

export const PersonGallery: React.FC = () => {
  const [filterFaction, setFilterFaction] = useState<FactionId | 'all'>('all');
  const [filterYear, setFilterYear] = useState(220);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchText, setSearchText] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // 筛选后的人物列表
  const filteredPersons = useMemo(() => {
    return persons.filter(p => {
      // 势力筛选
      if (filterFaction !== 'all' && p.faction !== filterFaction) return false;
      // 年份筛选：在世人物
      if (!isPersonAlive(p, filterYear)) return false;
      // 搜索筛选
      if (searchText) {
        const q = searchText.toLowerCase();
        const match = p.name.toLowerCase().includes(q)
          || (p.title || '').toLowerCase().includes(q)
          || p.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filterFaction, filterYear, searchText]);

  // 按势力分组
  const groupedPersons = useMemo(() => {
    const groups: Record<string, Person[]> = {};
    filteredPersons.forEach(p => {
      if (!groups[p.faction]) groups[p.faction] = [];
      groups[p.faction].push(p);
    });
    return groups;
  }, [filteredPersons]);

  // 各势力在指定年份的在世人数
  const factionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_FACTIONS.forEach(f => {
      counts[f] = persons.filter(p => p.faction === f && isPersonAlive(p, filterYear)).length;
    });
    return counts;
  }, [filterYear]);

  // ---- EventBus 双向联动 ----
  useEffect(() => {
    const unsubs = [
      eventBus.on('timeline:viewChange', (payload) => {
        const state = payload as { centerYear: number };
        if (state.centerYear) {
          const year = Math.round(Math.max(100, Math.min(300, state.centerYear)));
          setFilterYear(year);
        }
      }, 'person-gallery'),
      eventBus.on('event:selected', (payload) => {
        const evt = payload as { startYear: number } | null;
        if (evt?.startYear) {
          setFilterYear(Math.round(Math.max(100, Math.min(300, evt.startYear))));
        }
      }, 'person-gallery'),
      eventBus.on('dashboard:yearChange', (payload) => {
        const year = payload as number;
        setFilterYear(Math.round(Math.max(100, Math.min(300, year))));
      }, 'person-gallery'),
      eventBus.on('territory:yearChange', (payload) => {
        const year = payload as number;
        setFilterYear(Math.round(Math.max(100, Math.min(300, year))));
      }, 'person-gallery'),
      eventBus.on('relation:focusNode', (payload) => {
        const nodeId = payload as string;
        const person = persons.find(p => p.id === nodeId);
        if (person) setSelectedPerson(person);
      }, 'person-gallery'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // EventBus 日志
  useEffect(() => {
    const types = ['timeline:viewChange', 'event:selected', 'dashboard:yearChange', 'territory:yearChange', 'relation:focusNode'];
    const unsubs = types.map(type =>
      eventBus.on(type, () => {
        setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${type} → 更新人物图鉴到 ${filterYear}年`]);
      }, 'person-gallery-log')
    );
    return () => unsubs.forEach(u => u());
  }, [filterYear]);

  // 选中人物 → 通知其他模块 + 跳转到关系图
  const handleSelectPerson = useCallback((person: Person) => {
    setSelectedPerson(prev => prev?.id === person.id ? null : person);
    eventBus.emit('relation:focusNode', person.id, 'person-gallery');
    // 如果人物有地点信息，通知地图
    const personEvents = getPersonEvents(person.id);
    if (personEvents.length > 0 && personEvents[0].location) {
      eventBus.emit('map:flyTo', personEvents[0].location.coordinate, 'person-gallery');
    }
  }, []);

  // 年份变化 → 通知其他模块
  const handleYearChange = useCallback((year: number) => {
    setFilterYear(year);
    eventBus.emit('dashboard:yearChange', year, 'person-gallery');
  }, []);

  // 关闭详情面板
  const handleCloseDetail = useCallback(() => {
    setSelectedPerson(null);
  }, []);

  // 选中人物的关系和事件
  const selectedRelations = useMemo(() => {
    if (!selectedPerson) return [];
    return getPersonRelations(selectedPerson.id);
  }, [selectedPerson]);

  const selectedEvents = useMemo(() => {
    if (!selectedPerson) return [];
    return getPersonEvents(selectedPerson.id);
  }, [selectedPerson]);

  return (
    <div className="person-gallery">
      {/* 头部 */}
      <div className="person-gallery__header">
        <h2 className="person-gallery__title">👤 人物图鉴</h2>
        <p className="person-gallery__subtitle">
          {filterYear}年 · 在世人物 {filteredPersons.length} 人 · 共收录 {persons.length} 位历史人物
        </p>
      </div>

      {/* 控制栏 */}
      <div className="person-gallery__controls">
        {/* 势力筛选 */}
        <div className="person-gallery__filter-row">
          <button
            className={`person-gallery__filter-btn ${filterFaction === 'all' ? 'person-gallery__filter-btn--active' : ''}`}
            onClick={() => setFilterFaction('all')}
          >
            全部 ({persons.filter(p => isPersonAlive(p, filterYear)).length})
          </button>
          {ALL_FACTIONS.map(f => {
            const fac = factions[f];
            if (!fac) return null;
            const count = factionCounts[f] || 0;
            if (count === 0) return null;
            return (
              <button
                key={f}
                className={`person-gallery__filter-btn ${filterFaction === f ? 'person-gallery__filter-btn--active' : ''}`}
                style={{
                  '--filter-color': fac.color,
                  '--filter-bg': fac.bgColor,
                } as React.CSSProperties}
                onClick={() => setFilterFaction(f)}
              >
                {fac.name} ({count})
              </button>
            );
          })}
        </div>

        {/* 搜索 + 年份 */}
        <div className="person-gallery__search-row">
          <input
            type="text"
            className="person-gallery__search-input"
            placeholder="搜索人物姓名、头衔..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="person-gallery__year-control">
            <span className="person-gallery__year-label">100</span>
            <input
              type="range"
              className="person-gallery__slider"
              min={100}
              max={300}
              value={filterYear}
              onChange={e => handleYearChange(Number(e.target.value))}
            />
            <span className="person-gallery__year-label">300</span>
            <span className="person-gallery__current-year">{filterYear}年</span>
          </div>
        </div>
      </div>

      {/* 人物卡片网格 */}
      <div className="person-gallery__grid">
        {filteredPersons.length === 0 ? (
          <div className="person-gallery__empty">
            <p>在 {filterYear}年 没有找到符合条件的在世人物</p>
          </div>
        ) : (
          Object.entries(groupedPersons).map(([factionId, group]) => {
            const fac = factions[factionId];
            return (
              <div key={factionId} className="person-gallery__group">
                <div
                  className="person-gallery__group-title"
                  style={{ '--group-color': fac?.color } as React.CSSProperties}
                >
                  {fac?.name || factionId}
                </div>
                <div className="person-gallery__cards">
                  {group.map(person => {
                    const isSelected = selectedPerson?.id === person.id;
                    const age = filterYear - (person.birthYear ?? 0);
                    const isDead = (person.deathYear ?? 300) < filterYear;
                    return (
                      <div
                        key={person.id}
                        className={`person-gallery__card ${isSelected ? 'person-gallery__card--selected' : ''} ${isDead ? 'person-gallery__card--deceased' : ''}`}
                        style={{
                          '--card-color': fac?.color,
                          '--card-bg': fac?.bgColor,
                        } as React.CSSProperties}
                        onClick={() => handleSelectPerson(person)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${person.name}，${fac?.name}，${person.title || ''}`}
                        onKeyDown={e => { if (e.key === 'Enter') handleSelectPerson(person); }}
                      >
                        <div className="person-gallery__card-avatar">
                          {person.name.charAt(0)}
                        </div>
                        <div className="person-gallery__card-info">
                          <div className="person-gallery__card-name">{person.name}</div>
                          <div className="person-gallery__card-title">{person.title || '—'}</div>
                          <div className="person-gallery__card-years">
                            {person.birthYear ?? '?'}—{person.deathYear ?? '?'}
                            {!isDead && <span className="person-gallery__card-age">· {age}岁</span>}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="person-gallery__card-check">✓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 人物详情面板 */}
      {selectedPerson && (
        <div className="person-gallery__detail-overlay" onClick={handleCloseDetail}>
          <div
            className="person-gallery__detail"
            onClick={e => e.stopPropagation()}
            style={{
              '--detail-color': factions[selectedPerson.faction]?.color,
              '--detail-bg': factions[selectedPerson.faction]?.bgColor,
            } as React.CSSProperties}
          >
            <button className="person-gallery__detail-close" onClick={handleCloseDetail}>✕</button>

            {/* 头部 */}
            <div className="person-gallery__detail-header">
              <div className="person-gallery__detail-avatar">
                {selectedPerson.name.charAt(0)}
              </div>
              <div className="person-gallery__detail-meta">
                <h3 className="person-gallery__detail-name">{selectedPerson.name}</h3>
                <div className="person-gallery__detail-title">{selectedPerson.title || ''}</div>
                <div className="person-gallery__detail-faction">{factions[selectedPerson.faction]?.name}</div>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="person-gallery__detail-info">
              <div className="person-gallery__detail-field">
                <span className="person-gallery__detail-label">生卒年</span>
                <span className="person-gallery__detail-value">
                  {selectedPerson.birthYear ?? '?'} — {selectedPerson.deathYear ?? '?'}
                  {selectedPerson.birthYear && selectedPerson.deathYear && (
                    <span className="person-gallery__detail-extra">
                      享年 {selectedPerson.deathYear - selectedPerson.birthYear} 岁
                    </span>
                  )}
                </span>
              </div>
              {selectedPerson.description && (
                <div className="person-gallery__detail-field">
                  <span className="person-gallery__detail-label">简介</span>
                  <span className="person-gallery__detail-value">{selectedPerson.description}</span>
                </div>
              )}
            </div>

            {/* 关系列表 */}
            {selectedRelations.length > 0 && (
              <div className="person-gallery__detail-section">
                <h4 className="person-gallery__detail-section-title">人物关系</h4>
                <div className="person-gallery__detail-relations">
                  {selectedRelations.map((rel, i) => {
                    const otherId = rel.source === selectedPerson.id ? rel.target : rel.source;
                    const otherPerson = persons.find(p => p.id === otherId);
                    // 检查是否为势力节点（f_wei, f_shu, f_wu）
                    const otherFaction = otherId.startsWith('f_')
                      ? factions[otherId.replace('f_', '')]
                      : otherPerson ? factions[otherPerson.faction] : null;
                    const otherName = otherPerson?.name
                      || (otherId.startsWith('f_') ? factions[otherId.replace('f_', '')]?.name : null)
                      || otherId;
                    const edgeTypeLabel: Record<string, string> = {
                      ally: '联盟', enemy: '敌对', family: '家族', subordinate: '从属', rival: '对手', other: '其他',
                    };
                    return (
                      <div key={i} className="person-gallery__detail-relation">
                        <span
                          className="person-gallery__relation-type"
                          style={{ '--rel-color': otherFaction?.color || '#999' } as React.CSSProperties}
                        >
                          {edgeTypeLabel[rel.type] || rel.type}
                        </span>
                        <span className="person-gallery__relation-label">{rel.label || ''}</span>
                        <span
                          className="person-gallery__relation-name"
                          style={{ color: otherFaction?.color }}
                        >
                          {otherName}
                        </span>
                        {rel.startYear && (
                          <span className="person-gallery__relation-years">
                            {rel.startYear}{rel.endYear ? `—${rel.endYear}` : '起'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 相关事件 */}
            {selectedEvents.length > 0 && (
              <div className="person-gallery__detail-section">
                <h4 className="person-gallery__detail-section-title">相关事件</h4>
                <div className="person-gallery__detail-events">
                  {selectedEvents.map(evt => (
                    <div
                      key={evt.id}
                      className="person-gallery__detail-event"
                      onClick={() => {
                        eventBus.emit('event:selected', evt, 'person-gallery');
                        if (evt.location) {
                          eventBus.emit('map:flyTo', evt.location.coordinate, 'person-gallery');
                        }
                        if (evt.mapAnimation) {
                          eventBus.emit('map:playAnimation', evt.mapAnimation, 'person-gallery');
                        }
                        navigateToModule('timeline', 'person-gallery');
                      }}
                    >
                      <span className="person-gallery__event-year">{evt.startYear}</span>
                      <span className="person-gallery__event-title">{evt.title}</span>
                      <span className="person-gallery__event-category">
                        {getCategoryLabel(evt.category)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EventBus 日志 */}
      {logs.length > 0 && (
        <div className="eventbus-log">
          <div className="eventbus-log__title">📡 EventBus 联动日志</div>
          {logs.map((log, i) => (
            <div key={i} className="eventbus-log__entry">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    military: '军事', political: '政治', person: '人物', diplomacy: '外交',
    rebellion: '起义', construction: '建设', other: '其他',
  };
  return map[cat] || cat;
}
