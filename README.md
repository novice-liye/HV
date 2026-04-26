# 三国历史可视化

> 多维度展示三国时期（184—280 AD）的历史脉络

基于 React + TypeScript + Leaflet + Canvas 构建的交互式三国历史可视化平台，包含 10 个功能模块，支持模块间联动、AI 智能问答、地图疆域演变动画等功能。

![React](https://img.shields.io/badge/React-19-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能特性

- 🗺️ **交互式地图** — Leaflet 地图引擎，34 省份势力填色，80+ 地点标记，行军路线动画
- 📜 **时间线** — 多轨道时间轴（184-280年），支持缩放、平移、势力/分类筛选
- 🕸️ **人物关系图** — Canvas 力导向图，73 个人物节点 + 166 条关系边，拼音搜索
- 🤖 **AI 智能问答** — DeepSeek API 对话式助手，内置三国知识库，支持联网搜索
- 📚 **著作典籍** — 43 部三国时期著作（兵法/文学/史学/思想/医学）
- 📊 **数据仪表盘** — 疆域面积变化、人口统计、战役数据可视化
- 👤 **人物图鉴** — 73 位三国人物百科，势力筛选、年份过滤
- ⚔️ **战役沙盘** — 经典战役回放，行军路线动画
- 🔄 **模块联动** — EventBus 跨模块通信，点击事件自动跳转地图/关系图
- 🗂️ **图层切换** — 地图三图层独立控制：疆域 / 事件 / 著作

---

## 📸 模块预览

### 首页

项目入口，展示所有功能模块卡片，一键跳转。

### 📜 时间线

多轨道时间轴，支持事件筛选、详情面板、跨模块联动。点击事件可触发地图飞到对应位置、关系图高亮相关人物。

### 🗺️ 三国地图

Leaflet 交互式地图，核心功能：

- **疆域填色** — 34 个省份按势力归属着色，随年份变化动态更新
- **地点标记** — 80+ 个城市/关隘/战场标记，点击查看详情
- **行军路线动画** — 赤壁之战、夷陵之战等经典战役动画回放
- **时间轴播放** — 184-280 年逐年播放，自动展示疆域变化
- **三图层切换** — 疆域 / 事件 / 著作 独立控制显隐
- **面积图表** — 右侧实时显示各势力疆域面积变化趋势

### 🕸️ 人物关系图

Canvas 力导向图，核心功能：

- **73 个人物节点** — 按势力着色（曹魏蓝/蜀汉红/东吴绿/东汉黄/其他灰）
- **166 条关系边** — 家族/君臣/敌对/对手/联盟 5 种类型
- **拼音搜索** — 支持中文、拼音全拼、首字母缩写搜索
- **势力筛选** — 一键过滤指定势力的人物
- **节点聚焦** — 点击节点高亮其关系网络，淡化无关节点
- **缩放平移** — 鼠标滚轮缩放（0.3x-3x），拖拽平移
- **详情面板** — 折叠式详情卡片，显示人物信息、关系列表、相关事件

### 🔍 AI 搜索

DeepSeek API 对话式 AI 助手，核心功能：

- **三国知识库** — 系统提示词压缩所有项目数据（人物/事件/著作/地点/势力）
- **联网搜索** — 一键切换 DeepSeek web_search 工具
- **SSE 流式输出** — 实时显示 AI 回复
- **对话管理** — 侧边栏管理多个对话，IndexedDB 持久化
- **快捷提问** — 预设常见问题按钮引导

### 📚 著作典籍

43 部三国时期著名著作展示：

| 类型 | 代表作品 |
|------|---------|
| 兵法 | 孙子兵法、将苑、八阵图、太公六韬、吴子兵法 |
| 文学 | 短歌行、洛神赋、七步诗、出师表、燕歌行、世说新语 |
| 史学 | 三国志、后汉书、春秋左氏传 |
| 思想 | 论衡、人物志、抱朴子 |
| 医学 | 千金要方 |

支持类型筛选、搜索、点击跳转地图定位。

### 📊 数据仪表盘

四维统计图表：事件分类饼图、兵力柱状图、人口趋势、疆域面积变化。年份滑块与其他模块联动。

### 👤 人物图鉴

73 位三国人物百科卡片，支持势力筛选、年份过滤、搜索。点击人物可跳转关系图。

### ⚔️ 战役沙盘

经典战役回放，行军路线动画，参战势力与人物分析。

### ℹ️ 关于

项目技术文档，包含项目结构、技术栈、核心架构说明。

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9

### 安装与运行

```bash
# 克隆项目
git clone https://gitee.com/your-username/three-kingdoms-timeline.git
cd three-kingdoms-timeline

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后浏览器访问 `http://localhost:5182` 即可查看。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可部署到任意静态服务器。

### 预览生产版本

```bash
npm run preview
```

### AI 搜索配置

AI 搜索功能需要用户自行提供 DeepSeek API Key：

1. 进入 AI 搜索页面
2. 点击右上角「🔑 设置Key」按钮
3. 输入您的 DeepSeek API Key（[获取 Key](https://platform.deepseek.com/api_keys)）
4. Key 自动保存到浏览器 localStorage

---

## 📂 项目结构

```
three-kingdoms-timeline/
├── public/
│   ├── china_provinces.json        # 中国省份 GeoJSON 数据（疆域填色）
│   └── favicon.svg
├── src/
│   ├── ai/                         # AI 模块
│   │   ├── systemPrompt.ts         # 系统提示词（压缩所有项目数据）
│   │   └── chatDB.ts               # IndexedDB 对话记录管理
│   ├── components/                 # 组件模块
│   │   ├── about/                  # ℹ️ 关于页面（项目文档）
│   │   ├── ai-search/              # 🔍 AI 搜索（DeepSeek 对话）
│   │   ├── battle-sandbox/         # ⚔️ 战役沙盘
│   │   ├── dashboard/              # 📊 数据仪表盘
│   │   ├── detail-panel/           # 📋 事件详情面板
│   │   ├── map-placeholder/        # 🗺️ 占位地图
│   │   ├── person-gallery/         # 👤 人物图鉴
│   │   ├── relation-graph/         # 🕸️ 人物关系图（Canvas 力导向）
│   │   ├── territory/              # 🗺️ 疆域演变地图（Leaflet）
│   │   ├── timeline/               # 📜 时间线（EventBar/Tracks/Axis）
│   │   ├── works/                  # 📚 著作典籍
│   │   └── ModuleNav.tsx           # 导航栏组件
│   ├── core/                       # 核心模块
│   │   ├── EventBus.ts             # 事件总线（跨模块通信）
│   │   ├── router.tsx              # Hash 路由系统
│   │   └── navigation.ts           # 导航工具函数
│   ├── data/                       # 历史数据层
│   │   ├── config.ts               # 全局配置
│   │   ├── events.ts               # 历史事件（73 个）
│   │   ├── factions.ts             # 势力定义（5 方势力）
│   │   ├── locations.ts            # 地点数据（80+ 个）
│   │   ├── persons.ts              # 人物数据（73 人 + 166 条关系）
│   │   ├── provinceFactions.ts     # 省份势力归属时间线（34 省）
│   │   ├── statistics.ts           # 统计数据
│   │   ├── territories.ts          # 疆域面积时间线
│   │   └── works.ts                # 著作数据（43 部）
│   ├── hooks/                      # 自定义 Hooks
│   │   └── useTimeline.ts          # 时间线状态管理
│   ├── styles/
│   │   └── global.css              # 全局样式（暗色古风主题）
│   ├── types/
│   │   └── index.ts                # TypeScript 类型定义
│   ├── App.tsx                     # 应用入口 + 路由渲染
│   └── main.tsx                    # React 挂载
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19 | UI 框架，组件化开发 |
| **TypeScript** | 6.0 | 类型安全，提升代码质量 |
| **Vite** | 8 | 构建工具，快速热更新 |
| **Leaflet** | 1.9 | 交互式地图引擎 |
| **React-Leaflet** | 5.0 | React 地图组件绑定 |
| **Canvas API** | — | 力导向关系图绘制 |
| **IndexedDB** | — | AI 对话记录持久化 |
| **DeepSeek API** | — | AI 大模型智能问答 |
| **EventBus** | 自研 | 跨模块事件通信 |
| **Hash Router** | 自研 | 轻量客户端路由 |
| **CSS Variables** | — | 主题系统，暗色古风 |

---

## 🏗️ 核心架构

### 跨模块通信 — EventBus

所有模块通过自定义 `EventBus` 进行松耦合通信：

```typescript
// 发送事件
eventBus.emit('event:selected', event, 'timeline');

// 监听事件
eventBus.on('event:selected', (payload) => {
  // 处理事件...
}, 'territory-map');

// 取消监听
const unsub = eventBus.on('event:selected', handler);
unsub();
```

#### 主要事件类型

| 事件名 | 说明 | 典型来源 |
|--------|------|---------|
| `event:selected` | 选中历史事件 | 时间线 / 地图 / 详情面板 |
| `map:flyTo` | 地图飞到指定坐标 | 详情面板 / 人物图鉴 |
| `map:playAnimation` | 播放地图动画 | 详情面板 / AI 搜索 |
| `relation:focusNode` | 聚焦关系图节点 | AI 搜索 / 人物图鉴 |
| `relation:highlightNodes` | 高亮多个节点 | 时间线 |
| `module:navigate` | 跨模块导航跳转 | 所有模块 |
| `works:selected` | 选中著作 | 著作模块 |
| `ai:search` | AI 搜索请求 | 外部模块 |

### 路由系统 — Hash Router

基于 `window.location.hash` 的轻量路由：

```typescript
type Route = 'home' | 'timeline' | 'map' | 'ai-search'
  | 'relation-graph' | 'territory' | 'dashboard'
  | 'person-gallery' | 'battle-sandbox' | 'works' | 'about';

// 跨模块跳转
eventBus.emit('module:navigate', 'territory');
```

### AI 系统

AI 模块由三层组成：

1. **systemPrompt.ts** — 将所有项目数据（人物/事件/著作/地点/势力）压缩为结构化系统提示词
2. **chatDB.ts** — IndexedDB 对话记录管理（会话 CRUD + 消息 CRUD）
3. **AISearchDemo.tsx** — DeepSeek API 对话界面，支持 SSE 流式输出和联网搜索

---

## 📊 数据规模

| 数据项 | 数量 | 说明 |
|--------|------|------|
| 历史人物 | 73 人 | 含生卒年、势力、头衔、描述 |
| 人物关系 | 166 条 | 家族 / 君臣 / 敌对 / 对手 / 联盟 |
| 历史事件 | 73 个 | 含地图动画配置、重要性等级 |
| 著作 | 43 部 | 兵法 / 文学 / 史学 / 思想 / 医学 |
| 地点 | 80+ 个 | 城市 / 关隘 / 战场，含经纬度坐标 |
| 势力 | 5 方 | 曹魏 / 蜀汉 / 东吴 / 东汉 / 其他 |
| 时间跨度 | 184-280 | 黄巾起义 → 西晋统一（96 年） |
| 省份归属 | 34 省 | 逐年势力归属数据 |

---

## 🎨 设计风格

项目采用**暗色古风主题**：

- **背景色**：`#0d1117`（深色）
- **主文字**：`#e8e0d0`（暖白）
- **强调色**：`#c9a96e`（金色）
- **势力色**：曹魏蓝 `#4A90D9` / 蜀汉红 `#D94A4A` / 东吴绿 `#4ADE80` / 东汉黄 `#D9A84A`

---

## 📄 License

MIT License

---

## 🙏 致谢

- [Leaflet](https://leafletjs.com/) — 开源地图引擎
- [React](https://react.dev/) — UI 框架
- [DeepSeek](https://platform.deepseek.com/) — AI 大模型
- 三国历史数据参考《三国志》《三国演义》等史料
