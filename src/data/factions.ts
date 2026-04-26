// ============================================================
// 三国时期势力定义
// ============================================================

import type { Faction } from '../types';

export const factions: Record<string, Faction> = {
  wei: {
    id: 'wei',
    name: '曹魏',
    color: '#4A90D9',
    bgColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: '#4A90D9',
    leader: '曹操',
    description: '曹魏政权，由曹操奠基，曹丕篡汉后建立',
  },
  shu: {
    id: 'shu',
    name: '蜀汉',
    color: '#E85D5D',
    bgColor: 'rgba(232, 93, 93, 0.15)',
    borderColor: '#E85D5D',
    leader: '刘备',
    description: '蜀汉政权，刘备建立，以匡扶汉室为旗号',
  },
  wu: {
    id: 'wu',
    name: '东吴',
    color: '#4ADE80',
    bgColor: 'rgba(74, 222, 128, 0.15)',
    borderColor: '#4ADE80',
    leader: '孙权',
    description: '东吴政权，孙权继承父兄基业，据江东而立',
  },
  han: {
    id: 'han',
    name: '东汉',
    color: '#FACC15',
    bgColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: '#FACC15',
    leader: '汉献帝',
    description: '东汉末年朝廷，名存实亡',
  },
  other: {
    id: 'other',
    name: '其他',
    color: '#22D3EE',
    bgColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: '#22D3EE',
    description: '其他势力或中立事件',
  },
};
