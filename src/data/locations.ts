// ============================================================
// 地理位置数据（三国重要地点）
// ============================================================

import type { GeoCoordinate } from '../types';

export interface MapLocation {
  id: string;
  name: string;
  coordinate: GeoCoordinate;
  type: 'capital' | 'city' | 'battlefield' | 'pass';
  faction?: string;
  description?: string;
}

export const mapLocations: MapLocation[] = [
  { id: 'luoyang', name: '洛阳', coordinate: { lat: 34.6, lng: 112.4 }, type: 'capital', faction: 'wei', description: '东汉都城，后为曹魏都城' },
  { id: 'xuchang', name: '许都', coordinate: { lat: 34.0, lng: 113.8 }, type: 'capital', faction: 'wei', description: '曹操迎汉献帝所在地' },
  { id: 'chengdu', name: '成都', coordinate: { lat: 30.6, lng: 104.1 }, type: 'capital', faction: 'shu', description: '蜀汉都城' },
  { id: 'jianye', name: '建业', coordinate: { lat: 32.1, lng: 118.8 }, type: 'capital', faction: 'wu', description: '东吴都城（今南京）' },
  { id: 'ye', name: '邺城', coordinate: { lat: 36.3, lng: 114.3 }, type: 'city', faction: 'wei', description: '曹操发家之地' },
  { id: 'changsha', name: '长沙', coordinate: { lat: 28.2, lng: 113.0 }, type: 'city', faction: 'wu', description: '荆州南部重镇' },
  { id: 'jingzhou', name: '荆州', coordinate: { lat: 30.3, lng: 112.2 }, type: 'city', faction: 'wu', description: '兵家必争之地' },
  { id: 'xiangyang', name: '襄阳', coordinate: { lat: 32.0, lng: 112.1 }, type: 'city', faction: 'wei', description: '关羽北伐起点' },
  { id: 'hanzhong', name: '汉中', coordinate: { lat: 33.1, lng: 107.0 }, type: 'city', faction: 'shu', description: '蜀汉北大门' },
  { id: 'wuzhangyuan', name: '五丈原', coordinate: { lat: 34.2, lng: 107.6 }, type: 'battlefield', faction: 'shu', description: '诸葛亮病逝之地' },
  { id: 'chibi', name: '赤壁', coordinate: { lat: 29.7, lng: 113.6 }, type: 'battlefield', faction: 'other', description: '赤壁之战遗址' },
  { id: 'guandu', name: '官渡', coordinate: { lat: 34.8, lng: 113.9 }, type: 'battlefield', faction: 'wei', description: '官渡之战遗址' },
  { id: 'yiling', name: '夷陵', coordinate: { lat: 30.8, lng: 111.3 }, type: 'battlefield', faction: 'shu', description: '夷陵之战遗址' },
  { id: 'changban', name: '长坂坡', coordinate: { lat: 30.8, lng: 112.2 }, type: 'battlefield', faction: 'other', description: '赵云救阿斗之地' },
  { id: 'baocheng', name: '博望坡', coordinate: { lat: 33.0, lng: 112.9 }, type: 'battlefield', faction: 'shu' },
  { id: 'jieting', name: '街亭', coordinate: { lat: 34.5, lng: 105.5 }, type: 'battlefield', faction: 'shu', description: '马谡失守之地' },
  { id: 'xuzhou', name: '徐州', coordinate: { lat: 34.3, lng: 117.2 }, type: 'city', faction: 'wei' },
  { id: 'xiapi', name: '下邳', coordinate: { lat: 34.3, lng: 117.9 }, type: 'city', faction: 'wei', description: '吕布殒命之地' },
  { id: 'changan', name: '长安', coordinate: { lat: 34.3, lng: 108.9 }, type: 'city', faction: 'wei', description: '董卓迁都之地' },
  { id: 'longzhong', name: '隆中', coordinate: { lat: 32.0, lng: 112.1 }, type: 'city', faction: 'shu', description: '诸葛亮隐居之地' },
  { id: 'yinping', name: '阴平', coordinate: { lat: 32.4, lng: 104.7 }, type: 'pass', faction: 'shu', description: '邓艾偷渡阴平' },
  { id: 'jiange', name: '剑阁', coordinate: { lat: 31.9, lng: 105.5 }, type: 'pass', faction: 'shu', description: '蜀道天险' },
  { id: 'baiyangkou', name: '白狼山', coordinate: { lat: 42.3, lng: 120.7 }, type: 'battlefield', faction: 'wei', description: '曹操征乌桓' },
  { id: 'julu', name: '巨鹿', coordinate: { lat: 37.5, lng: 115.0 }, type: 'city', faction: 'other', description: '黄巾起义发源地' },
  { id: 'hefei', name: '合肥', coordinate: { lat: 31.8, lng: 117.3 }, type: 'city', faction: 'wei', description: '曹魏与东吴争夺的战略要地' },
  { id: 'baidicheng', name: '白帝城', coordinate: { lat: 31.0, lng: 109.5 }, type: 'city', faction: 'shu', description: '刘备托孤之地，位于长江三峡入口' },
  { id: 'baima', name: '白马', coordinate: { lat: 35.5, lng: 115.4 }, type: 'battlefield', faction: 'wei', description: '关羽斩颜良之地' },
  { id: 'nanzheng', name: '南郑', coordinate: { lat: 32.8, lng: 106.9 }, type: 'city', faction: 'shu', description: '汉中治所，蜀汉北伐基地' },
  { id: 'qishan', name: '祁山', coordinate: { lat: 34.3, lng: 105.7 }, type: 'pass', faction: 'shu', description: '诸葛亮北伐的重要通道' },
  { id: 'wancheng', name: '宛城', coordinate: { lat: 33.0, lng: 112.5 }, type: 'city', faction: 'wei', description: '张绣降曹之地，典韦战死于此' },
  // ---- 新增地点 ----
  { id: 'taiyuan', name: '太原', coordinate: { lat: 37.9, lng: 112.5 }, type: 'city', faction: 'wei', description: '并州治所，北方重镇' },
  { id: 'yejun', name: '冀州', coordinate: { lat: 37.5, lng: 115.7 }, type: 'city', faction: 'wei', description: '冀州治所，袁绍旧地' },
  { id: 'langye', name: '琅琊', coordinate: { lat: 35.1, lng: 118.3 }, type: 'city', faction: 'wei', description: '诸葛亮故乡' },
  { id: 'shouchun', name: '寿春', coordinate: { lat: 32.6, lng: 116.8 }, type: 'city', faction: 'wei', description: '淮南重镇，淮南三叛之地' },
  { id: 'jiangling', name: '江陵', coordinate: { lat: 30.4, lng: 112.2 }, type: 'city', faction: 'wu', description: '荆州治所，吕蒙偷袭之地' },
  { id: 'changsha2', name: '长沙', coordinate: { lat: 28.2, lng: 113.0 }, type: 'city', faction: 'wu', description: '关羽镇守之地' },
  { id: 'kuaiji', name: '会稽', coordinate: { lat: 30.0, lng: 120.6 }, type: 'city', faction: 'wu', description: '孙策起家之地' },
  { id: 'yuzhang', name: '豫章', coordinate: { lat: 28.7, lng: 115.9 }, type: 'city', faction: 'wu', description: '今江西南昌' },
  { id: 'poyang', name: '鄱阳', coordinate: { lat: 29.0, lng: 116.7 }, type: 'city', faction: 'wu', description: '鄱阳湖畔' },
  { id: 'fancheng', name: '樊城', coordinate: { lat: 32.0, lng: 112.1 }, type: 'battlefield', faction: 'shu', description: '关羽水淹七军之地' },
  { id: 'xiaoyaojin', name: '逍遥津', coordinate: { lat: 31.8, lng: 117.3 }, type: 'battlefield', faction: 'wei', description: '张辽威震逍遥津' },
  { id: 'dingjunshan', name: '定军山', coordinate: { lat: 33.0, lng: 106.8 }, type: 'battlefield', faction: 'shu', description: '黄忠斩夏侯渊之地' },
  { id: 'mianzhu', name: '绵竹', coordinate: { lat: 31.1, lng: 104.2 }, type: 'city', faction: 'shu', description: '邓艾入蜀之战' },
  { id: 'tianshui', name: '天水', coordinate: { lat: 34.6, lng: 105.7 }, type: 'city', faction: 'wei', description: '姜维故乡' },
  { id: 'hulao', name: '虎牢关', coordinate: { lat: 34.8, lng: 113.3 }, type: 'pass', faction: 'other', description: '三英战吕布之地' },
  { id: 'dengxia', name: '邓县', coordinate: { lat: 32.1, lng: 112.1 }, type: 'city', faction: 'shu', description: '隆中对所在地' },
  { id: 'wuling', name: '武陵', coordinate: { lat: 29.0, lng: 111.7 }, type: 'city', faction: 'shu', description: '蜀汉南部重镇' },
  { id: 'yongan', name: '永安', coordinate: { lat: 31.0, lng: 109.5 }, type: 'city', faction: 'shu', description: '刘备伐吴前线' },
  { id: 'xiangguo', name: '襄国', coordinate: { lat: 37.1, lng: 114.5 }, type: 'city', faction: 'wei', description: '邺城附近' },
  { id: 'xuzhou2', name: '广陵', coordinate: { lat: 32.4, lng: 119.4 }, type: 'city', faction: 'wei', description: '今扬州，曹魏东南边境' },

  // ---- 事件相关缺失地点补充 ----
  { id: 'suanzao', name: '酸枣', coordinate: { lat: 35.0, lng: 114.9 }, type: 'battlefield', faction: 'other', description: '关东联军会师之地，讨董起点' },
  { id: 'chaisang', name: '柴桑', coordinate: { lat: 29.7, lng: 115.9 }, type: 'city', faction: 'wu', description: '东吴军事重镇，诸葛亮出使江东之地' },
  { id: 'liaodong', name: '辽东', coordinate: { lat: 41.8, lng: 123.4 }, type: 'city', faction: 'other', description: '公孙氏割据之地，郭嘉遗计定辽东' },
  { id: 'maicheng', name: '麦城', coordinate: { lat: 30.8, lng: 111.3 }, type: 'city', faction: 'shu', description: '关羽败走被擒之地' },
  { id: 'nanzhong', name: '南中', coordinate: { lat: 25.0, lng: 102.7 }, type: 'city', faction: 'shu', description: '七擒孟获之地，今云南贵州一带' },
  { id: 'chencang', name: '陈仓', coordinate: { lat: 34.3, lng: 107.4 }, type: 'pass', faction: 'wei', description: '关陇要塞，郝昭坚守之城' },
  { id: 'huainan', name: '淮南', coordinate: { lat: 32.6, lng: 117.0 }, type: 'city', faction: 'wei', description: '淮南三叛之地' },
  { id: 'zhuojun', name: '涿郡', coordinate: { lat: 39.5, lng: 116.0 }, type: 'city', faction: 'shu', description: '刘备故乡，桃园结义之地' },
  { id: 'changjiang', name: '长江', coordinate: { lat: 30.0, lng: 113.0 }, type: 'battlefield', faction: 'other', description: '赤壁水战之地，草船借箭之地' },
  { id: 'huarongdao', name: '华容道', coordinate: { lat: 29.7, lng: 112.6 }, type: 'battlefield', faction: 'shu', description: '关羽义释曹操之地' },
  { id: 'xuchang_runan', name: '许昌-汝南', coordinate: { lat: 33.5, lng: 114.0 }, type: 'city', faction: 'wei', description: '关羽过五关斩六将路线' },
  { id: 'xiangshui', name: '湘水', coordinate: { lat: 29.0, lng: 113.0 }, type: 'battlefield', faction: 'wu', description: '湘水划界之地，单刀赴会之地' },
  { id: 'xicheng', name: '西城', coordinate: { lat: 33.3, lng: 107.0 }, type: 'city', faction: 'shu', description: '诸葛亮空城计退敌之地' },
  { id: 'shangfanggu', name: '上方谷', coordinate: { lat: 34.1, lng: 107.5 }, type: 'battlefield', faction: 'shu', description: '诸葛亮火烧上方谷之地' },

  // ---- 额外重要三国地点补充 ----
  { id: 'xuchang_city', name: '许昌', coordinate: { lat: 34.0, lng: 113.8 }, type: 'city', faction: 'wei', description: '曹魏重镇，屯田制推行之地' },
  { id: 'nanyang', name: '南阳', coordinate: { lat: 33.0, lng: 112.5 }, type: 'city', faction: 'wei', description: '宛城附近，张绣之地' },
  { id: 'runan', name: '汝南', coordinate: { lat: 33.0, lng: 114.0 }, type: 'city', faction: 'wei', description: '刘备曾屯兵之地' },
  { id: 'qingzhou', name: '青州', coordinate: { lat: 36.7, lng: 118.5 }, type: 'city', faction: 'wei', description: '袁谭旧地，曹操夺取' },
  { id: 'youzhou', name: '幽州', coordinate: { lat: 39.6, lng: 116.4 }, type: 'city', faction: 'wei', description: '公孙瓒旧地，北方边镇' },
  { id: 'yizhou', name: '益州', coordinate: { lat: 30.7, lng: 104.1 }, type: 'city', faction: 'shu', description: '刘璋旧地，蜀汉核心' },
  { id: 'yongzhou', name: '雍州', coordinate: { lat: 34.3, lng: 108.9 }, type: 'city', faction: 'wei', description: '关中地区，曹魏西线' },
  { id: 'liangzhou', name: '凉州', coordinate: { lat: 37.9, lng: 102.6 }, type: 'city', faction: 'other', description: '马超、韩遂之地' },
  { id: 'jinzhou', name: '荆州南郡', coordinate: { lat: 30.4, lng: 112.2 }, type: 'city', faction: 'wu', description: '吕蒙白衣渡江夺取之地' },
  { id: 'wuling2', name: '武陵', coordinate: { lat: 29.0, lng: 111.7 }, type: 'city', faction: 'shu', description: '蜀汉南部，关羽曾镇守' },
  { id: 'lingling', name: '零陵', coordinate: { lat: 26.4, lng: 111.6 }, type: 'city', faction: 'shu', description: '荆州南部四郡之一' },
  { id: 'guiyang', name: '桂阳', coordinate: { lat: 25.8, lng: 113.0 }, type: 'city', faction: 'shu', description: '赵云攻取之地' },
  { id: 'changsha3', name: '长沙郡', coordinate: { lat: 28.2, lng: 113.0 }, type: 'city', faction: 'wu', description: '关羽镇守之地' },
  { id: 'xidi', name: '西凉', coordinate: { lat: 35.5, lng: 103.7 }, type: 'city', faction: 'other', description: '董卓、马超起兵之地' },
  { id: 'wancheng2', name: '上庸', coordinate: { lat: 32.4, lng: 110.0 }, type: 'city', faction: 'wei', description: '孟达叛蜀之地' },
  { id: 'xinye', name: '新野', coordinate: { lat: 32.5, lng: 112.4 }, type: 'city', faction: 'shu', description: '刘备驻扎之地，诸葛亮初出茅庐' },
  { id: 'fan2', name: '樊城', coordinate: { lat: 32.0, lng: 112.1 }, type: 'battlefield', faction: 'shu', description: '关羽水淹七军之地' },
  { id: 'wulin', name: '乌林', coordinate: { lat: 29.9, lng: 113.5 }, type: 'battlefield', faction: 'other', description: '赤壁之战曹军大营' },
  { id: 'xiaoyaojin2', name: '濡须口', coordinate: { lat: 31.5, lng: 118.0 }, type: 'battlefield', faction: 'wu', description: '曹魏与东吴多次争夺之地' },
  { id: 'shiting', name: '石亭', coordinate: { lat: 30.5, lng: 117.8 }, type: 'battlefield', faction: 'wu', description: '陆逊大败曹休之地' },
  { id: 'jieting2', name: '斜谷', coordinate: { lat: 34.0, lng: 107.3 }, type: 'pass', faction: 'shu', description: '诸葛亮北伐通道' },
  { id: 'qishan2', name: '散关', coordinate: { lat: 34.3, lng: 107.0 }, type: 'pass', faction: 'shu', description: '蜀道要塞' },
  { id: 'tazhong', name: '沓中', coordinate: { lat: 34.0, lng: 104.0 }, type: 'city', faction: 'shu', description: '姜维屯田之地' },
  { id: 'yinxing', name: '阴平道', coordinate: { lat: 32.4, lng: 104.7 }, type: 'pass', faction: 'shu', description: '邓艾偷渡之路' },
  { id: 'mianxian', name: '沔县', coordinate: { lat: 33.1, lng: 106.8 }, type: 'city', faction: 'shu', description: '定军山附近，蜀汉军事重镇' },
  { id: 'lukou', name: '鹿角', coordinate: { lat: 29.5, lng: 112.5 }, type: 'battlefield', faction: 'wu', description: '东吴江防要塞' },
  { id: 'baling', name: '巴陵', coordinate: { lat: 29.4, lng: 113.1 }, type: 'city', faction: 'wu', description: '今岳阳，洞庭湖畔' },
  { id: 'piling', name: '毗陵', coordinate: { lat: 31.8, lng: 119.9 }, type: 'city', faction: 'wu', description: '今常州，东吴北部边境' },
  { id: 'jiaozhi', name: '交趾', coordinate: { lat: 21.0, lng: 106.0 }, type: 'city', faction: 'wu', description: '今越南北部，东吴南方领土' },
  { id: 'yizhou2', name: '夷洲', coordinate: { lat: 23.7, lng: 120.9 }, type: 'city', faction: 'wu', description: '今台湾，孙权曾派卫温到达' },
];

