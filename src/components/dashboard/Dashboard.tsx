// ============================================================
// Dashboard - 数据统计仪表盘
// 4 个图表面板：事件分类、势力兵力、人口趋势、疆域面积
// 消费所有模块数据，通过 EventBus 双向联动
// ============================================================

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { eventBus } from '../../core/EventBus';
import { factions } from '../../data/factions';
import {
  getEventStatsByYear,
  getPersonStatsByYear,
  getAreaStatsByYear,
  getPopulationByYear,
  getMilitaryByYear,
  populationEstimates,
  territoryAreaTimeline,
} from '../../data/statistics';
import type { FactionId, EventCategory } from '../../types';

const FACTION_KEYS: FactionId[] = ['wei', 'shu', 'wu', 'han', 'other'];
const CATEGORY_KEYS: EventCategory[] = ['military', 'political', 'person', 'diplomacy', 'rebellion', 'construction', 'other'];
const CATEGORY_LABELS: Record<EventCategory, string> = {
  military: '军事', political: '政治', person: '人物', diplomacy: '外交', rebellion: '起义', construction: '建设', other: '其他',
};

export const Dashboard: React.FC = () => {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [currentYear, setCurrentYear] = useState(220);
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 统计数据
  const stats = useMemo(() => ({
    events: getEventStatsByYear(currentYear),
    persons: getPersonStatsByYear(currentYear),
    area: getAreaStatsByYear(currentYear),
    population: getPopulationByYear(currentYear),
    military: getMilitaryByYear(currentYear),
  }), [currentYear]);

  // ---- 绘图工具 ----
  const setupCanvas = useCallback((key: string, w: number, h: number): CanvasRenderingContext2D | null => {
    const canvas = canvasRefs.current[key];
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    return ctx;
  }, []);

  const drawTitle = useCallback((ctx: CanvasRenderingContext2D, text: string, x: number, y: number) => {
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
  }, []);

  const drawLegend = useCallback((ctx: CanvasRenderingContext2D, items: { label: string; color: string }[], x: number, y: number) => {
    items.forEach((item, i) => {
      const ix = x + i * 55;
      ctx.fillStyle = item.color;
      ctx.fillRect(ix, y, 8, 8);
      ctx.font = '10px "Noto Sans SC", sans-serif';
      ctx.fillStyle = 'rgba(232, 224, 208, 0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, ix + 12, y + 8);
    });
  }, []);

  // ---- 图表 1：事件分类饼图 ----
  const drawEventPie = useCallback((w: number, h: number) => {
    const ctx = setupCanvas('event-pie', w, h);
    if (!ctx) return;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    drawTitle(ctx, `事件分类统计 · ${currentYear}年 · 共${stats.events.total}个`, 12, 18);

    const cx = w * 0.35, cy = h * 0.55, r = Math.min(w * 0.25, h * 0.32);
    const data = CATEGORY_KEYS.map(k => ({ key: k, value: stats.events.byCategory[k] || 0, color: getCategoryColor(k) })).filter(d => d.value > 0);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    let angle = -Math.PI / 2;
    data.forEach(d => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;

      // 标签
      const mid = angle + slice / 2;
      const lx = cx + Math.cos(mid) * (r * 0.65);
      const ly = cy + Math.sin(mid) * (r * 0.65);
      if (slice > 0.3) {
        ctx.font = '11px "Noto Sans SC", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${CATEGORY_LABELS[d.key]} ${d.value}`, lx, ly);
      }
      angle += slice;
    });

    // 右侧列表
    const listX = w * 0.65;
    data.forEach((d, i) => {
      const ly = 40 + i * 24;
      ctx.fillStyle = d.color;
      ctx.fillRect(listX, ly, 10, 10);
      ctx.font = '12px "Noto Sans SC", sans-serif';
      ctx.fillStyle = 'rgba(232, 224, 208, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(`${CATEGORY_LABELS[d.key]}`, listX + 16, ly + 9);
      ctx.fillStyle = 'rgba(232, 224, 208, 0.4)';
      ctx.textAlign = 'right';
      ctx.fillText(`${d.value}个 (${((d.value / total) * 100).toFixed(0)}%)`, w - 12, ly + 9);
    });
  }, [setupCanvas, drawTitle, stats.events, currentYear]);

  // ---- 图表 2：势力兵力柱状图 ----
  const drawMilitaryBar = useCallback((w: number, h: number) => {
    const ctx = setupCanvas('military-bar', w, h);
    if (!ctx) return;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    drawTitle(ctx, `势力兵力对比 · ${currentYear}年（万人）`, 12, 18);

    const pad = { top: 35, bottom: 30, left: 50, right: 20 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const activeFactions = FACTION_KEYS.filter(k => (stats.military as Record<string, number>)[k] > 0);
    const maxVal = Math.max(...activeFactions.map(k => (stats.military as Record<string, number>)[k] || 0), 10);
    const barW = Math.min(50, (chartW / activeFactions.length) * 0.6);
    const gap = (chartW - barW * activeFactions.length) / (activeFactions.length + 1);

    // Y 轴
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.3)';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxVal; v += Math.ceil(maxVal / 5)) {
      const y = pad.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillText(String(v), pad.left - 6, y + 3);
    }

    // 柱子
    activeFactions.forEach((key, i) => {
      const f = factions[key];
      if (!f) return;
      const val = (stats.military as Record<string, number>)[key] || 0;
      const x = pad.left + gap + i * (barW + gap);
      const barH = (val / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      // 渐变柱
      const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      grad.addColorStop(0, f.color);
      grad.addColorStop(1, f.bgColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // 数值
      ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
      ctx.fillStyle = f.color;
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + barW / 2, y - 6);

      // 标签
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = 'rgba(232, 224, 208, 0.6)';
      ctx.fillText(f.name, x + barW / 2, pad.top + chartH + 16);
    });
  }, [setupCanvas, drawTitle, stats.military, currentYear]);

  // ---- 图表 3：人口趋势折线图 ----
  const drawPopulationLine = useCallback((w: number, h: number) => {
    const ctx = setupCanvas('population-line', w, h);
    if (!ctx) return;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    drawTitle(ctx, '势力人口趋势（万口）', 12, 18);
    drawLegend(ctx, FACTION_KEYS.filter(k => k !== 'other').map(k => ({ label: factions[k]?.name || k, color: factions[k]?.color || '#999' })), 12, 34);

    const pad = { top: 50, bottom: 30, left: 50, right: 20 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const maxPop = 5500;

    // Y 轴
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.3)';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxPop; v += 1000) {
      const y = pad.top + chartH - (v / maxPop) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillText(String(v), pad.left - 6, y + 3);
    }

    // X 轴
    ctx.textAlign = 'center';
    populationEstimates.forEach(row => {
      const x = pad.left + ((row.year - 184) / (280 - 184)) * chartW;
      ctx.fillText(String(row.year), x, h - 8);
    });

    // 当前年份线
    const curX = pad.left + ((currentYear - 184) / (280 - 184)) * chartW;
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(curX, pad.top); ctx.lineTo(curX, pad.top + chartH); ctx.stroke();
    ctx.setLineDash([]);

    // 折线
    FACTION_KEYS.filter(k => k !== 'other').forEach(key => {
      const f = factions[key];
      if (!f) return;
      ctx.beginPath();
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      populationEstimates.forEach((row, i) => {
        const x = pad.left + ((row.year - 184) / (280 - 184)) * chartW;
        const y = pad.top + chartH - ((row as Record<string, number>)[key] || 0) / maxPop * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [setupCanvas, drawTitle, drawLegend, currentYear]);

  // ---- 图表 4：疆域面积堆叠面积图 ----
  const drawAreaStack = useCallback((w: number, h: number) => {
    const ctx = setupCanvas('area-stack', w, h);
    if (!ctx) return;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    drawTitle(ctx, '势力疆域面积变化（万km²）', 12, 18);
    drawLegend(ctx, FACTION_KEYS.filter(k => k !== 'other').map(k => ({ label: factions[k]?.name || k, color: factions[k]?.color || '#999' })), 12, 34);

    const pad = { top: 50, bottom: 30, left: 50, right: 20 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const maxArea = 550;

    // Y 轴
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(232, 224, 208, 0.3)';
    ctx.textAlign = 'right';
    for (let v = 0; v <= maxArea; v += 100) {
      const y = pad.top + chartH - (v / maxArea) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillText(String(v), pad.left - 6, y + 3);
    }

    // X 轴
    ctx.textAlign = 'center';
    territoryAreaTimeline.forEach(row => {
      const x = pad.left + ((row.year - 184) / (280 - 184)) * chartW;
      ctx.fillText(String(row.year), x, h - 8);
    });

    // 当前年份线
    const curX = pad.left + ((currentYear - 184) / (280 - 184)) * chartW;
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(curX, pad.top); ctx.lineTo(curX, pad.top + chartH); ctx.stroke();
    ctx.setLineDash([]);

    // 堆叠面积
    const order: FactionId[] = ['other', 'wu', 'shu', 'han', 'wei'];
    order.forEach(key => {
      const f = factions[key];
      if (!f) return;
      ctx.beginPath();
      territoryAreaTimeline.forEach((row, i) => {
        const x = pad.left + ((row.year - 184) / (280 - 184)) * chartW;
        const y = pad.top + chartH - ((row as Record<string, number>)[key] || 0) / maxArea * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      const lastX = pad.left + ((territoryAreaTimeline[territoryAreaTimeline.length - 1].year - 184) / (280 - 184)) * chartW;
      const firstX = pad.left + ((territoryAreaTimeline[0].year - 184) / (280 - 184)) * chartW;
      ctx.lineTo(lastX, pad.top + chartH);
      ctx.lineTo(firstX, pad.top + chartH);
      ctx.closePath();
      ctx.fillStyle = f.bgColor;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [setupCanvas, drawTitle, drawLegend, currentYear]);

  // ---- 动画循环（仅在数据变化时重绘） ----
  useEffect(() => {
    // 延迟一帧确保 DOM 布局完成
    const timer = setTimeout(() => {
      const containers = document.querySelectorAll<HTMLElement>('.dashboard-chart');
      containers.forEach(el => {
        const rect = el.getBoundingClientRect();
        const key = el.dataset.chart;
        if (rect.width === 0 || rect.height === 0) return;
        if (key === 'event-pie') drawEventPie(rect.width, rect.height);
        else if (key === 'military-bar') drawMilitaryBar(rect.width, rect.height);
        else if (key === 'population-line') drawPopulationLine(rect.width, rect.height);
        else if (key === 'area-stack') drawAreaStack(rect.width, rect.height);
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [drawEventPie, drawMilitaryBar, drawPopulationLine, drawAreaStack]);

  // ---- EventBus 双向联动 ----
  useEffect(() => {
    const unsubs = [
      eventBus.on('timeline:viewChange', (payload) => {
        const state = payload as { centerYear: number };
        if (state.centerYear) {
          const year = Math.round(Math.max(184, Math.min(280, state.centerYear)));
          setCurrentYear(year);
        }
      }, 'dashboard'),
      eventBus.on('event:selected', (payload) => {
        const evt = payload as { startYear: number } | null;
        if (evt?.startYear) setCurrentYear(evt.startYear);
      }, 'dashboard'),
      eventBus.on('territory:yearChange', (payload) => {
        const year = payload as number;
        setCurrentYear(Math.round(Math.max(184, Math.min(280, year))));
      }, 'dashboard'),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // EventBus 日志
  useEffect(() => {
    const types = ['timeline:viewChange', 'event:selected', 'territory:yearChange'];
    const unsubs = types.map(type =>
      eventBus.on(type, () => {
        setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${type} → 更新仪表盘到 ${currentYear}年`]);
      }, 'dashboard-log')
    );
    return () => unsubs.forEach(u => u());
  }, [currentYear]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const year = Number(e.target.value);
    setCurrentYear(year);
    eventBus.emit('dashboard:yearChange', year, 'dashboard');
  }, []);

  const handlePanelClick = useCallback((panel: string) => {
    setSelectedPanel(prev => prev === panel ? null : panel);
    // 联动其他模块
    if (panel === 'area') {
      eventBus.emit('territory:yearChange', currentYear, 'dashboard');
    }
  }, [currentYear]);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__title">📊 数据统计仪表盘</h2>
        <p className="dashboard__subtitle">
          {currentYear}年 · 活跃人物 {stats.persons.total} 人 · 记录事件 {stats.events.total} 个 ·
          总人口 {(stats.population.wei + stats.population.shu + stats.population.wu + stats.population.han + stats.population.other)} 万口
        </p>
      </div>

      {/* 图表网格 */}
      <div className="dashboard__grid">
        <div
          className={`dashboard__chart dashboard-chart ${selectedPanel === 'event' ? 'dashboard__chart--active' : ''}`}
          data-chart="event-pie"
          onClick={() => handlePanelClick('event')}
        >
          <canvas ref={el => { canvasRefs.current['event-pie'] = el; }} />
          <div className="dashboard__chart-badge">事件分类</div>
        </div>
        <div
          className={`dashboard__chart dashboard-chart ${selectedPanel === 'military' ? 'dashboard__chart--active' : ''}`}
          data-chart="military-bar"
          onClick={() => handlePanelClick('military')}
        >
          <canvas ref={el => { canvasRefs.current['military-bar'] = el; }} />
          <div className="dashboard__chart-badge">兵力对比</div>
        </div>
        <div
          className={`dashboard__chart dashboard-chart ${selectedPanel === 'population' ? 'dashboard__chart--active' : ''}`}
          data-chart="population-line"
          onClick={() => handlePanelClick('population')}
        >
          <canvas ref={el => { canvasRefs.current['population-line'] = el; }} />
          <div className="dashboard__chart-badge">人口趋势</div>
        </div>
        <div
          className={`dashboard__chart dashboard-chart ${selectedPanel === 'area' ? 'dashboard__chart--active' : ''}`}
          data-chart="area-stack"
          onClick={() => handlePanelClick('area')}
        >
          <canvas ref={el => { canvasRefs.current['area-stack'] = el; }} />
          <div className="dashboard__chart-badge">疆域面积</div>
        </div>
      </div>

      {/* 年份控制 */}
      <div className="dashboard__controls">
        <div className="dashboard__slider-row">
          <span className="dashboard__year-label">184</span>
          <input
            type="range"
            className="dashboard__slider"
            min={184}
            max={280}
            value={currentYear}
            onChange={handleSliderChange}
          />
          <span className="dashboard__year-label">280</span>
          <span className="dashboard__current-year">{currentYear}年</span>
        </div>
      </div>

      {/* 底部统计卡片 */}
      <div className="dashboard__stats">
        {FACTION_KEYS.filter(k => k !== 'other').map(key => {
          const f = factions[key];
          const pop = (stats.population as Record<string, number>)[key] || 0;
          const mil = (stats.military as Record<string, number>)[key] || 0;
          const area = (stats.area as Record<string, number>)[key] || 0;
          if (pop === 0 && mil === 0 && area === 0) return null;
          return (
            <div
              key={key}
              className="dashboard__stat-card"
              style={{ '--stat-color': f?.color, '--stat-bg': f?.bgColor } as React.CSSProperties}
            >
              <div className="dashboard__stat-name">{f?.name}</div>
              <div className="dashboard__stat-rows">
                <div className="dashboard__stat-row">
                  <span className="dashboard__stat-label">人口</span>
                  <span className="dashboard__stat-value">{pop}<small>万</small></span>
                </div>
                <div className="dashboard__stat-row">
                  <span className="dashboard__stat-label">兵力</span>
                  <span className="dashboard__stat-value">{mil}<small>万</small></span>
                </div>
                <div className="dashboard__stat-row">
                  <span className="dashboard__stat-label">面积</span>
                  <span className="dashboard__stat-value">{area}<small>万km²</small></span>
                </div>
              </div>
            </div>
          );
        })}
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

function getCategoryColor(cat: EventCategory): string {
  const map: Record<EventCategory, string> = {
    military: '#D94A4A', political: '#4A90D9', person: '#D9A84A',
    diplomacy: '#4AD97A', rebellion: '#FF6B35', construction: '#9B59B6', other: '#999',
  };
  return map[cat] || '#999';
}
