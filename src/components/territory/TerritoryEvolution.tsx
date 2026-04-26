// ============================================================
// TerritoryEvolution - 三国地图 · 疆域演变模块 v3
// 省份填色方案：基于真实省份边界，按势力填色
// 合并 MapDemo 功能：地点详情 Popup、行军路线动画、可折叠面板
// ============================================================

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap, Polyline, Popup } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { provinceFactionTimeline, getProvinceFactions, getFactionProvinceCount } from '../../data/provinceFactions';
import { territoryAreaTimeline } from '../../data/territories';
import { mapLocations, getLocationFaction } from '../../data/locations';
import { factions } from '../../data/factions';
import { events } from '../../data/events';
import { works, WORK_TYPE_LABELS, WORK_TYPE_COLORS } from '../../data/works';
import type { FactionId, GeoCoordinate, MapAnimationConfig, HistoricalEvent } from '../../types';

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

// 势力颜色映射 - 优化版
// 设计原则：
//   1. 省份填充：饱和度适中，半透明叠加
//   2. 地点圆点：白色描边，在任何底色上都清晰可见
//   3. 地点名字：按势力色 + 深色描边，既区分势力又保证可读性
//   4. 争夺中用品红（与所有势力色完全不同），东汉用亮黄（与橙色拉开差距）
const factionColorMap: Record<string, { color: string; fillOpacity: number; strokeColor: string }> = {
  wei:      { color: '#4A90D9', fillOpacity: 0.45,  strokeColor: '#6AAFE9' },
  shu:      { color: '#E85D5D', fillOpacity: 0.45,  strokeColor: '#FF7D7D' },
  wu:       { color: '#4ADE80', fillOpacity: 0.45,  strokeColor: '#6AFE9A' },
  han:      { color: '#FACC15', fillOpacity: 0.3,  strokeColor: '#FDE68A' },
  other:    { color: '#22D3EE', fillOpacity: 0.25, strokeColor: '#67E8F9' },
  war:      { color: '#C026D3', fillOpacity: 0.4,  strokeColor: '#E879F9' },
  neutral:  { color: '#444444', fillOpacity: 0.15, strokeColor: '#555555' },
};

// 图例数据
const LEGEND_ITEMS = [
  { key: 'wei', label: '曹魏', color: '#4A90D9' },
  { key: 'shu', label: '蜀汉', color: '#E85D5D' },
  { key: 'wu', label: '东吴', color: '#4ADE80' },
  { key: 'han', label: '东汉', color: '#FACC15' },
  { key: 'war', label: '争夺中', color: '#C026D3' },
  { key: 'other', label: '地方势力', color: '#22D3EE' },
  { key: 'neutral', label: '非核心区域', color: '#444444' },
];

// 地点类型配置
const typeIcons: Record<string, string> = {
  capital: '👑', city: '🏙️', battlefield: '⚔️', pass: '🏔️',
};

const typeNames: Record<string, string> = {
  capital: '都城', city: '城市', battlefield: '战场', pass: '关隘',
};

const importanceLabels: Record<string, string> = {
  critical: '关键', major: '重要', minor: '一般',
};

// ---- 地图飞行控制器 ----
const FlyToController: React.FC<{ target: GeoCoordinate | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 7, { duration: 1.5 });
  }, [target, map]);
  return null;
};

