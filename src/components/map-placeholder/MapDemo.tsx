// ============================================================
// MapDemo - 三国地图（Leaflet 版）
// 无标签底图 + 中文地点标签 + 丰富信息 Popup + 现代vs古代边界
// ============================================================

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoCoordinate, MapAnimationConfig, HistoricalEvent } from '../../types';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { mapLocations } from '../../data/locations';
import { events } from '../../data/events';
import { factions } from '../../data/factions';

// 修复 Leaflet 默认图标问题
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MAP_CENTER: [number, number] = [32, 112];
const MAP_ZOOM = 5;

const factionColors: Record<string, string> = {
  wei: '#4A90D9',
  shu: '#D94A4A',
  wu: '#4AD97A',
  han: '#D9A84A',
  other: '#999999',
};

const locationTypeConfig = {
  capital: { radius: 8, weight: 3, fillOpacity: 0.9 },
  city: { radius: 5, weight: 2, fillOpacity: 0.7 },
  battlefield: { radius: 6, weight: 2, fillOpacity: 0.8 },
  pass: { radius: 5, weight: 2, fillOpacity: 0.7 },
};

const typeIcons: Record<string, string> = {
  capital: '👑', city: '🏙️', battlefield: '⚔️', pass: '🏔️',
};

const typeNames: Record<string, string> = {
  capital: '都城', city: '城市', battlefield: '战场', pass: '关隘',
};

const importanceLabels: Record<string, string> = {
  critical: '🔴 关键', major: '🟠 重要', minor: '⚪ 一般',
};

// ---- 地图飞行控制器 ----
function FlyToController({ target }: { target: GeoCoordinate | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 7, { duration: 1.5 });
  }, [target, map]);
  return null;
}

