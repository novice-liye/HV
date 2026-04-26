// ============================================================
// 三国统计数据
// 消费现有数据模块，生成图表所需的统计信息
// ============================================================

import type { FactionId, EventCategory } from '../types';
import { events } from './events';
import { persons } from './persons';
import { territoryAreaTimeline } from './territories';

export { territoryAreaTimeline };

/** 各年份事件统计 */
export function getEventStatsByYear(year: number) {
  const inRange = events.filter(e => e.startYear <= year && e.endYear >= year);
  const byCategory: Record<EventCategory, number> = {
    military: 0, political: 0, person: 0, diplomacy: 0, rebellion: 0, construction: 0, other: 0,
  };
  const byImportance: Record<string, number> = { critical: 0, major: 0, minor: 0 };
  const byFaction: Record<FactionId, number> = { wei: 0, shu: 0, wu: 0, han: 0, other: 0 };

  inRange.forEach(e => {
    byCategory[e.category]++;
    byImportance[e.importance]++;
    e.factions.forEach(f => { byFaction[f]++; });
  });

  return { total: inRange.length, byCategory, byImportance, byFaction };
}

/** 各年份人物统计 */
export function getPersonStatsByYear(year: number) {
  const alive = persons.filter(p => {
    const birth = p.birthYear ?? 100;
    const death = p.deathYear ?? 300;
    return birth <= year && death >= year;
  });
  const byFaction: Record<FactionId, number> = { wei: 0, shu: 0, wu: 0, han: 0, other: 0 };
  alive.forEach(p => { byFaction[p.faction]++; });
  return { total: alive.length, byFaction };
}

/** 获取指定年份的面积数据 */
export function getAreaStatsByYear(year: number) {
  let closest = territoryAreaTimeline[0];
  for (const row of territoryAreaTimeline) {
    if (row.year <= year) closest = row;
    else break;
  }
  return closest;
}

/** 关键年份的势力人口估算（万口） */
export const populationEstimates = [
  { year: 184, wei: 0, shu: 0, wu: 0, han: 5000, other: 0 },
  { year: 200, wei: 0, shu: 0, wu: 0, han: 3000, other: 2000 },
  { year: 208, wei: 800, shu: 200, wu: 400, han: 0, other: 100 },
  { year: 220, wei: 440, shu: 90, wu: 230, han: 0, other: 0 },
  { year: 230, wei: 450, shu: 95, wu: 230, han: 0, other: 0 },
  { year: 240, wei: 1200, shu: 500, wu: 750, han: 0, other: 0 },
  { year: 250, wei: 500, shu: 94, wu: 230, han: 0, other: 0 },
  { year: 263, wei: 530, shu: 94, wu: 230, han: 0, other: 0 },
  { year: 280, wei: 1600, shu: 0, wu: 500, han: 0, other: 0 },
];

export function getPopulationByYear(year: number) {
  let closest = populationEstimates[0];
  for (const row of populationEstimates) {
    if (row.year <= year) closest = row;
    else break;
  }
  return closest;
}

/** 势力兵力估算（万人） */
export const militaryEstimates = [
  { year: 190, wei: 0, shu: 0, wu: 0, han: 20, other: 50 },
  { year: 200, wei: 30, shu: 0, wu: 0, han: 10, other: 40 },
  { year: 208, wei: 25, shu: 5, wu: 10, han: 0, other: 5 },
  { year: 214, wei: 30, shu: 15, wu: 15, han: 0, other: 0 },
  { year: 220, wei: 40, shu: 10, wu: 20, han: 0, other: 0 },
  { year: 230, wei: 45, shu: 10, wu: 20, han: 0, other: 0 },
  { year: 240, wei: 70, shu: 45, wu: 55, han: 0, other: 0 },
  { year: 250, wei: 50, shu: 8, wu: 20, han: 0, other: 0 },
  { year: 263, wei: 50, shu: 5, wu: 20, han: 0, other: 0 },
  { year: 280, wei: 50, shu: 0, wu: 15, han: 0, other: 0 },
];

export function getMilitaryByYear(year: number) {
  let closest = militaryEstimates[0];
  for (const row of militaryEstimates) {
    if (row.year <= year) closest = row;
    else break;
  }
  return closest;
}