/** 地图显示范围（三国时期大致区域） */
export const mapBounds = {
  latMin: 24,
  latMax: 44,
  lngMin: 100,
  lngMax: 122,
};

// ============================================================
// 地点势力随年份变化
// 格式：[年份, 势力] 按年份升序排列
// ============================================================
export const locationFactionTimeline: Record<string, [number, string][]> = {
  // ---- 都城 ----
  'luoyang':     [[184,'han'],[190,'other'],[196,'wei'],[220,'wei'],[265,'wei'],[280,'wei']],
  'xuchang':     [[196,'wei'],[220,'wei'],[280,'wei']],
  'chengdu':     [[214,'shu'],[263,'wei'],[280,'wei']],
  'jianye':      [[200,'wu'],[222,'wu'],[280,'wei']],
  // ---- 魏地 ----
  'ye':          [[200,'wei'],[280,'wei']],
  'xuzhou':      [[200,'wei'],[280,'wei']],
  'xiapi':       [[198,'wei'],[280,'wei']],
  'hefei':       [[200,'wei'],[280,'wei']],
  'baima':       [[200,'wei'],[280,'wei']],
  'wancheng':    [[197,'wei'],[280,'wei']],
  'taiyuan':     [[200,'wei'],[280,'wei']],
  'yejun':       [[200,'wei'],[280,'wei']],
  'langye':      [[200,'wei'],[280,'wei']],
  'shouchun':    [[200,'wei'],[280,'wei']],
  'nanyang':     [[197,'wei'],[280,'wei']],
  'runan':       [[200,'wei'],[280,'wei']],
  'qingzhou':    [[200,'wei'],[280,'wei']],
  'youzhou':     [[200,'wei'],[280,'wei']],
  'yongzhou':    [[200,'wei'],[280,'wei']],
  'tianshui':    [[228,'shu'],[228,'wei'],[280,'wei']],
  'changan':     [[190,'other'],[196,'wei'],[280,'wei']],
  'xuchang_city':[[196,'wei'],[280,'wei']],
  'xuchang_runan':[[200,'wei'],[280,'wei']],
  'wancheng2':   [[220,'shu'],[220,'wei'],[280,'wei']],
  'guandu':      [[200,'wei'],[280,'wei']],
  'xiaoyaojin':  [[215,'wei'],[280,'wei']],
  'huainan':     [[251,'wei'],[280,'wei']],
  'chencang':    [[228,'wei'],[280,'wei']],
  'baiyangkou': [[207,'wei'],[280,'wei']],
  'xuzhou2':     [[200,'wei'],[280,'wei']],
  'xiangguo':   [[200,'wei'],[280,'wei']],
  // ---- 蜀地 ----
  'hanzhong':    [[215,'other'],[219,'shu'],[263,'wei'],[280,'wei']],
  'wuzhangyuan':[[227,'shu'],[234,'shu'],[263,'wei'],[280,'wei']],
  'yiling':     [[222,'shu'],[222,'wu'],[280,'wu']],
  'baocheng':   [[202,'shu'],[208,'shu'],[280,'shu']],
  'jieting':    [[228,'shu'],[263,'wei'],[280,'wei']],
  'longzhong':  [[207,'shu'],[263,'wei'],[280,'wei']],
  'yinping':    [[214,'shu'],[263,'wei'],[280,'wei']],
  'jiange':     [[214,'shu'],[263,'wei'],[280,'wei']],
  'nanzheng':   [[219,'shu'],[263,'wei'],[280,'wei']],
  'qishan':     [[227,'shu'],[263,'wei'],[280,'wei']],
  'baidicheng': [[222,'shu'],[263,'wei'],[280,'wei']],
  'dingjunshan':[[217,'shu'],[263,'wei'],[280,'wei']],
  'mianzhu':    [[214,'shu'],[263,'wei'],[280,'wei']],
  'dengxia':    [[207,'shu'],[263,'wei'],[280,'wei']],
  'wuling':     [[208,'shu'],[219,'wu'],[280,'wu']],
  'yongan':     [[222,'shu'],[263,'wei'],[280,'wei']],
  'yizhou':     [[214,'shu'],[263,'wei'],[280,'wei']],
  'lingling':   [[208,'shu'],[219,'wu'],[280,'wu']],
  'guiyang':    [[208,'shu'],[219,'wu'],[280,'wu']],
  'xinye':      [[201,'shu'],[208,'shu'],[280,'wei']],
  'fancheng':   [[219,'shu'],[219,'wei'],[280,'wei']],
  'fan2':       [[219,'shu'],[219,'wei'],[280,'wei']],
  'jieting2':   [[227,'shu'],[263,'wei'],[280,'wei']],
  'qishan2':    [[227,'shu'],[263,'wei'],[280,'wei']],
  'tazhong':    [[258,'shu'],[263,'wei'],[280,'wei']],
  'yinxing':    [[214,'shu'],[263,'wei'],[280,'wei']],
  'mianxian':   [[217,'shu'],[263,'wei'],[280,'wei']],
  'nanzhong':   [[225,'shu'],[263,'wei'],[280,'wei']],
  'xicheng':    [[228,'shu'],[263,'wei'],[280,'wei']],
  'shangfanggu':[[234,'shu'],[263,'wei'],[280,'wei']],
  'zhuojun':    [[184,'other'],[190,'other'],[200,'wei'],[280,'wei']],
  'maicheng':   [[219,'shu'],[220,'wu'],[280,'wu']],
  // ---- 吴地 ----
  'changsha':   [[200,'wu'],[280,'wu']],
  'jingzhou':   [[208,'other'],[219,'wu'],[280,'wu']],
  'xiangyang':  [[184,'han'],[208,'shu'],[219,'wei'],[280,'wei']],
  'chibi':      [[208,'other'],[280,'wu']],
  'changban':   [[208,'other'],[280,'wei']],
  'jiangling':  [[208,'other'],[219,'wu'],[280,'wu']],
  'changsha2':  [[200,'wu'],[280,'wu']],
  'kuaiji':     [[194,'wu'],[280,'wu']],
  'yuzhang':    [[194,'wu'],[280,'wu']],
  'poyang':     [[194,'wu'],[280,'wu']],
  'chaisang':   [[208,'wu'],[280,'wu']],
  'xiangshui':  [[215,'wu'],[280,'wu']],
  'wulin':      [[208,'other'],[280,'wu']],
  'xiaoyaojin2':[[213,'wu'],[280,'wu']],
  'shiting':    [[228,'wu'],[280,'wu']],
  'lukou':      [[208,'wu'],[280,'wu']],
  'baling':     [[208,'wu'],[280,'wu']],
  'piling':     [[200,'wu'],[280,'wu']],
  'jiaozhi':    [[226,'wu'],[280,'wu']],
  'yizhou2':    [[230,'wu'],[280,'wu']],
  'jinzhou':    [[219,'wu'],[280,'wu']],
  'changsha3':  [[200,'wu'],[280,'wu']],
  'wuling2':    [[208,'shu'],[219,'wu'],[280,'wu']],
  // ---- 其他/战场 ----
  'julu':       [[184,'other'],[200,'wei'],[280,'wei']],
  'hulao':      [[190,'other'],[196,'other'],[200,'wei'],[280,'wei']],
  'suanzao':    [[190,'other'],[196,'other'],[200,'wei'],[280,'wei']],
  'liaodong':   [[184,'other'],[207,'other'],[238,'wei'],[280,'wei']],
  'changjiang': [[208,'other'],[280,'wei']],
  'huarongdao': [[208,'other'],[280,'wei']],
  'liangzhou':  [[184,'other'],[211,'other'],[221,'shu'],[221,'other'],[280,'wei']],
  'xidi':       [[184,'other'],[211,'other'],[221,'other'],[280,'wei']],
};

/**
 * 获取某地点在某年的所属势力
 */
export function getLocationFaction(locationId: string, year: number): string {
  const timeline = locationFactionTimeline[locationId];
  if (!timeline || timeline.length === 0) return 'other';

  let faction = 'other';
  for (const [y, f] of timeline) {
    if (y <= year) faction = f;
    else break;
  }
  return faction;
}
