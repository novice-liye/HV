// ============================================================
// 三国势力疆域演变数据 v2
// 设计原则：
//   1. 底层铺满：background 永远覆盖中国全境，消除空隙
//   2. 势力叠加：每个势力用简单多边形（8顶点），半透明叠加
//   3. 统一顶点：所有势力固定 8 顶点，插值稳定
//   4. 坐标系：[经度, 纬度]，Leaflet 显示时交换为 [lat, lng]
// ============================================================

import type { FactionId } from '../types';

export interface TerritorySnapshot {
  year: number;
  label: string;
  territories: TerritoryShape[];
}

export interface TerritoryShape {
  faction: FactionId | 'background';
  polygon: [number, number][];
  areaEstimate: number;
}

export interface InterpolatedSnapshot {
  year: number;
  label: string;
  territories: TerritoryShape[];
}

// ============================================================
// 背景多边形：覆盖中国核心区域（永远存在，消除空隙）
// ============================================================
const BACKGROUND_POLY: [number, number][] = [
  [97, 42], [123, 42], [123, 22], [97, 22],
  [97, 42], [97, 42], [97, 42], [97, 42],
];

// ============================================================
// 关键帧疆域数据
// 每个势力 8 顶点，简单凸/凹多边形，不自交叉
// ============================================================
export const territorySnapshots: TerritorySnapshot[] = [
  // ---- 184年：黄巾起义 ----
  {
    year: 184, label: '中平元年 · 黄巾起义',
    territories: [
      { faction: 'han', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [97, 42], [97, 42], [97, 42],
      ], areaEstimate: 700 },
    ],
  },

  // ---- 190年：群雄割据 ----
  {
    year: 190, label: '初平元年 · 群雄割据',
    territories: [
      { faction: 'han', polygon: [
        [107, 36], [113, 36], [115, 33], [114, 31], [111, 31], [107, 32], [105, 34], [107, 36],
      ], areaEstimate: 80 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [107, 36], [105, 34], [104, 42],
      ], areaEstimate: 620 },
    ],
  },

  // ---- 196年：曹操迎天子 ----
  {
    year: 196, label: '建安元年 · 曹操迎天子',
    territories: [
      { faction: 'han', polygon: [
        [107, 35], [112, 35], [113, 33], [112, 31], [109, 31], [107, 32], [106, 33], [107, 35],
      ], areaEstimate: 30 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [107, 35], [106, 33], [104, 42],
      ], areaEstimate: 670 },
    ],
  },

  // ---- 200年：官渡之战 ----
  {
    year: 200, label: '建安五年 · 官渡之战',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 34], [118, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 180 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [104, 36], [106, 33], [104, 42],
      ], areaEstimate: 520 },
    ],
  },

  // ---- 207年：曹操统一北方 ----
  {
    year: 207, label: '建安十二年 · 曹操统一北方',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 300 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [104, 36], [106, 33], [104, 42],
      ], areaEstimate: 400 },
    ],
  },

  // ---- 208年：赤壁之战 ----
  {
    year: 208, label: '建安十三年 · 赤壁之战',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 28], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 50 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [112, 31], [112, 31],
      ], areaEstimate: 90 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [99, 34], [99, 28], [104, 42],
      ], areaEstimate: 270 },
    ],
  },

  // ---- 214年：刘备取益州 ----
  {
    year: 214, label: '建安十九年 · 刘备取益州',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 25], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 120 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [112, 31], [112, 31],
      ], areaEstimate: 90 },
      { faction: 'other', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [99, 34], [99, 25], [104, 42],
      ], areaEstimate: 200 },
    ],
  },

  // ---- 219年：关羽失荆州 ----
  {
    year: 219, label: '建安二十四年 · 关羽失荆州',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 25], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 100 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [105, 25], [112, 31],
      ], areaEstimate: 170 },
    ],
  },

  // ---- 222年：三国鼎立 ----
  {
    year: 222, label: '黄初三年 · 三国鼎立',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 25], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 100 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [105, 25], [112, 31],
      ], areaEstimate: 170 },
    ],
  },

  // ---- 229年：孙权称帝 ----
  {
    year: 229, label: '黄龙元年 · 孙权称帝',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 25], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 100 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [105, 25], [112, 31],
      ], areaEstimate: 170 },
    ],
  },

  // ---- 249年：司马氏掌权 ----
  {
    year: 249, label: '嘉平元年 · 司马氏掌权',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 290 },
      { faction: 'shu', polygon: [
        [106, 33], [112, 31], [108, 28], [103, 26], [99, 25], [99, 34], [102, 34], [106, 33],
      ], areaEstimate: 100 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [105, 25], [112, 31],
      ], areaEstimate: 170 },
    ],
  },

  // ---- 263年：蜀汉灭亡 ----
  {
    year: 263, label: '景耀六年 · 蜀汉灭亡',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 33], [121, 30], [112, 31], [106, 33], [104, 36], [104, 42],
      ], areaEstimate: 400 },
      { faction: 'wu', polygon: [
        [112, 31], [121, 30], [122, 25], [119, 23], [113, 24], [108, 28], [105, 25], [112, 31],
      ], areaEstimate: 150 },
    ],
  },

  // ---- 280年：三国归晋 ----
  {
    year: 280, label: '太康元年 · 三国归晋',
    territories: [
      { faction: 'wei', polygon: [
        [104, 42], [122, 42], [122, 22], [97, 22], [97, 42], [104, 36], [106, 33], [104, 42],
      ], areaEstimate: 550 },
    ],
  },
];

