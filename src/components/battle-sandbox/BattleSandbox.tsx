// ============================================================
// BattleSandbox - 战役沙盘模块
// 战场地图 + 战役选择列表 + 行军/战役动画回放 + 参战势力/人物
// 通过 EventBus 与时间线/人物图鉴/地图模块双向联动
// ============================================================

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { eventBus } from '../../core/EventBus';
import { navigateToModule } from '../../core/navigation';
import { events } from '../../data/events';
import { mapLocations, mapBounds } from '../../data/locations';
import { persons } from '../../data/persons';
import { factions } from '../../data/factions';
import type { GeoCoordinate, HistoricalEvent, MapAnimationConfig } from '../../types';

/** 带动画配置的战役事件 */
interface BattleEvent extends HistoricalEvent {
  mapAnimation: NonNullable<MapAnimationConfig>;
}

/** 筛选出所有含地图动画的事件（主要是战役） */
const battleEvents: BattleEvent[] = events.filter(
  (e): e is BattleEvent => !!e.mapAnimation
);

/** 动画路径点 */
interface AnimPoint {
  x: number;
  y: number;
}

export const BattleSandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBattle, setSelectedBattle] = useState<BattleEvent | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 经纬度 -> 画布坐标
  const geoToCanvas = useCallback((coord: GeoCoordinate, w: number, h: number) => {
    const x = ((coord.lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * w;
    const y = ((mapBounds.latMax - coord.lat) / (mapBounds.latMax - mapBounds.latMin)) * h;
    return { x, y };
  }, []);

  // 获取战役参战人物
  const battlePersons = useMemo(() => {
    if (!selectedBattle) return [];
    return selectedBattle.persons
      .map(id => persons.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [selectedBattle]);

  // 获取战役参战势力
  const battleFactions = useMemo(() => {
    if (!selectedBattle) return [];
    return selectedBattle.factions
      .map(id => factions[id])
      .filter((f): f is NonNullable<typeof f> => !!f);
  }, [selectedBattle]);

  // ---- 绘制地图 ----
  const drawMap = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 背景
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // 网格
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.06)';
    ctx.lineWidth = 1;
    for (let lng = mapBounds.lngMin; lng <= mapBounds.lngMax; lng += 2) {
      const { x } = geoToCanvas({ lat: 0, lng }, w, h);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let lat = mapBounds.latMin; lat <= mapBounds.latMax; lat += 2) {
      const { y } = geoToCanvas({ lat, lng: 0 }, w, h);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 简化中国轮廓
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const outline: [number, number][] = [
      [42, 120], [40, 122], [38, 121], [36, 120], [35, 119],
      [33, 121], [31, 122], [29, 122], [27, 121], [25, 119],
      [23, 117], [22, 114], [21, 110], [22, 108], [21, 106],
      [22, 102], [25, 98], [28, 97], [30, 97], [32, 100],
      [34, 100], [36, 101], [38, 100], [40, 104], [42, 108],
      [44, 112], [45, 116], [44, 118], [42, 120],
    ];
    outline.forEach(([lat, lng], i) => {
      const { x, y } = geoToCanvas({ lat, lng }, w, h);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // 简化河流
    ctx.strokeStyle = 'rgba(74, 144, 217, 0.2)';
    ctx.lineWidth = 1.5;
    const rivers: [number, number][][] = [
      // 黄河
      [[36, 104], [36, 110], [35, 112], [34.8, 113.9], [35, 117], [37, 119]],
      // 长江
      [[30, 104], [30.3, 108], [30, 112], [29.7, 113.6], [30, 116], [31, 118.8], [32.1, 118.8]],
    ];
    rivers.forEach(river => {
      ctx.beginPath();
      river.forEach(([lat, lng], i) => {
        const { x, y } = geoToCanvas({ lat, lng }, w, h);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // 所有地点
    mapLocations.forEach(loc => {
      const { x, y } = geoToCanvas(loc.coordinate, w, h);
      const isBattlefield = loc.type === 'battlefield';
      const isHovered = hoveredLocation === loc.id;

      // 地点标记
      if (isBattlefield) {
        ctx.fillStyle = isHovered ? 'rgba(217, 74, 74, 0.4)' : 'rgba(217, 74, 74, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isHovered ? '#e8e0d0' : 'rgba(232, 224, 208, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, isBattlefield ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();

      // 地点名称
      if (isBattlefield || isHovered) {
        ctx.font = `${isHovered ? '12' : '10'}px "Noto Sans SC", sans-serif`;
        ctx.fillStyle = isHovered ? '#e8e0d0' : 'rgba(232, 224, 208, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name, x, y - 10);
      }
    });

    // 所有战役位置标记（未选中的战役用小标记）
    battleEvents.forEach(evt => {
      if (evt.id === selectedBattle?.id) return;
      if (!evt.location) return;
      const { x, y } = geoToCanvas(evt.location.coordinate, w, h);

      ctx.strokeStyle = evt.mapAnimation.color || '#999';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      // 小剑形标记
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 3, y + 2);
      ctx.lineTo(x - 3, y + 2);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // 选中战役的动画路径
    if (selectedBattle?.mapAnimation) {
      const anim = selectedBattle.mapAnimation;
      const pathPoints = anim.path.map(coord => geoToCanvas(coord, w, h));
      const color = anim.color || '#c9a96e';

      // 完整路径（虚线）
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      pathPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 动画进度路径
      if (animProgress > 0 && pathPoints.length >= 2) {
        const totalLen = getPathLength(pathPoints);
        const currentLen = totalLen * Math.min(animProgress, 1);
        const drawPoints = getPointsAlongPath(pathPoints, currentLen);

        // 发光路径
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        drawPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 主路径
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        drawPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // 箭头头部
        if (drawPoints.length >= 2) {
          const last = drawPoints[drawPoints.length - 1];
          const prev = drawPoints[drawPoints.length - 2];
          const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
          const arrowSize = 10;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(last.x - arrowSize * Math.cos(angle - 0.4), last.y - arrowSize * Math.sin(angle - 0.4));
          ctx.lineTo(last.x - arrowSize * Math.cos(angle + 0.4), last.y - arrowSize * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fill();

          // 移动光点
          ctx.fillStyle = '#fff';
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // 起点标记
        const start = pathPoints[0];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 战役位置高亮
      if (selectedBattle.location) {
        const { x, y } = geoToCanvas(selectedBattle.location.coordinate, w, h);

        // 脉冲光环
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 12 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 中心点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // 战役名称
        ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
        ctx.fillStyle = '#e8e0d0';
        ctx.textAlign = 'center';
        ctx.fillText(selectedBattle.title, x, y - 18);

        // 地点名称
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.fillStyle = 'rgba(232, 224, 208, 0.5)';
        ctx.fillText(selectedBattle.location.name, x, y + 22);
      }
    }
  }, [geoToCanvas, selectedBattle, animProgress, hoveredLocation]);

  // ---- 动画循环 ----
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(animate); return; }
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMap(ctx, rect.width, rect.height);
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [drawMap]);

  // ---- 播放动画 ----
  useEffect(() => {
    if (!isPlaying || !selectedBattle) return;
    const duration = selectedBattle.mapAnimation.duration || 3000;
    startTimeRef.current = Date.now();
    setAnimProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, selectedBattle]);

  // 选择战役
  const handleSelectBattle = useCallback((battle: BattleEvent) => {
    setSelectedBattle(prev => prev?.id === battle.id ? null : battle);
    setAnimProgress(0);
    setIsPlaying(false);
    // 通知其他模块
    eventBus.emit('event:selected', battle, 'battle-sandbox');
    if (battle.location) {
      eventBus.emit('map:flyTo', battle.location.coordinate, 'battle-sandbox');
    }
  }, []);

  // 播放/暂停
  const handlePlay = useCallback(() => {
    if (!selectedBattle) return;
    if (animProgress >= 1) setAnimProgress(0);
    setIsPlaying(prev => !prev);
  }, [selectedBattle, animProgress]);

  // 重置
  const handleReset = useCallback(() => {
    setAnimProgress(0);
    setIsPlaying(false);
  }, []);

  // ---- EventBus 双向联动 ----
  useEffect(() => {
    const unsubs = [
      eventBus.on('event:selected', (payload) => {
        const evt = payload as HistoricalEvent | null;
        if (evt && evt.mapAnimation) {
          const battle = battleEvents.find(b => b.id === evt.id);
          if (battle) {
            setSelectedBattle(battle);
            setAnimProgress(0);
            setIsPlaying(false);
          }
        }
      }, 'battle-sandbox'),
      eventBus.on('map:flyTo', (payload) => {
        const coord = payload as GeoCoordinate;
        // 查找最近的战役
        let closest: BattleEvent | null = null;
        let minDist = Infinity;
        battleEvents.forEach(b => {
          if (!b.location) return;
          const dx = b.location.coordinate.lng - coord.lng;
          const dy = b.location.coordinate.lat - coord.lat;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) { minDist = dist; closest = b; }
        });
        if (closest && minDist < 25) {
          setSelectedBattle(closest);
          setAnimProgress(0);
        }
      }, 'battle-sandbox'),
      eventBus.on('map:playAnimation', (payload) => {
        const anim = payload as MapAnimationConfig;
        // 查找匹配的战役
        const battle = battleEvents.find(b =>
          b.mapAnimation.type === anim.type &&
          b.mapAnimation.path.length === anim.path.length &&
          b.mapAnimation.color === anim.color
        );
        if (battle) {
          setSelectedBattle(battle);
          setAnimProgress(0);
          setIsPlaying(true);
        }
      }, 'battle-sandbox'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // EventBus 日志
  useEffect(() => {
    const types = ['event:selected', 'map:flyTo', 'map:playAnimation'];
    const unsubs = types.map(type =>
      eventBus.on(type, () => {
        setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${type} → 战役沙盘更新`]);
      }, 'battle-sandbox-log')
    );
    return () => unsubs.forEach(u => u());
  }, []);

  // 鼠标悬停检测
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: string | null = null;
    mapLocations.forEach(loc => {
      const { x, y } = geoToCanvas(loc.coordinate, rect.width, rect.height);
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < 12) found = loc.id;
    });
    setHoveredLocation(found);
  }, [geoToCanvas]);

  // 点击地图上的战役标记
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    battleEvents.forEach(battle => {
      if (!battle.location) return;
      const { x, y } = geoToCanvas(battle.location.coordinate, rect.width, rect.height);
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < 15) handleSelectBattle(battle);
    });
  }, [geoToCanvas, handleSelectBattle]);

  const animTypeLabel: Record<string, string> = {
    march: '行军', battle: '战役', siege: '攻城', expansion: '扩张', retreat: '撤退',
  };

  return (
    <div className="battle-sandbox">
      <div className="battle-sandbox__header">
        <h2 className="battle-sandbox__title">⚔️ 战役沙盘</h2>
        <p className="battle-sandbox__subtitle">
          {selectedBattle
            ? `${selectedBattle.title}（${selectedBattle.startYear}年）· ${animTypeLabel[selectedBattle.mapAnimation.type] || '军事'}行动`
            : `共 ${battleEvents.length} 场战役可回放 · 点击战役或地图标记查看详情`}
        </p>
      </div>

      <div className="battle-sandbox__layout">
        {/* 左侧：战役列表 */}
        <div className="battle-sandbox__sidebar">
          <div className="battle-sandbox__list-title">战役列表</div>
          <div className="battle-sandbox__list">
            {battleEvents.map(battle => {
              const isSelected = selectedBattle?.id === battle.id;
              return (
                <div
                  key={battle.id}
                  className={`battle-sandbox__item ${isSelected ? 'battle-sandbox__item--active' : ''}`}
                  style={{
                    '--item-color': battle.mapAnimation.color || '#c9a96e',
                  } as React.CSSProperties}
                  onClick={() => handleSelectBattle(battle)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${battle.title}，${battle.startYear}年`}
                  onKeyDown={e => { if (e.key === 'Enter') handleSelectBattle(battle); }}
                >
                  <div className="battle-sandbox__item-dot" />
                  <div className="battle-sandbox__item-info">
                    <div className="battle-sandbox__item-name">{battle.title}</div>
                    <div className="battle-sandbox__item-meta">
                      <span>{battle.startYear}年</span>
                      <span>{animTypeLabel[battle.mapAnimation.type] || '军事'}</span>
                      <span>{battle.factions.map(f => factions[f]?.name).filter(Boolean).join(' vs ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：地图 + 控制 */}
        <div className="battle-sandbox__main">
          <div className="battle-sandbox__map-container">
            <canvas
              ref={canvasRef}
              className="battle-sandbox__canvas"
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
            />
          </div>

          {/* 播放控制 */}
          <div className="battle-sandbox__controls">
            <button
              className="battle-sandbox__ctrl-btn"
              onClick={handlePlay}
              disabled={!selectedBattle}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              className="battle-sandbox__ctrl-btn"
              onClick={handleReset}
              disabled={!selectedBattle}
            >
              ↺ 重置
            </button>
            {selectedBattle && (
              <div className="battle-sandbox__progress">
                <div className="battle-sandbox__progress-bar">
                  <div
                    className="battle-sandbox__progress-fill"
                    style={{
                      width: `${animProgress * 100}%`,
                      '--progress-color': selectedBattle.mapAnimation.color || '#c9a96e',
                    } as React.CSSProperties}
                  />
                </div>
                <span className="battle-sandbox__progress-text">
                  {Math.round(animProgress * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* 战役详情 */}
          {selectedBattle && (
            <div className="battle-sandbox__detail">
              <div className="battle-sandbox__detail-header">
                <h3 className="battle-sandbox__detail-title">{selectedBattle.title}</h3>
                <span className="battle-sandbox__detail-year">{selectedBattle.startYear}年</span>
              </div>
              <p className="battle-sandbox__detail-desc">{selectedBattle.description}</p>

              {/* 参战势力 */}
              {battleFactions.length > 0 && (
                <div className="battle-sandbox__factions">
                  <span className="battle-sandbox__section-label">参战势力</span>
                  <div className="battle-sandbox__faction-tags">
                    {battleFactions.map(f => (
                      <span
                        key={f.id}
                        className="battle-sandbox__faction-tag"
                        style={{ '--tag-color': f.color, '--tag-bg': f.bgColor } as React.CSSProperties}
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 参战人物 */}
              {battlePersons.length > 0 && (
                <div className="battle-sandbox__persons">
                  <span className="battle-sandbox__section-label">参战人物</span>
                  <div className="battle-sandbox__person-tags">
                    {battlePersons.map(p => {
                      const f = factions[p.faction];
                      return (
                        <span
                          key={p.id}
                          className="battle-sandbox__person-tag"
                          style={{ color: f?.color }}
                          onClick={() => {
                            eventBus.emit('relation:focusNode', p.id, 'battle-sandbox');
                            navigateToModule('person-gallery', 'battle-sandbox');
                          }}
                        >
                          {p.name}
                          {p.title && <small> · {p.title}</small>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 动画信息 */}
              <div className="battle-sandbox__anim-info">
                <span className="battle-sandbox__section-label">行动类型</span>
                <span className="battle-sandbox__anim-type" style={{ color: selectedBattle.mapAnimation.color }}>
                  {animTypeLabel[selectedBattle.mapAnimation.type] || selectedBattle.mapAnimation.type}
                </span>
                <span className="battle-sandbox__anim-meta">
                  路径点 {selectedBattle.mapAnimation.path.length} 个 · 时长 {(selectedBattle.mapAnimation.duration || 3000) / 1000}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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

// ---- 工具函数 ----

/** 计算路径总长度 */
function getPathLength(points: AnimPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

/** 沿路径获取指定长度内的所有点 */
function getPointsAlongPath(points: AnimPoint[], targetLen: number): AnimPoint[] {
  const result: AnimPoint[] = [points[0]];
  let accumulated = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (accumulated + segLen <= targetLen) {
      result.push(points[i]);
      accumulated += segLen;
    } else {
      const remaining = targetLen - accumulated;
      const t = segLen > 0 ? remaining / segLen : 0;
      result.push({
        x: points[i - 1].x + dx * t,
        y: points[i - 1].y + dy * t,
      });
      break;
    }
  }
  return result;
}