// ---- 地点 Popup 内容 ----
function LocationPopup({ loc, relatedEvents }: {
  loc: typeof mapLocations[0];
  relatedEvents: HistoricalEvent[];
}) {
  const color = loc.faction ? (factionColors[loc.faction] || '#999') : '#999';
  const factionName = loc.faction ? factions[loc.faction as keyof typeof factions]?.name : '';

  return (
    <div style={{
      fontFamily: '"Noto Sans SC", sans-serif',
      color: '#e8e0d0',
      minWidth: 200,
      maxHeight: 320,
      overflowY: 'auto',
    }}>
      {/* 标题 */}
      <div style={{
        fontSize: 16, fontWeight: 700, marginBottom: 6,
        borderBottom: `2px solid ${color}`, paddingBottom: 6,
      }}>
        {typeIcons[loc.type]} {loc.name}
      </div>

      {/* 基本信息 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: '#888' }}>类型</span>
        <span>{typeNames[loc.type]}</span>
        <span style={{ color: '#888' }}>势力</span>
        <span style={{ color }}>{factionName || '无'}</span>
        <span style={{ color: '#888' }}>坐标</span>
        <span>{loc.coordinate.lat.toFixed(2)}°N, {loc.coordinate.lng.toFixed(2)}°E</span>
      </div>

      {/* 描述 */}
      {loc.description && (
        <div style={{
          fontSize: 12, color: '#bbb', lineHeight: 1.6,
          padding: '6px 8px', background: 'rgba(255,255,255,0.05)',
          borderRadius: 4, marginBottom: 8,
        }}>
          {loc.description}
        </div>
      )}

      {/* 相关事件 */}
      {relatedEvents.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#c9a96e', marginBottom: 4 }}>
            📜 相关事件（{relatedEvents.length}）
          </div>
          {relatedEvents.slice(0, 5).map(evt => (
            <div key={evt.id} style={{
              fontSize: 11, padding: '4px 6px', marginBottom: 2,
              background: 'rgba(255,255,255,0.03)', borderRadius: 3,
              borderLeft: `3px solid ${factionColors[evt.factions[0]] || '#666'}`,
            }}>
              <span style={{ color: '#c9a96e', marginRight: 4 }}>
                {evt.startYear === evt.endYear ? `${evt.startYear}` : `${evt.startYear}-${evt.endYear}`}
              </span>
              <span>{evt.title}</span>
              <span style={{ marginLeft: 4, fontSize: 10, color: '#888' }}>
                {importanceLabels[evt.importance]}
              </span>
            </div>
          ))}
          {relatedEvents.length > 5 && (
            <div style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4 }}>
              还有 {relatedEvents.length - 5} 个事件...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- 主组件 ----
export const MapDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<GeoCoordinate | null>(null);
  const [animatedPaths, setAnimatedPaths] = useState<Array<{
    id: string;
    positions: [number, number][];
    color: string;
    label: string;
    progress: number;
  }>>([]);
  const animRef = useRef<number>(0);

  // 获取地点相关事件
  const getLocationEvents = useCallback((locId: string) => {
    const loc = mapLocations.find(l => l.id === locId);
    if (!loc) return [];
    return events.filter(e =>
      e.location && Math.abs(e.location.coordinate.lat - loc.coordinate.lat) < 1.5
        && Math.abs(e.location.coordinate.lng - loc.coordinate.lng) < 1.5
    );
  }, []);

  // flyTo 3秒后清除
  useEffect(() => {
    if (!flyToTarget) return;
    const timer = setTimeout(() => setFlyToTarget(null), 3000);
    return () => clearTimeout(timer);
  }, [flyToTarget]);

  // 行军路线动画
  useEffect(() => {
    if (animatedPaths.length === 0) return;
    let running = true;
    const animate = () => {
      if (!running) return;
      setAnimatedPaths(prev =>
        prev.map(p => ({ ...p, progress: Math.min(1, p.progress + 0.008) }))
          .filter(p => p.progress < 1)
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [animatedPaths.length > 0]);

  // ---- EventBus 监听 ----
  useEffect(() => {
    const findNearest = (coord: GeoCoordinate) => {
      return mapLocations.reduce((best, loc) => {
        const dx = loc.coordinate.lng - coord.lng;
        const dy = loc.coordinate.lat - coord.lat;
        const dist = dx * dx + dy * dy;
        return dist < best.dist ? { id: loc.id, dist } : best;
      }, { id: '', dist: Infinity });
    };

    const typeLabels: Record<string, string> = {
      march: '行军', battle: '战役', siege: '攻城', expansion: '扩张', retreat: '撤退',
    };

    const unsubs = [
      eventBus.on('map:flyTo', (payload) => {
        const coord = payload as GeoCoordinate;
        setFlyToTarget(coord);
        const nearest = findNearest(coord);
        if (nearest.id) setSelectedLocation(nearest.id);
      }, 'map-module'),

      eventBus.on('map:playAnimation', (payload) => {
        const anim = payload as MapAnimationConfig;
        setAnimatedPaths(prev => [...prev, {
          id: `anim-${Date.now()}`,
          positions: anim.path.map(c => [c.lat, c.lng]),
          color: anim.color || '#c9a96e',
          label: typeLabels[anim.type] || anim.type,
          progress: 0,
        }]);
      }, 'map-module'),

      eventBus.on('map:clearAnimation', () => setAnimatedPaths([]), 'map-module'),

      eventBus.on('event:selected', (payload) => {
        const evt = payload as HistoricalEvent | null;
        if (!evt) return;
        if (evt.location) {
          setFlyToTarget(evt.location.coordinate);
          const nearest = findNearest(evt.location.coordinate);
          if (nearest.id) setSelectedLocation(nearest.id);
        }
        if (evt.mapAnimation) {
          setAnimatedPaths(prev => [...prev, {
            id: `anim-${Date.now()}`,
            positions: evt.mapAnimation!.path.map(c => [c.lat, c.lng]),
            color: evt.mapAnimation!.color || '#c9a96e',
            label: typeLabels[evt.mapAnimation!.type] || evt.mapAnimation!.type,
            progress: 0,
          }]);
        }
      }, 'map-module'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const playPresetAnimation = useCallback((eventId: string) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt?.mapAnimation) return;
    eventBus.emit('map:playAnimation', evt.mapAnimation, 'map-module');
  }, []);

  const clearAnimations = useCallback(() => setAnimatedPaths([]), []);

  const handleGoToTimeline = useCallback((evt: HistoricalEvent) => {
    eventBus.emit('event:selected', evt, 'map-module');
    navigateToModule('timeline', 'map-module');
  }, []);

  const handleGoToBattle = useCallback((evt: HistoricalEvent) => {
    eventBus.emit('event:selected', evt, 'map-module');
    navigateToModule('battle-sandbox', 'map-module');
  }, []);

  const animatableEvents = events.filter(e => e.mapAnimation);
  const selectedLocEvents = selectedLocation ? getLocationEvents(selectedLocation) : [];
  const selectedLoc = selectedLocation ? mapLocations.find(l => l.id === selectedLocation) : null;

  // 动画路径的当前显示点
  const animPathSegments = useMemo(() => {
    return animatedPaths.map(path => {
      const total = path.positions.length;
      if (total < 2) return null;
      const currentIdx = Math.min(Math.floor(path.progress * (total - 1)), total - 2);
      const frac = (path.progress * (total - 1)) - currentIdx;
      const from = path.positions[currentIdx];
      const to = path.positions[currentIdx + 1];
      return {
        ...path,
        visiblePositions: path.positions.slice(0, currentIdx + 2),
        curPos: [
          from[0] + (to[0] - from[0]) * frac,
          from[1] + (to[1] - from[1]) * frac,
        ] as [number, number],
      };
    }).filter(Boolean);
  }, [animatedPaths]);

  return (
    <div className="map-demo">
      <div className="map-demo__header">
        <h2 className="map-demo__title">🗺️ 三国地图</h2>
        <p className="map-demo__subtitle">
          {selectedLoc
            ? `${selectedLoc.name}（${selectedLoc.description || ''}）· ${selectedLocEvents.length} 个相关事件`
            : '点击地点查看详情 · 播放行军路线动画 · 滚轮缩放'}
        </p>
      </div>

      <div className="map-demo__main">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="map-demo__leaflet"
          zoomControl={true}
          attributionControl={false}
          minZoom={4}
          maxZoom={12}
        >
          <FlyToController target={flyToTarget} />

          {/* 暗色底图 - 无文字标签版本，去掉英文地名 */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />

          {/* 现代行政边界层 - 统一淡色线条 */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.25}
          />

          {/* 地点标记 - 带中文永久标签 */}
          {mapLocations.map(loc => {
            const config = locationTypeConfig[loc.type];
            const color = loc.faction ? (factionColors[loc.faction] || '#999') : '#999';
            const isSelected = selectedLocation === loc.id;
            const locEvents = getLocationEvents(loc.id);
            const showLabel = loc.type === 'capital' || loc.type === 'battlefield' || loc.type === 'pass';

            return (
              <CircleMarker
                key={loc.id}
                center={[loc.coordinate.lat, loc.coordinate.lng]}
                radius={isSelected ? config.radius + 3 : config.radius}
                pathOptions={{
                  color: isSelected ? '#fff' : color,
                  weight: isSelected ? 3 : config.weight,
                  fillColor: color,
                  fillOpacity: isSelected ? 1 : config.fillOpacity,
                }}
                eventHandlers={{
                  click: () => setSelectedLocation(loc.id),
                }}
              >
                {/* 中文永久标签（都城/战场/关隘始终显示） */}
                {showLabel && (
                  <Tooltip permanent direction="top" offset={[0, -8]}>
                    <span style={{
                      color,
                      fontWeight: loc.type === 'capital' ? 700 : 600,
                      fontSize: loc.type === 'capital' ? 13 : 11,
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      whiteSpace: 'nowrap',
                    }}>
                      {loc.name}
                    </span>
                  </Tooltip>
                )}

                {/* 点击弹出详细信息 */}
                <Popup maxWidth={280} minWidth={220}>
                  <LocationPopup loc={loc} relatedEvents={locEvents} />
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 行军路线动画 */}
          {animPathSegments.map(segment => {
            if (!segment) return null;
            return (
              <React.Fragment key={segment.id}>
                <Polyline
                  positions={segment.visiblePositions}
                  pathOptions={{
                    color: segment.color,
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '8, 6',
                  }}
                />
                <CircleMarker
                  center={segment.curPos}
                  radius={5}
                  pathOptions={{
                    color: segment.color,
                    weight: 2,
                    fillColor: '#fff',
                    fillOpacity: 1,
                  }}
                >
                  <Tooltip permanent direction="right" offset={[8, 0]}>
                    <span style={{ color: segment.color, fontWeight: 600, fontSize: 11 }}>
                      {segment.label}
                    </span>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* 选中地点信息面板 */}
      {selectedLoc && (
        <div className="map-demo__location-panel">
          <div className="map-demo__location-header">
            <h3 className="map-demo__location-name">
              <span style={{ marginRight: 6 }}>{typeIcons[selectedLoc.type]}</span>
              {selectedLoc.name}
            </h3>
            <span className="map-demo__location-faction" style={{
              color: selectedLoc.faction ? factionColors[selectedLoc.faction] : '#999',
            }}>
              {selectedLoc.faction ? factions[selectedLoc.faction as keyof typeof factions]?.name : ''}
            </span>
            <button className="map-demo__location-close" onClick={() => setSelectedLocation(null)}>✕</button>
          </div>
          {selectedLoc.description && (
            <p className="map-demo__location-desc">{selectedLoc.description}</p>
          )}
          <div className="map-demo__location-coord">
            {selectedLoc.coordinate.lat.toFixed(2)}°N, {selectedLoc.coordinate.lng.toFixed(2)}°E
          </div>
          {selectedLocEvents.length > 0 && (
            <div className="map-demo__location-events">
              <span className="map-demo__section-label">相关事件</span>
              {selectedLocEvents.map(evt => (
                <div key={evt.id} className="map-demo__event-item">
                  <span className="map-demo__event-year">{evt.startYear}</span>
                  <span className="map-demo__event-title">{evt.title}</span>
                  <div className="map-demo__event-actions">
                    <button className="map-demo__action-btn" onClick={() => handleGoToTimeline(evt)}>
                      📜 时间线
                    </button>
                    {evt.mapAnimation && (
                      <button className="map-demo__action-btn" onClick={() => handleGoToBattle(evt)}>
                        ⚔️ 战役
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 动画控制面板 */}
      <div className="map-demo__controls">
        <div className="map-demo__controls-title">行军路线动画</div>
        <div className="map-demo__controls-list">
          {animatableEvents.map(evt => {
            const mainFaction = factions[evt.factions[0]];
            return (
              <button
                key={evt.id}
                className="map-demo__anim-btn"
                style={{ '--btn-color': mainFaction?.color || '#c9a96e' } as React.CSSProperties}
                onClick={() => playPresetAnimation(evt.id)}
              >
                <span className="map-demo__anim-btn-icon">
                  {{ march: '🏃', battle: '⚔️', siege: '🏰', expansion: '📈', retreat: '🏃‍♂️' }[evt.mapAnimation!.type]}
                </span>
                <span>{evt.title}</span>
              </button>
            );
          })}
        </div>
        {animatedPaths.length > 0 && (
          <button className="map-demo__clear-btn" onClick={clearAnimations}>
            清除所有动画
          </button>
        )}
      </div>

      {/* 图例 - 增加边界类型说明 */}
      <div className="map-demo__legend">
        <div className="map-demo__legend-group">
          <span className="map-demo__legend-label">势力</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot" style={{ background: '#4A90D9' }} /> 曹魏</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot" style={{ background: '#D94A4A' }} /> 蜀汉</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot" style={{ background: '#4AD97A' }} /> 东吴</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot" style={{ background: '#D9A84A' }} /> 东汉</span>
        </div>
        <div className="map-demo__legend-group">
          <span className="map-demo__legend-label">地点</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot map-demo__legend-dot--capital" /> 都城</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot map-demo__legend-dot--battlefield" /> 战场</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot map-demo__legend-dot--pass" /> 关隘</span>
          <span className="map-demo__legend-item"><span className="map-demo__legend-dot" style={{ background: '#999' }} /> 城市</span>
        </div>
        <div className="map-demo__legend-group">
          <span className="map-demo__legend-label">边界</span>
          <span className="map-demo__legend-item">
            <span className="map-demo__legend-line" style={{ borderColor: 'rgba(201, 169, 110, 0.3)', borderStyle: 'solid' }} /> 现代行政
          </span>
          <span className="map-demo__legend-item">
            <span className="map-demo__legend-line" style={{ borderColor: '#c9a96e', borderStyle: 'dashed' }} /> 三国疆域
          </span>
        </div>
      </div>

      {/* EventBus 日志 */}
      <EventBusLog />
    </div>
  );
};

function EventBusLog() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const types = ['map:flyTo', 'map:playAnimation', 'map:clearAnimation', 'event:selected'];
    const unsubs = types.map(type =>
      eventBus.on(type, () => {
        setLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${type} → 地图响应`]);
      }, 'map-event-log')
    );
    return () => unsubs.forEach(u => u());
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="eventbus-log">
      <div className="eventbus-log__title">📡 EventBus 联动日志</div>
      {logs.map((log, i) => (
        <div key={i} className="eventbus-log__entry">{log}</div>
      ))}
    </div>
  );
}
