// ============================================================
// 省份→势力映射数据 v2
// 增加更多关键帧年份，修正历史准确性
// 'war' = 争夺中, 'neutral' = 非核心区域
// ============================================================

import type { FactionId } from '../types';

export type ProvinceFaction = FactionId | 'war' | 'neutral';

export const PROVINCE_NAMES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区',
] as const;

export type ProvinceName = typeof PROVINCE_NAMES[number];

export interface ProvinceFactionMap {
  year: number;
  label: string;
  provinces: Record<string, ProvinceFaction>;
}

// 省份归属辅助函数
const H = (f: ProvinceFaction): Record<string, ProvinceFaction> => {
  const r: Record<string, ProvinceFaction> = {};
  for (const p of PROVINCE_NAMES) r[p] = f;
  return r;
};

export const provinceFactionTimeline: ProvinceFactionMap[] = [
  // ---- 184年：黄巾起义（东汉统一） ----
  {
    year: 184, label: '中平元年 · 黄巾起义',
    provinces: { ...H('han'), '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral' },
  },

  // ---- 190年：群雄割据（董卓乱政） ----
  {
    year: 190, label: '初平元年 · 群雄割据',
    provinces: {
      ...H('han'),
      '北京市': 'war', '天津市': 'war', '河北省': 'war', '山西省': 'war',
      '山东省': 'war', '河南省': 'war', '安徽省': 'war', '陕西省': 'war',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 196年：曹操迎天子 ----
  {
    year: 196, label: '建安元年 · 曹操迎天子',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'war', '安徽省': 'war',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 200年：官渡之战 ----
  {
    year: 200, label: '建安五年 · 官渡之战',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '安徽省': 'war',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 207年：曹操统一北方 ----
  {
    year: 207, label: '建安十二年 · 曹操统一北方',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '安徽省': 'han', '江苏省': 'han', '浙江省': 'han', '湖北省': 'han',
      '湖南省': 'han', '江西省': 'han', '广东省': 'han', '广西壮族自治区': 'han',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'han', '四川省': 'han', '贵州省': 'han', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 208年：赤壁之战 ----
  {
    year: 208, label: '建安十三年 · 赤壁之战',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '安徽省': 'war', '江苏省': 'war', '湖北省': 'war',
      '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu', '湖南省': 'han',
      '广东省': 'han', '广西壮族自治区': 'han',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'han', '四川省': 'han', '贵州省': 'han', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 214年：刘备取益州 ----
  {
    year: 214, label: '建安十九年 · 刘备取益州',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '安徽省': 'war', '湖北省': 'war',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'han', '广东省': 'han', '广西壮族自治区': 'han',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 219年：关羽失荆州 ----
  {
    year: 219, label: '建安二十四年 · 关羽失荆州',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'war', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 220年：曹丕篡汉 ----
  {
    year: 220, label: '建安二十五年 · 曹丕篡汉',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 222年：三国鼎立 ----
  {
    year: 222, label: '黄初三年 · 三国鼎立',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'shu',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 225年：诸葛亮南征 ----
  {
    year: 225, label: '建兴三年 · 诸葛亮南征',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'shu',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 234年：诸葛亮病逝五丈原 ----
  {
    year: 234, label: '建兴十二年 · 诸葛亮病逝',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'shu',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 249年：司马氏掌权 ----
  {
    year: 249, label: '嘉平元年 · 司马氏掌权',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wu',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'shu',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 251年：淮南二叛 ----
  {
    year: 251, label: '嘉平三年 · 淮南二叛',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'war',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'shu', '四川省': 'shu', '贵州省': 'shu', '云南省': 'shu',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 263年：蜀汉灭亡 ----
  {
    year: 263, label: '景耀六年 · 蜀汉灭亡',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wei',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'wei', '四川省': 'wei', '贵州省': 'wei', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 265年：西晋建立 ----
  {
    year: 265, label: '泰始元年 · 西晋建立',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wei',
      '江苏省': 'wu', '浙江省': 'wu', '福建省': 'wu', '江西省': 'wu',
      '湖南省': 'wu', '广东省': 'wu', '广西壮族自治区': 'wu',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'wei', '四川省': 'wei', '贵州省': 'wei', '云南省': 'han',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },

  // ---- 280年：三国归晋 ----
  {
    year: 280, label: '太康元年 · 三国归晋',
    provinces: {
      ...H('han'),
      '北京市': 'wei', '天津市': 'wei', '河北省': 'wei', '山西省': 'wei',
      '山东省': 'wei', '河南省': 'wei', '陕西省': 'wei', '内蒙古自治区': 'wei',
      '湖北省': 'wei', '安徽省': 'wei',
      '江苏省': 'wei', '浙江省': 'wei', '福建省': 'wei', '江西省': 'wei',
      '湖南省': 'wei', '广东省': 'wei', '广西壮族自治区': 'wei',
      '辽宁省': 'other', '吉林省': 'other', '黑龙江省': 'other',
      '甘肃省': 'han', '宁夏回族自治区': 'han',
      '重庆市': 'wei', '四川省': 'wei', '贵州省': 'wei', '云南省': 'wei',
      '台湾省': 'neutral', '香港特别行政区': 'neutral', '澳门特别行政区': 'neutral',
    },
  },
];

// ============================================================
// 插值引擎
// ============================================================

export function getProvinceFactions(year: number): { label: string; provinces: Record<string, ProvinceFaction> } {
  const y = Math.max(184, Math.min(280, year));
  const tl = provinceFactionTimeline;

  if (y <= tl[0].year) return { label: tl[0].label, provinces: { ...tl[0].provinces } };
  if (y >= tl[tl.length - 1].year) {
    const last = tl[tl.length - 1];
    return { label: last.label, provinces: { ...last.provinces } };
  }

  let prev = tl[0], next = tl[tl.length - 1];
  for (let i = 0; i < tl.length - 1; i++) {
    if (y >= tl[i].year && y <= tl[i + 1].year) {
      prev = tl[i]; next = tl[i + 1]; break;
    }
  }

  if (y === prev.year) return { label: prev.label, provinces: { ...prev.provinces } };
  if (y === next.year) return { label: next.label, provinces: { ...next.provinces } };

  // 省份归属变化中 → 标记为 war
  const provinces: Record<string, ProvinceFaction> = {};
  for (const prov of PROVINCE_NAMES) {
    const pFaction = prev.provinces[prov];
    const nFaction = next.provinces[prov];
    if (pFaction === nFaction) {
      provinces[prov] = pFaction;
    } else {
      provinces[prov] = 'war';
    }
  }

  const t = (y - prev.year) / (next.year - prev.year);
  return {
    label: t < 0.5 ? prev.label : next.label,
    provinces,
  };
}

export function getFactionProvinceCount(year: number): Record<string, number> {
  const { provinces } = getProvinceFactions(year);
  const counts: Record<string, number> = { wei: 0, shu: 0, wu: 0, han: 0, other: 0, war: 0, neutral: 0 };
  for (const faction of Object.values(provinces)) {
    counts[faction] = (counts[faction] || 0) + 1;
  }
  return counts;
}