// ============================================================
// 面积时间线（用于 Canvas 图表）
// ============================================================
export const territoryAreaTimeline: { year: number; wei: number; shu: number; wu: number; han: number; other: number }[] = [
  { year: 184, wei: 0, shu: 0, wu: 0, han: 700, other: 0 },
  { year: 190, wei: 0, shu: 0, wu: 0, han: 80, other: 620 },
  { year: 196, wei: 0, shu: 0, wu: 0, han: 30, other: 670 },
  { year: 200, wei: 180, shu: 0, wu: 0, han: 0, other: 520 },
  { year: 207, wei: 300, shu: 0, wu: 0, han: 0, other: 400 },
  { year: 208, wei: 290, shu: 50, wu: 90, han: 0, other: 270 },
  { year: 214, wei: 290, shu: 120, wu: 90, han: 0, other: 200 },
  { year: 219, wei: 290, shu: 100, wu: 170, han: 0, other: 0 },
  { year: 222, wei: 290, shu: 100, wu: 170, han: 0, other: 0 },
  { year: 229, wei: 290, shu: 100, wu: 170, han: 0, other: 0 },
  { year: 249, wei: 290, shu: 100, wu: 170, han: 0, other: 0 },
  { year: 263, wei: 400, shu: 0, wu: 150, han: 0, other: 0 },
  { year: 280, wei: 550, shu: 0, wu: 0, han: 0, other: 0 },
];

// ============================================================
// 插值引擎
// ============================================================
const FACTION_KEYS: FactionId[] = ['wei', 'shu', 'wu', 'han', 'other'];
const VERT_COUNT = 8;

function lerpPolygons(a: [number, number][], b: [number, number][], t: number): [number, number][] {
  return a.map((va, i) => [
    va[0] + (b[i][0] - va[0]) * t,
    va[1] + (b[i][1] - va[1]) * t,
  ]);
}

function polyCenter(verts: [number, number][]): [number, number] {
  const n = verts.length || 1;
  return verts.reduce(
    (acc, v) => [acc[0] + v[0] / n, acc[1] + v[1] / n],
    [0, 0] as [number, number],
  );
}

function makePointPoly(center: [number, number]): [number, number][] {
  return Array.from({ length: VERT_COUNT }, () => [...center]) as [number, number][];
}