// ---- 地点 Popup 内容（暗色主题） ----
const LocationPopup: React.FC<{
  loc: typeof mapLocations[0];
  relatedEvents: HistoricalEvent[];
}> = ({ loc, relatedEvents }) => {
  const dynamicFaction = loc.faction || 'neutral';
  const color = factionColorMap[dynamicFaction]?.color || '#999';
  const factionName = loc.faction ? factions[loc.faction as keyof typeof factions]?.name : '';

  return (
    <div style={{
      fontFamily: '"Noto Sans SC", sans-serif',
      color: '#e8e0d0',
      minWidth: 200,
      maxHeight: 320,
      overflowY: 'auto',
      background: 'rgba(13, 17, 23, 0.95)',
      borderRadius: '8px',
      padding: '2px',
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
        <span>{loc.coordinate.lat.toFixed(2)}N, {loc.coordinate.lng.toFixed(2)}E</span>
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
            相关事件（{relatedEvents.length}）
          </div>
          {relatedEvents.slice(0, 5).map(evt => (
            <div
              key={evt.id}
              onClick={() => {
                eventBus.emit('event:selected', evt, 'territory-map');
                if (evt.mapAnimation) {
                  eventBus.emit('map:playAnimation', evt.mapAnimation, 'territory-map');
                }
              }}
              style={{
                fontSize: 11, padding: '4px 6px', marginBottom: 2,
                background: 'rgba(255,255,255,0.03)', borderRadius: 3,
                borderLeft: `3px solid ${factionColorMap[evt.factions[0]]?.color || '#666'}`,
                cursor: evt.mapAnimation ? 'pointer' : 'default',
              }}
            >
              <span style={{ color: '#c9a96e', marginRight: 4 }}>
                {evt.startYear === evt.endYear ? `${evt.startYear}` : `${evt.startYear}-${evt.endYear}`}
              </span>
              <span>{evt.title}</span>
              {evt.mapAnimation && <span style={{ marginLeft: 4, fontSize: 10, color: '#4A90D9' }}>▶</span>}
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
};

// ---- 叙事气泡组件（在地图上显示waypoint叙事） ----
const NarrativePopup: React.FC<{
  narrative: { name: string; narrative: string; position: [number, number]; color: string } | null;
}> = ({ narrative }) => {
  if (!narrative) return null;

  return (
    <Popup
      key={`${narrative.name}-${narrative.position[0]}-${narrative.position[1]}`}
      position={narrative.position}
      closeButton={false}
      autoClose={false}
      closeOnClick={false}
      className="narrative-popup"
      maxWidth={300}
      minWidth={220}
      autoPan={true}
      autoPanPaddingTopLeft={[10, 60]}
    >
      <div style={{
        fontFamily: '"Noto Sans SC", sans-serif',
        padding: '4px 2px',
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: narrative.color,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          borderBottom: `2px solid ${narrative.color}44`,
          paddingBottom: 6,
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: narrative.color,
            boxShadow: `0 0 6px ${narrative.color}`,
            animation: 'narrativePulse 1.5s ease-in-out infinite',
          }} />
          {narrative.name}
        </div>
        <div style={{
          fontSize: 13,
          color: '#e8e0d0',
          lineHeight: 1.8,
          letterSpacing: '0.3px',
        }}>
          {narrative.narrative}
        </div>
      </div>
    </Popup>
  );
};

// 内部组件：同步地图视图
const MapViewSync: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.setView([32, 112], 5);
  }, [map]);
  return null;
};

export const TerritoryEvolution: React.FC = () => {
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentYear, setCurrentYear] = useState(208);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 播放倍速：0.5, 1, 2, 4
  const [playWithAnimation, setPlayWithAnimation] = useState(false); // 是否在播放时同时播放事件动画
  const animRef = useRef<number>(0);
  const timelinePlayRef = useRef<number>(0); // 时间线播放定时器
  const yearAnimDoneRef = useRef(true); // 当前年份动画是否播放完毕
  const [logs, setLogs] = useState<string[]>([]);
  const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);

  // --- 新增状态：地点选中、行军动画、面板折叠 ---
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<GeoCoordinate | null>(null);
  const [animatedPaths, setAnimatedPaths] = useState<Array<{
    id: string;
    positions: [number, number][];
    color: string;
    label: string;
    progress: number;
    startTime: number;
    duration: number;
    delay: number;
    effect?: 'fire' | 'explosion' | 'arrow' | 'wave' | 'none';
    effectColor?: string;
    waypoints?: Array<{ index: number; name: string; narrative: string; dwellTime?: number; }>;
    totalDwellTime: number;
  }>>([]);
  const [activeNarrative, setActiveNarrative] = useState<{
    name: string;
    narrative: string;
    position: [number, number];
    color: string;
  } | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showAnimPanel, setShowAnimPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  // 三图层控制
  const [showTerritoryLayer, setShowTerritoryLayer] = useState(true);
  const [showEventLayer, setShowEventLayer] = useState(true);
  const [showWorksLayer, setShowWorksLayer] = useState(false);
  const marchAnimRef = useRef<number>(0);

  // 加载 GeoJSON
  useEffect(() => {
    fetch('/china_provinces.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  // 获取当前年份的省份势力映射
  const currentData = useMemo(() => {
    return getProvinceFactions(currentYear);
  }, [currentYear]);

  // 获取势力省份数量统计
  const factionCounts = useMemo(() => {
    return getFactionProvinceCount(currentYear);
  }, [currentYear]);

  // 获取地点相关事件
  const getLocationEvents = useCallback((locId: string) => {
    const loc = mapLocations.find(l => l.id === locId);
    if (!loc) return [];
    return events.filter(e =>
      e.location && Math.abs(e.location.coordinate.lat - loc.coordinate.lat) < 1.5
        && Math.abs(e.location.coordinate.lng - loc.coordinate.lng) < 1.5
    );
  }, []);

  // 选中地点信息
  const selectedLocEvents = selectedLocation ? getLocationEvents(selectedLocation) : [];
  const selectedLoc = selectedLocation ? mapLocations.find(l => l.id === selectedLocation) : null;

  // flyTo 3秒后清除
  useEffect(() => {
    if (!flyToTarget) return;
    const timer = setTimeout(() => setFlyToTarget(null), 3000);
    return () => clearTimeout(timer);
  }, [flyToTarget]);

  // 行军路线动画 - 支持多阶段延迟、持续时间、waypoint暂停
  useEffect(() => {
    if (animatedPaths.length === 0) return;
    let running = true;
    let prevProgressMap: Record<string, number> = {};
    let triggeredWaypoints: Record<string, Set<number>> = {}; // 已触发的waypoint追踪
    // 缓存每个 path 的排序后 waypoints
    const sortedWpsCache: Record<string, Array<{ index: number; name: string; narrative: string; dwellTime?: number }>> = {};
    for (const p of animatedPaths) {
      if (p.waypoints && p.waypoints.length > 0) {
        sortedWpsCache[p.id] = [...p.waypoints].sort((a, b) => a.index - b.index);
      }
    }

    const animate = () => {
      if (!running) return;
      const now = Date.now();
      let hasChange = false;
      let narrativeUpdate: { name: string; narrative: string; position: [number, number]; color: string } | null = null;

      setAnimatedPaths(prev => {
        if (prev.length === 0) return prev;

        const updated = prev.map(p => {
          const elapsed = now - p.startTime - p.delay;
          if (elapsed < 0) return p; // 还没开始，不更新

          // ---- 带 waypoint 暂停的进度计算 ----
          let effectiveProgress: number;
          if (p.waypoints && p.waypoints.length > 0 && p.totalDwellTime > 0) {
            const totalPoints = p.positions.length;
            const moveTime = p.duration - p.totalDwellTime;
            let remaining = elapsed;
            let moveElapsed = 0;
            let isPaused = false;

            const sortedWps = sortedWpsCache[p.id] || [...p.waypoints].sort((a, b) => a.index - b.index);

            for (const wp of sortedWps) {
              const wpThreshold = wp.index / Math.max(1, totalPoints - 1);
              const segmentMoveTime = wpThreshold * moveTime;
              const dwell = wp.dwellTime || 0;

              if (remaining <= segmentMoveTime) {
                moveElapsed += remaining;
                break;
              } else {
                moveElapsed += segmentMoveTime;
                remaining -= segmentMoveTime;

                if (remaining <= dwell) {
                  isPaused = true;
                  break;
                } else {
                  remaining -= dwell;
                }
              }
            }

            if (!isPaused) {
              moveElapsed += remaining;
            }

            effectiveProgress = Math.min(1, moveElapsed / Math.max(1, moveTime));

            // 检查 waypoint 触发
            const prevProg = prevProgressMap[p.id] || 0;
            if (!triggeredWaypoints[p.id]) triggeredWaypoints[p.id] = new Set();

            for (const wp of p.waypoints) {
              const wpThreshold = wp.index / Math.max(1, totalPoints - 1);
              if (prevProg < wpThreshold && effectiveProgress >= wpThreshold && !triggeredWaypoints[p.id].has(wp.index)) {
                triggeredWaypoints[p.id].add(wp.index);
                narrativeUpdate = {
                  name: wp.name,
                  narrative: wp.narrative,
                  position: p.positions[wp.index],
                  color: p.color,
                };
              }
            }

            prevProgressMap[p.id] = effectiveProgress;
            return { ...p, progress: effectiveProgress };
          } else {
            effectiveProgress = Math.min(1, elapsed / p.duration);
            prevProgressMap[p.id] = effectiveProgress;
            return { ...p, progress: effectiveProgress };
          }
        });

        // 检查是否有实际变化
        const filtered = updated.filter(p => p.progress < 1);
        if (filtered.length === 0 && prev.length > 0) {
          // 所有动画完成
          hasChange = true;
          return [];
        }

        // 只在有变化时更新
        const changed = updated.some((p, i) => p.progress !== prev[i]?.progress);
        if (changed) {
          hasChange = true;
          return filtered;
        }
        return prev; // 无变化，返回原引用避免重渲染
      });

      // 更新叙事气泡
      if (narrativeUpdate) {
        setTimeout(() => setActiveNarrative(narrativeUpdate), 0);
      }

      if (running) {
        marchAnimRef.current = requestAnimationFrame(animate);
      }
    };
    marchAnimRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(marchAnimRef.current); };
  }, [animatedPaths.length > 0]);

  // GeoJSON 样式函数
  const getFeatureStyle = useCallback((feature: any) => {
    const name = feature?.properties?.name;
    if (!name) return { fillColor: '#333', fillOpacity: 0.1, color: '#555', weight: 1 };

    const faction = currentData.provinces[name] || 'neutral';
    const fc = factionColorMap[faction] || factionColorMap.neutral;

    return {
      fillColor: fc.color,
      fillOpacity: fc.fillOpacity,
      color: fc.strokeColor,
      weight: 1.5,
      opacity: 0.8,
    };
  }, [currentData]);

  // 省份 Popup 内容 - 永久标签
  const onEachFeature = useCallback((feature: any, layer: any) => {
    const name = feature?.properties?.name || '未知';
    const faction = currentData.provinces[name] || 'neutral';
    const factionInfo = factions[faction as FactionId];
    const fc = factionColorMap[faction] || factionColorMap.neutral;

    let factionLabel = '';
    if (faction === 'war') {
      factionLabel = '争夺中';
    } else if (faction === 'neutral') {
      factionLabel = '';
    } else if (factionInfo) {
      factionLabel = factionInfo.name;
    } else {
      factionLabel = '地方势力';
    }

    // 只对核心势力/战争省份显示标签，neutral 不显示
    if (faction === 'neutral') return;

    layer.bindTooltip(
      `<div style="text-align:center;padding:1px 3px;line-height:1.3;">
        <div style="font-weight:600;font-size:11px;color:#ffffff;text-shadow:0 0 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.9), 1px -1px 2px rgba(0,0,0,0.9), -1px 1px 2px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.9);">${name.replace(/(省|市|自治区|壮族|回族|维吾尔|特别行政区)/g, '')}</div>
        ${factionLabel ? `<div style="font-size:9px;color:${fc.color};text-shadow:0 0 3px rgba(0,0,0,0.9);margin-top:1px;">${factionLabel}</div>` : ''}
      </div>`,
      { permanent: true, direction: 'center', className: 'province-label' }
    );
  }, [currentData]);

  // 绘制面积对比图表
  const drawChart = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 30, right: 20, bottom: 30, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('势力疆域面积变化（万km²）', padding.left, 18);

    const years = territoryAreaTimeline.map(r => r.year);
    const maxArea = 550;

    ctx.strokeStyle = 'rgba(201, 169, 110, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.3)';
    ctx.textAlign = 'right';
    for (let area = 0; area <= maxArea; area += 100) {
      const y = padding.top + chartH - (area / maxArea) * chartH;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      ctx.fillText(String(area), padding.left - 6, y + 3);
    }

    ctx.textAlign = 'center';
    years.forEach(year => {
      const x = padding.left + ((year - 184) / (280 - 184)) * chartW;
      ctx.fillText(String(year), x, h - 8);
    });

    const curX = padding.left + ((currentYear - 184) / (280 - 184)) * chartW;
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(curX, padding.top); ctx.lineTo(curX, padding.top + chartH); ctx.stroke();
    ctx.setLineDash([]);

    const factionKeys: FactionId[] = ['wei', 'shu', 'wu', 'han', 'other'];
    factionKeys.forEach(key => {
      const faction = factions[key];
      if (!faction) return;

      ctx.beginPath();
      ctx.strokeStyle = faction.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;

      territoryAreaTimeline.forEach((row, i) => {
        const x = padding.left + ((row.year - 184) / (280 - 184)) * chartW;
        const y = padding.top + chartH - ((row[key] || 0) / maxArea) * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      territoryAreaTimeline.forEach((row, i) => {
        const x = padding.left + ((row.year - 184) / (280 - 184)) * chartW;
        const y = padding.top + chartH - ((row[key] || 0) / maxArea) * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      const lastX = padding.left + ((years[years.length - 1] - 184) / (280 - 184)) * chartW;
      const firstX = padding.left + ((years[0] - 184) / (280 - 184)) * chartW;
      ctx.lineTo(lastX, padding.top + chartH);
      ctx.lineTo(firstX, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = faction.bgColor;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const legendX = padding.left + 10;
    const legendY = padding.top + 8;
    const activeFactions = ['wei', 'shu', 'wu', 'han', 'other'] as FactionId[];
    activeFactions.forEach((key, i) => {
      const faction = factions[key];
      if (!faction) return;
      const x = legendX + i * 60;
      ctx.fillStyle = faction.color;
      ctx.fillRect(x, legendY, 10, 10);
      ctx.font = '10px "Noto Sans SC", sans-serif';
      ctx.fillStyle = 'rgba(232, 224, 208, 0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(faction.name, x + 14, legendY + 9);
    });
  }, [currentYear]);

  // Canvas 图表动画循环
  useEffect(() => {
    const chartCanvas = chartCanvasRef.current;
    if (!chartCanvas) return;

    const chartCtx = chartCanvas.getContext('2d');
    if (!chartCtx) return;

    let running = true;
    const animate = () => {
      if (!running) return;

      const chartRect = chartCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      chartCanvas.width = chartRect.width * dpr;
      chartCanvas.height = chartRect.height * dpr;
      chartCtx.scale(dpr, dpr);
      drawChart(chartCtx, chartRect.width, chartRect.height);

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [drawChart, showChart]);

  // 自动播放（支持事件动画联动）
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(timelinePlayRef.current);
      return;
    }

    // 获取当前年份的可动画事件（只取起始年匹配的）
    const yearEvents = events.filter(e =>
      e.mapAnimation && e.startYear === currentYear
    );

    if (playWithAnimation && yearEvents.length > 0) {
      // 有动画事件：播放动画，等结束后进入下一年
      yearAnimDoneRef.current = false;
      const evt = yearEvents[0]; // 取第一个事件
      const paths = buildAnimPaths(evt.mapAnimation);
      setAnimatedPaths([]);

      setTimeout(() => {
        setAnimatedPaths(paths);
        // 计算动画总时长（含所有阶段延迟）
        const totalDuration = paths.reduce((max, p) => {
          return Math.max(max, (p.duration || 3000) + (p.delay || 0));
        }, 0);
        // 动画播放完毕后，等待一小段时间再进入下一年
        const waitTime = Math.round((totalDuration + 1500) / playSpeed);
        timelinePlayRef.current = window.setTimeout(() => {
          yearAnimDoneRef.current = true;
          setCurrentYear(prev => {
            if (prev >= 280) { setIsPlaying(false); setPlayWithAnimation(false); return 280; }
            return prev + 1;
          });
        }, waitTime);
      }, 100);
    } else {
      // 无动画事件：按速度间隔进入下一年
      const interval = Math.round(800 / playSpeed); // 无动画时稍慢一些，让用户看清领土变化
      timelinePlayRef.current = window.setTimeout(() => {
        setCurrentYear(prev => {
          if (prev >= 280) { setIsPlaying(false); setPlayWithAnimation(false); return 280; }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      clearTimeout(timelinePlayRef.current);
    };
  }, [isPlaying, currentYear, playWithAnimation, playSpeed, events]);

  // EventBus 联动 - 时间线同步
  useEffect(() => {
    const unsub = eventBus.on('timeline:viewChange', (payload) => {
      const state = payload as { centerYear: number };
      if (state.centerYear) {
        setCurrentYear(Math.round(Math.max(184, Math.min(280, state.centerYear))));
      }
    }, 'territory');
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('timeline:viewChange', () => {
      setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] timeline:viewChange → 更新疆域到 ${currentYear}年`]);
    }, 'territory-log');
    return () => unsub();
  }, [currentYear]);

  // EventBus 联动 - 地图飞行、动画、事件选中
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
      fire: '火攻', ambush: '伏击', converge: '集结',
    };

    // 将 MapAnimationConfig 转换为动画路径列表（支持多阶段）
    const buildAnimPaths = (anim: MapAnimationConfig): Array<{
      id: string;
      positions: [number, number][];
      color: string;
      label: string;
      progress: number;
      startTime: number;
      duration: number;
      delay: number;
      effect?: 'fire' | 'explosion' | 'arrow' | 'wave' | 'none';
      effectColor?: string;
      waypoints?: Array<{ index: number; name: string; narrative: string; dwellTime?: number; }>;
      totalDwellTime: number;
    }> => {
      const now = Date.now();
      // 多阶段动画
      if (anim.phases && anim.phases.length > 0) {
        let cumulativeDelay = 0;
        return anim.phases.map((phase, i) => {
          const phaseDelay = cumulativeDelay + (phase.delay || 0);
          // 计算 dwellTime 总和，加到 duration 中
          const totalDwell = (phase.waypoints || []).reduce((sum, wp) => sum + (wp.dwellTime || 0), 0);
          const effectiveDuration = (phase.duration || 3000) + totalDwell;
          cumulativeDelay = phaseDelay + effectiveDuration;
          return {
            id: `phase-${Date.now()}-${i}`,
            positions: phase.path.map(c => [c.lat, c.lng] as [number, number]),
            color: phase.color || anim.color || '#c9a96e',
            label: phase.label,
            progress: 0,
            startTime: now,
            duration: effectiveDuration,
            delay: phaseDelay,
            effect: phase.effect || 'none',
            effectColor: phase.effectColor,
            waypoints: phase.waypoints,
            totalDwellTime: totalDwell,
          };
        });
      }
      // 单阶段动画（兼容旧数据）
      return [{
        id: `anim-${Date.now()}`,
        positions: anim.path.map(c => [c.lat, c.lng] as [number, number]),
        color: anim.color || '#c9a96e',
        label: anim.label || typeLabels[anim.type] || anim.type,
        progress: 0,
        startTime: now,
        duration: anim.duration || 4000,
        delay: 0,
        waypoints: undefined,
        totalDwellTime: 0,
      }];
    };

    const unsubs = [
      eventBus.on('map:flyTo', (payload) => {
        const coord = payload as GeoCoordinate;
        setFlyToTarget(coord);
        const nearest = findNearest(coord);
        if (nearest.id) {
          setSelectedLocation(nearest.id);
          setShowLocationPanel(true);
        }
      }, 'territory-map'),

      eventBus.on('map:playAnimation', (payload) => {
        const anim = payload as MapAnimationConfig;
        const paths = buildAnimPaths(anim);
        setAnimatedPaths([]); // 先清除旧动画，避免重复叠加
        setTimeout(() => setAnimatedPaths(paths), 0);
      }, 'territory-map'),

      eventBus.on('map:clearAnimation', () => setAnimatedPaths([]), 'territory-map'),

      eventBus.on('event:selected', (payload) => {
        const evt = payload as HistoricalEvent | null;
        if (!evt) return;
        // 设置选中事件，显示事件详情
        setSelectedEvent(evt);
        setShowEventDetail(true);
        if (evt.location) {
          setFlyToTarget(evt.location.coordinate);
          const nearest = findNearest(evt.location.coordinate);
          if (nearest.id) {
            setSelectedLocation(nearest.id);
            setShowLocationPanel(true);
          }
        }
        // 自动播放地图动画
        if (evt.mapAnimation) {
          setAnimatedPaths([]);
          setTimeout(() => {
            const paths = buildAnimPaths(evt.mapAnimation);
            setAnimatedPaths(paths);
          }, 100);
        }
      }, 'territory-map'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = Number(e.target.value);
    setCurrentYear(newYear);
    eventBus.emit('territory:yearChange', newYear, 'territory');
  }, []);

  // 行军路线动画控制
  const playPresetAnimation = useCallback((eventId: string) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt?.mapAnimation) return;
    setAnimatedPaths([]); // 先清除旧动画，避免重复叠加
    setTimeout(() => {
      const paths = buildAnimPaths(evt.mapAnimation);
      setAnimatedPaths(paths);
    }, 0);
  }, []);

  const clearAnimations = useCallback(() => setAnimatedPaths([]), []);

  const handleGoToTimeline = useCallback((evt: HistoricalEvent) => {
    eventBus.emit('event:selected', evt, 'territory-map');
    navigateToModule('timeline', 'territory-map');
  }, []);

  const handleGoToBattle = useCallback((evt: HistoricalEvent) => {
    eventBus.emit('event:selected', evt, 'territory-map');
    navigateToModule('battle-sandbox', 'territory-map');
  }, []);

  // 可动画事件列表
  const animatableEvents = events.filter(e => e.mapAnimation);

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

  // 当前活跃势力列表
  const activeFactionList = Object.entries(factionCounts)
    .filter(([k, v]) => v > 0 && k !== 'neutral')
    .map(([k]) => {
      if (k === 'war') return '争夺中';
      return factions[k as FactionId]?.name || k;
    });

  // 点击地点时打开位置面板
  const handleLocationClick = useCallback((locId: string) => {
    setSelectedLocation(locId);
    setShowLocationPanel(true);
  }, []);

  return (
    <div className="territory-evolution">
      <div className="territory-evolution__header">
        <h2 className="territory-evolution__title">三国地图 · 疆域演变</h2>
        <p className="territory-evolution__subtitle">
          {selectedLoc
            ? `${selectedLoc.name}（${selectedLoc.description || ''}）· ${selectedLocEvents.length} 个相关事件`
            : `${currentData.label} · 当前势力：${activeFactionList.join('、')}`}
        </p>
      </div>

      {/* 主区域：Leaflet 地图 + Canvas 图表 */}
      <div className="territory-evolution__main" style={{
        display: 'flex',
        flex: 1,
        gap: 0,
        overflow: 'hidden',
      }}>
        <div className="territory-evolution__map" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {/* 事件详情浮动面板 */}
          {showEventDetail && selectedEvent && (
            <div style={{
              position: 'absolute',
              top: '48px',
              left: '12px',
              zIndex: 1000,
              background: 'rgba(13, 17, 23, 0.95)',
              borderRadius: '8px',
              padding: '10px 14px',
              border: '1px solid rgba(201, 169, 110, 0.3)',
              backdropFilter: 'blur(4px)',
              maxWidth: '320px',
              maxHeight: 'calc(100% - 80px)',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 700, color: '#e8e0d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {{ military: '⚔️', political: '🏛️', person: '👤', diplomacy: '🤝', rebellion: '🔥', construction: '🏗️', other: '📌' }[selectedEvent.category]}
                    </span>
                    {selectedEvent.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#888' }}>
                    <span style={{ color: '#c9a96e', fontWeight: 600 }}>
                      {selectedEvent.startYear === selectedEvent.endYear ? `${selectedEvent.startYear}年` : `${selectedEvent.startYear}-${selectedEvent.endYear}年`}
                    </span>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: selectedEvent.importance === 'critical' ? 'rgba(232,93,93,0.2)' : selectedEvent.importance === 'major' ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.05)',
                      color: selectedEvent.importance === 'critical' ? '#E85D5D' : selectedEvent.importance === 'major' ? '#c9a96e' : '#888',
                      fontSize: '9px',
                    }}>
                      {importanceLabels[selectedEvent.importance]}
                    </span>
                    {selectedEvent.location && (
                      <span>📍 {selectedEvent.location.name}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setShowEventDetail(false); setSelectedEvent(null); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: 'rgba(232,224,208,0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '1px 6px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* 关联势力 */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {selectedEvent.factions.map(fId => {
                  const f = factions[fId as keyof typeof factions];
                  if (!f) return null;
                  return (
                    <span key={fId} style={{
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: `${f.color}22`,
                      border: `1px solid ${f.color}44`,
                      color: f.color,
                      fontSize: '10px',
                      fontWeight: 600,
                    }}>
                      {f.name}
                    </span>
                  );
                })}
                {selectedEvent.persons.length > 0 && (
                  <span style={{ padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: '#bbb', fontSize: '10px' }}>
                    👤 {selectedEvent.persons.length}人
                  </span>
                )}
              </div>

              {/* 事件描述 */}
              <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#bbb', lineHeight: 1.6 }}>
                {selectedEvent.description}
              </p>

              {/* 详细描述 HTML */}
              {selectedEvent.detailHtml && (
                <div style={{
                  fontSize: '11px',
                  color: '#ccc',
                  lineHeight: 1.6,
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
                  dangerouslySetInnerHTML={{ __html: selectedEvent.detailHtml }}
                />
              )}

              {/* 信息来源 */}
              {selectedEvent.sources && selectedEvent.sources.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#c9a96e', marginBottom: '4px' }}>
                    📚 信息来源
                  </div>
                  {selectedEvent.sources.map((src, i) => (
                    <div key={i} style={{
                      padding: '3px 6px',
                      marginBottom: '2px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '3px',
                      borderLeft: `3px solid ${src.type === 'history' ? '#c9a96e' : src.type === 'fiction' ? '#C026D3' : '#666'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#e8e0d0' }}>{src.book}</span>
                        <span style={{ fontSize: '9px', color: '#888' }}>{src.chapter}</span>
                        {src.type && (
                          <span style={{
                            fontSize: '9px',
                            padding: '0 3px',
                            borderRadius: '2px',
                            background: src.type === 'history' ? 'rgba(201,169,110,0.15)' : src.type === 'fiction' ? 'rgba(192,38,211,0.15)' : 'rgba(255,255,255,0.05)',
                            color: src.type === 'history' ? '#c9a96e' : src.type === 'fiction' ? '#C026D3' : '#888',
                          }}>
                            {src.type === 'history' ? '正史' : src.type === 'fiction' ? '演义' : '其他'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic', lineHeight: 1.4 }}>
                        「{src.text}」
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 多阶段动画进度 */}
              {selectedEvent.mapAnimation?.phases && selectedEvent.mapAnimation.phases.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#c9a96e', marginBottom: '4px' }}>
                    🎬 动画阶段
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {selectedEvent.mapAnimation.phases.map((phase, i) => {
                      const matchingPath = animatedPaths.find(p => p.label === phase.label);
                      const progress = matchingPath ? matchingPath.progress : 0;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '2px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px',
                        }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: phase.color || '#c9a96e',
                            boxShadow: progress > 0 ? `0 0 4px ${phase.color || '#c9a96e'}` : 'none',
                          }} />
                          <span style={{ fontSize: '10px', color: '#e8e0d0', flex: 1 }}>{phase.label}</span>
                          <div style={{
                            width: '50px', height: '3px', borderRadius: '2px',
                            background: 'rgba(255,255,255,0.1)',
                          }}>
                            <div style={{
                              width: `${progress * 100}%`, height: '100%', borderRadius: '2px',
                              background: phase.color || '#c9a96e',
                              transition: 'width 0.1s',
                            }} />
                          </div>
                          <span style={{ fontSize: '9px', color: '#888', minWidth: '26px', textAlign: 'right' }}>
                            {Math.round(progress * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <MapContainer
            center={[32, 112]}
            zoom={5}
            minZoom={4}
            maxZoom={9}
            maxBounds={[[18, 92], [46, 128]]}
            maxBoundsViscosity={0.9}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            />

            {/* 现代行政边界层 */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              opacity={0.3}
            />

            <MapViewSync />
            <FlyToController target={flyToTarget} />
            <NarrativePopup narrative={activeNarrative} />

            {/* 省份填色层 */}
            {showTerritoryLayer && geoData && (
              <GeoJSON
                key={currentYear}
                data={geoData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}

            {/* 地点标记 - 白色描边圆点 + 势力色名字 + 点击 Popup */}
            {showEventLayer && mapLocations.map(loc => {
              const isCapital = loc.type === 'capital';
              const isBattlefield = loc.type === 'battlefield';
              const isPass = loc.type === 'pass';
              const radius = isCapital ? 7 : isBattlefield ? 5 : isPass ? 4 : 3;
              // 使用动态势力颜色（随年份变化）
              const dynamicFaction = getLocationFaction(loc.id, currentYear);
              const factionColor = factionColorMap[dynamicFaction]?.color || '#999';
              const isSelected = selectedLocation === loc.id;
              const locEvents = getLocationEvents(loc.id);

              return (
                <CircleMarker
                  key={loc.id}
                  center={[loc.coordinate.lat, loc.coordinate.lng]}
                  radius={isSelected ? radius + 3 : radius}
                  pathOptions={{
                    color: isSelected ? '#fff' : factionColor,
                    fillColor: '#ffffff',
                    fillOpacity: isSelected ? 1 : 0.95,
                    weight: isSelected ? 3 : isCapital ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => handleLocationClick(loc.id),
                  }}
                >
                  <Tooltip permanent direction="top" className="territory-evolution__capital-tooltip">
                    <span style={{
                      color: '#ffffff',
                      fontWeight: isCapital ? 700 : 600,
                      fontSize: isCapital ? '12px' : '10px',
                      textShadow: `0 0 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9), 1px -1px 2px rgba(0,0,0,0.9), -1px 1px 2px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.9)`,
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.6)',
                    }}>
                      {loc.name}
                    </span>
                    {/* 势力色小圆点标识 */}
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: factionColor,
                      marginLeft: '2px',
                      verticalAlign: 'middle',
                      boxShadow: `0 0 3px ${factionColor}`,
                    }} />
                  </Tooltip>

                  {/* 点击弹出详细信息 */}
                  <Popup maxWidth={280} minWidth={220}>
                    <LocationPopup loc={loc} relatedEvents={locEvents} />
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* 著作标记层 */}
            {showWorksLayer && works.filter(w => w.location).map(work => (
              <CircleMarker
                key={work.id}
                center={[work.location!.coordinate.lat, work.location!.coordinate.lng]}
                radius={8}
                pathOptions={{
                  color: WORK_TYPE_COLORS[work.type],
                  fillColor: WORK_TYPE_COLORS[work.type],
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="top" className="territory-evolution__capital-tooltip">
                  <span style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '11px',
                    textShadow: '0 0 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)',
                  }}>
                    📖 {work.title}
                  </span>
                </Tooltip>
                <Popup maxWidth={260} minWidth={200}>
                  <div style={{ color: '#e8e0d0', fontSize: '13px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8e0d0', marginBottom: '8px' }}>
                      《{work.title}》
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ color: WORK_TYPE_COLORS[work.type] }}>
                        {WORK_TYPE_LABELS[work.type]}
                      </span>
                      <span style={{ color: 'rgba(232,224,208,0.4)', margin: '0 6px' }}>·</span>
                      <span style={{ color: '#c9a96e' }}>{work.author}</span>
                      <span style={{ color: 'rgba(232,224,208,0.4)', margin: '0 6px' }}>·</span>
                      <span>{work.year < 0 ? `公元前${Math.abs(work.year)}` : work.year}年</span>
                    </div>
                    <p style={{ margin: '0 0 6px', lineHeight: 1.5, color: 'rgba(232,224,208,0.7)' }}>
                      {work.description}
                    </p>
                    <div style={{
                      background: 'rgba(201,169,110,0.08)',
                      borderLeft: `3px solid ${WORK_TYPE_COLORS[work.type]}`,
                      borderRadius: '0 4px 4px 0',
                      padding: '6px 10px',
                      fontSize: '12px',
                      color: 'rgba(232,224,208,0.5)',
                    }}>
                      ✦ {work.significance}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 行军路线动画 - 支持多阶段和特效 */}
            {showEventLayer && animPathSegments.map(segment => {
              if (!segment) return null;
              const showEffect = segment.effect && segment.effect !== 'none' && segment.progress > 0.3 && segment.progress < 0.95;
              return (
                <React.Fragment key={segment.id}>
                  {/* 已走路径 - 虚线 */}
                  <Polyline
                    positions={segment.visiblePositions}
                    pathOptions={{
                      color: segment.color,
                      weight: 3,
                      opacity: 0.8,
                      dashArray: '8, 6',
                    }}
                  />
                  {/* 未走路径 - 淡色虚线预览 */}
                  {segment.positions.length > 2 && (
                    <Polyline
                      positions={segment.positions}
                      pathOptions={{
                        color: segment.color,
                        weight: 1.5,
                        opacity: 0.15,
                        dashArray: '4, 8',
                      }}
                    />
                  )}
                  {/* 移动圆点 */}
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
                  {/* 火攻特效 - 在路径末端显示火焰圆圈 */}
                  {showEffect && segment.effect === 'fire' && (
                    <>
                      <CircleMarker
                        center={segment.curPos}
                        radius={12 + Math.sin(Date.now() / 200) * 4}
                        pathOptions={{
                          color: segment.effectColor || '#FF6B35',
                          weight: 2,
                          fillColor: segment.effectColor || '#FF6B35',
                          fillOpacity: 0.2 + Math.sin(Date.now() / 300) * 0.1,
                        }}
                      />
                      <CircleMarker
                        center={segment.curPos}
                        radius={6 + Math.sin(Date.now() / 150) * 2}
                        pathOptions={{
                          color: '#FFD700',
                          weight: 1,
                          fillColor: '#FFD700',
                          fillOpacity: 0.4,
                        }}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* 年份水印 */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '16px',
                zIndex: 1000,
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: '"Noto Serif SC", serif',
                color: 'rgba(201, 169, 110, 0.15)',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              {currentYear}年
            </div>

            {/* 颜色图例 */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                zIndex: 1000,
                background: 'rgba(13, 17, 23, 0.85)',
                borderRadius: '8px',
                padding: '10px 14px',
                border: '1px solid rgba(201, 169, 110, 0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(232,224,208,0.5)', marginBottom: '6px', fontWeight: 600 }}>
                图例说明
              </div>
              {LEGEND_ITEMS.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      backgroundColor: item.color,
                      border: item.key === 'war' ? '2px solid #FF6633' : '1px solid rgba(255,255,255,0.15)',
                      opacity: item.key === 'war' ? 1 : 0.8,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(232,224,208,0.7)', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </MapContainer>

          {/* 图表折叠按钮 */}
          <button
            onClick={() => setShowChart(!showChart)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(13, 17, 23, 0.85)',
              borderRadius: '8px',
              padding: '6px 10px',
              border: '1px solid rgba(201, 169, 110, 0.2)',
              backdropFilter: 'blur(4px)',
              color: 'rgba(232,224,208,0.8)',
              fontSize: '14px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            title={showChart ? '隐藏图表' : '显示图表'}
          >
            {showChart ? '📊' : '📊'}
          </button>

          {/* 行军路线动画控制按钮 */}
          <button
            onClick={() => setShowAnimPanel(!showAnimPanel)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '52px',
              zIndex: 1000,
              background: 'rgba(13, 17, 23, 0.85)',
              borderRadius: '8px',
              padding: '6px 10px',
              border: '1px solid rgba(201, 169, 110, 0.2)',
              backdropFilter: 'blur(4px)',
              color: 'rgba(232,224,208,0.8)',
              fontSize: '14px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            title="行军路线动画"
          >
            {showAnimPanel ? '⏹' : '▶'}
          </button>

          {/* 行军路线动画控制面板（可折叠） */}
          {showAnimPanel && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(13, 17, 23, 0.92)',
              borderRadius: '8px',
              padding: '10px 14px',
              border: '1px solid rgba(201, 169, 110, 0.2)',
              backdropFilter: 'blur(4px)',
              maxWidth: '240px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(232,224,208,0.5)', marginBottom: '6px', fontWeight: 600 }}>
                行军路线动画
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {animatableEvents.map(evt => {
                  const mainFaction = factions[evt.factions[0]];
                  return (
                    <button
                      key={evt.id}
                      onClick={() => playPresetAnimation(evt.id)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mainFaction?.color || '#c9a96e'}33`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: 'rgba(232,224,208,0.8)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>
                        {{ march: '🏃', battle: '⚔️', siege: '🏰', expansion: '📈', retreat: '🏃‍♂️' }[evt.mapAnimation!.type]}
                      </span>
                      <span>{evt.title}</span>
                    </button>
                  );
                })}
              </div>
              {animatedPaths.length > 0 && (
                <button
                  onClick={clearAnimations}
                  style={{
                    marginTop: '6px',
                    background: 'rgba(192, 38, 211, 0.15)',
                    border: '1px solid rgba(192, 38, 211, 0.3)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: 'rgba(232,224,208,0.8)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  清除所有动画
                </button>
              )}
            </div>
          )}
        </div>

        {/* 图表面板（可折叠） */}
        {showChart && (
          <div className="territory-evolution__chart" style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}>
            <canvas ref={chartCanvasRef} className="territory-evolution__chart-canvas" />
          </div>
        )}
      </div>

      {/* 选中地点信息面板（可折叠） */}
      {showLocationPanel && selectedLoc && (
        <div style={{
          background: 'rgba(13, 17, 23, 0.95)',
          borderRadius: '8px',
          padding: '12px 16px',
          border: '1px solid rgba(201, 169, 110, 0.2)',
          marginBottom: '8px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e8e0d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{typeIcons[selectedLoc.type]}</span>
              {selectedLoc.name}
              <span style={{
                fontSize: '13px',
                fontWeight: 400,
                color: selectedLoc.faction ? factionColorMap[selectedLoc.faction]?.color : '#999',
              }}>
                {selectedLoc.faction ? factions[selectedLoc.faction as keyof typeof factions]?.name : ''}
              </span>
            </h3>
            <button
              onClick={() => { setShowLocationPanel(false); setSelectedLocation(null); }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'rgba(232,224,208,0.6)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '2px 8px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          {selectedLoc.description && (
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#bbb', lineHeight: 1.6 }}>
              {selectedLoc.description}
            </p>
          )}
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
            {selectedLoc.coordinate.lat.toFixed(2)}N, {selectedLoc.coordinate.lng.toFixed(2)}E
          </div>
          {selectedLocEvents.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#c9a96e', marginBottom: '6px' }}>
                相关事件
              </div>
              {selectedLocEvents.map(evt => (
                <div key={evt.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${factionColorMap[evt.factions[0]]?.color || '#666'}`,
                }}>
                  <span style={{ color: '#c9a96e', fontSize: '12px', fontWeight: 600, minWidth: '32px' }}>
                    {evt.startYear}
                  </span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#e8e0d0' }}>{evt.title}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleGoToTimeline(evt)}
                      style={{
                        background: 'rgba(74, 144, 217, 0.15)',
                        border: '1px solid rgba(74, 144, 217, 0.3)',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        color: '#e8e0d0',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      时间线
                    </button>
                    {evt.mapAnimation && (
                      <button
                        onClick={() => handleGoToBattle(evt)}
                        style={{
                          background: 'rgba(192, 38, 211, 0.15)',
                          border: '1px solid rgba(192, 38, 211, 0.3)',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          color: '#e8e0d0',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        战役
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 时间滑块控制 */}
      <div className="territory-evolution__controls">
        <div className="territory-evolution__slider-row">
          <span className="territory-evolution__year-label">184</span>
          <input
            type="range"
            className="territory-evolution__slider"
            min={184}
            max={280}
            value={currentYear}
            onChange={handleSliderChange}
          />
          <span className="territory-evolution__year-label">280</span>
          <span className="territory-evolution__current-year">{currentYear}年</span>
        </div>
        {/* 图层切换 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
          {[
            { key: 'territory', label: '🗺️ 疆域', active: showTerritoryLayer, setter: setShowTerritoryLayer },
            { key: 'event', label: '⚔️ 事件', active: showEventLayer, setter: setShowEventLayer },
            { key: 'works', label: '📚 著作', active: showWorksLayer, setter: setShowWorksLayer },
          ].map(layer => (
            <button
              key={layer.key}
              onClick={() => layer.setter(!layer.active)}
              style={{
                background: layer.active ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${layer.active ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '6px',
                padding: '6px 16px',
                color: layer.active ? '#c9a96e' : 'rgba(232,224,208,0.4)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {layer.label}
            </button>
          ))}
        </div>
        <div className="territory-evolution__btn-row">
          <button
            className={`territory-evolution__btn ${isPlaying && !playWithAnimation ? 'territory-evolution__btn--active' : ''}`}
            onClick={() => { setIsPlaying(!isPlaying); setPlayWithAnimation(false); if (isPlaying) setAnimatedPaths([]); }}
          >
            {isPlaying && !playWithAnimation ? '⏸ 暂停' : '▶ 播放演变'}
          </button>
          <button
            className={`territory-evolution__btn ${isPlaying && playWithAnimation ? 'territory-evolution__btn--active' : ''}`}
            style={{ borderColor: isPlaying && playWithAnimation ? 'rgba(201,169,110,0.6)' : undefined }}
            onClick={() => {
              if (isPlaying && playWithAnimation) {
                setIsPlaying(false);
                setPlayWithAnimation(false);
                setAnimatedPaths([]);
              } else {
                setPlayWithAnimation(true);
                setIsPlaying(true);
                setCurrentYear(184);
              }
            }}
            title="逐年播放，遇到有动画的事件会自动播放地图动画"
          >
            {isPlaying && playWithAnimation ? '⏸ 暂停动画' : '🎬 播放时间线'}
          </button>
          <button className="territory-evolution__btn" onClick={() => { setCurrentYear(184); setIsPlaying(false); setPlayWithAnimation(false); setAnimatedPaths([]); }}>
            ⏮ 回到起点
          </button>
          <button className="territory-evolution__btn" onClick={() => { setCurrentYear(280); setIsPlaying(false); setPlayWithAnimation(false); setAnimatedPaths([]); }}>
            ⏭ 跳到终点
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', borderLeft: '1px solid rgba(201,169,110,0.2)', paddingLeft: '10px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(232,224,208,0.5)', marginRight: '2px' }}>速度</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                className={`territory-evolution__btn ${playSpeed === speed ? 'territory-evolution__btn--active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '11px', minWidth: '36px' }}
                onClick={() => setPlaySpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
          {provinceFactionTimeline.map(snap => (
            <button
              key={snap.year}
              className="territory-evolution__snap-btn"
              onClick={() => { setCurrentYear(snap.year); setIsPlaying(false); }}
            >
              {snap.year}
            </button>
          ))}
        </div>
      </div>

      {/* 势力统计卡片 */}
      <div className="territory-evolution__stats">
        {Object.entries(factionCounts).map(([key, count]) => {
          if (key === 'neutral') return null;
          const faction = factions[key as FactionId];
          const fc = factionColorMap[key] || factionColorMap.neutral;
          if (count === 0 && key !== 'wei') return null;

          let displayName = '';
          let displayValue = '';
          if (key === 'war') {
            displayName = '争夺中';
            displayValue = `${count}省`;
          } else if (faction) {
            displayName = faction.name;
            displayValue = `${count}省`;
          } else {
            displayName = '其他';
            displayValue = `${count}省`;
          }

          return (
            <div
              key={key}
              className="territory-evolution__stat-card"
              style={{ '--stat-color': fc.color, '--stat-bg': fc.color } as React.CSSProperties}
            >
              <div className="territory-evolution__stat-name">{displayName}</div>
              <div className="territory-evolution__stat-value">{displayValue}</div>
            </div>
          );
        })}
      </div>

      {/* EventBus 日志 */}
      {logs.length > 0 && (
        <div className="eventbus-log">
          <div className="eventbus-log__title">EventBus 事件日志</div>
          {logs.map((log, i) => (
            <div key={i} className="eventbus-log__entry">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};