export function interpolateTerritories(year: number): InterpolatedSnapshot {
  const y = Math.max(184, Math.min(280, year));
  const snaps = territorySnapshots;

  if (y <= snaps[0].year) {
    return { year: y, label: snaps[0].label, territories: snaps[0].territories.map(t => ({ ...t, polygon: [...t.polygon] })) };
  }
  if (y >= snaps[snaps.length - 1].year) {
    const last = snaps[snaps.length - 1];
    return { year: y, label: last.label, territories: last.territories.map(t => ({ ...t, polygon: [...t.polygon] })) };
  }

  let prev = snaps[0], next = snaps[snaps.length - 1];
  for (let i = 0; i < snaps.length - 1; i++) {
    if (y >= snaps[i].year && y <= snaps[i + 1].year) {
      prev = snaps[i]; next = snaps[i + 1]; break;
    }
  }

  const range = next.year - prev.year;
  const t = range === 0 ? 0 : (y - prev.year) / range;

  const allFactions = new Set<string>();
  prev.territories.forEach(t => allFactions.add(t.faction));
  next.territories.forEach(t => allFactions.add(t.faction));

  const territories: TerritoryShape[] = [];

  // 始终添加背景层
  territories.push({
    faction: 'background',
    polygon: [...BACKGROUND_POLY],
    areaEstimate: 0,
  });

  for (const faction of allFactions) {
    if (faction === 'background') continue;

    const pT = prev.territories.find(t => t.faction === faction);
    const nT = next.territories.find(t => t.faction === faction);

    if (pT && nT) {
      territories.push({
        faction: faction as FactionId,
        polygon: lerpPolygons(pT.polygon, nT.polygon, t),
        areaEstimate: Math.round(pT.areaEstimate + (nT.areaEstimate - pT.areaEstimate) * t),
      });
    } else if (pT && !nT) {
      // 势力消失：收缩到中心
      const c = polyCenter(pT.polygon);
      territories.push({
        faction: faction as FactionId,
        polygon: lerpPolygons(pT.polygon, makePointPoly(c), t),
        areaEstimate: Math.round(pT.areaEstimate * (1 - t)),
      });
    } else if (!pT && nT) {
      // 势力出现：从中心展开
      const c = polyCenter(nT.polygon);
      territories.push({
        faction: faction as FactionId,
        polygon: lerpPolygons(makePointPoly(c), nT.polygon, t),
        areaEstimate: Math.round(nT.areaEstimate * t),
      });
    }
  }

  return {
    year: y,
    label: t < 0.5 ? prev.label : next.label,
    territories: territories.filter(t => t.faction === 'background' || t.areaEstimate > 0),
  };
}

export function getInterpolatedAreas(year: number): Record<FactionId, number> {
  const y = Math.max(184, Math.min(280, year));
  const tl = territoryAreaTimeline;

  if (y <= tl[0].year) return { wei: tl[0].wei, shu: tl[0].shu, wu: tl[0].wu, han: tl[0].han, other: tl[0].other };
  if (y >= tl[tl.length - 1].year) {
    const last = tl[tl.length - 1];
    return { wei: last.wei, shu: last.shu, wu: last.wu, han: last.han, other: last.other };
  }

  let prev = tl[0], next = tl[tl.length - 1];
  for (let i = 0; i < tl.length - 1; i++) {
    if (y >= tl[i].year && y <= tl[i + 1].year) { prev = tl[i]; next = tl[i + 1]; break; }
  }

  const range = next.year - prev.year;
  const t = range === 0 ? 0 : (y - prev.year) / range;
  const result: Record<string, number> = {};
  for (const key of FACTION_KEYS) {
    result[key] = Math.round((prev[key] || 0) + ((next[key] || 0) - (prev[key] || 0)) * t);
  }
  return result as Record<FactionId, number>;
}
