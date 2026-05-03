import React from 'react';

export function AboutPage() {
  return (
    <div style={{ minHeight: '100%', background: '#0d1117', color: '#e8e0d0' }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '60px 20px 40px',
        background: 'linear-gradient(180deg, rgba(201,169,110,0.08) 0%, transparent 100%)',
      }}>
        <h1 style={{
          fontSize: '32px', fontWeight: 700, margin: '0 0 12px',
          background: 'linear-gradient(135deg, #c9a96e, #e8d5a3, #c9a96e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1.4,
        }}>
          三国演义小说可视化
        </h1>
        <p style={{
          fontSize: '15px', color: 'rgba(232,224,208,0.4)', margin: 0,
        }}>
          多维度展示三国时期（184—280 AD）的历史脉络 · React + TypeScript + Leaflet
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* AI 声明 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
          border: '1px solid rgba(201,169,110,0.2)',
          borderRadius: '10px',
          padding: '20px 24px',
          marginBottom: '32px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#c9a96e', marginBottom: '10px' }}>
            ⚠️ 重要声明
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '14px', lineHeight: 1.8, color: 'rgba(232,224,208,0.65)' }}>
            本项目是一个<strong style={{ color: '#e8e0d0' }}>完全由 AI 生成</strong>的项目。包括但不限于：
          </p>
          <ul style={{ margin: '0 0 10px', paddingLeft: '20px', fontSize: '14px', lineHeight: 2, color: 'rgba(232,224,208,0.55)' }}>
            <li><strong style={{ color: '#e8e0d0' }}>项目代码</strong> — 所有前端代码（React/TypeScript/CSS）均由 AI 编写</li>
            <li><strong style={{ color: '#e8e0d0' }}>历史数据</strong> — 人物信息、事件描述、著作数据、地理坐标等均由 AI 联网搜索获取</li>
            <li><strong style={{ color: '#e8e0d0' }}>UI/UX 设计</strong> — 界面布局、交互设计、视觉风格均由 AI 完成</li>
            <li><strong style={{ color: '#e8e0d0' }}>项目架构</strong> — 技术选型、模块划分、数据结构设计均由 AI 决策</li>
          </ul>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: 'rgba(232,224,208,0.55)' }}>
            所有历史数据<strong style={{ color: '#e8e0d0' }}>未经过专业历史学者的严格审核</strong>，
            可能存在部分偏差、错误或不准确之处。本项目仅供学习、交流和娱乐参考，不作为学术研究或历史考证的依据。
            如发现数据错误，欢迎指正。
          </p>
        </div>

        {/* 项目简介 */}
        <Section title="📋 项目简介">
          <p>本项目是一个交互式三国演义小说可视化平台，涵盖时间线、地图疆域演变、人物关系图谱、AI智能问答等多个维度，旨在通过可视化手段让用户直观理解三国时期的历史脉络。</p>
          <p>项目采用纯前端架构，所有历史数据内置于代码中，无需后端服务即可运行。支持 PC 端和移动端访问。</p>
        </Section>

        {/* 技术栈 */}
        <Section title="⚙️ 技术栈">
          <TechGrid>
            <TechItem name="React 19" desc="UI 框架，组件化开发" />
            <TechItem name="TypeScript" desc="类型安全，提升代码质量" />
            <TechItem name="Vite" desc="构建工具，快速热更新" />
            <TechItem name="Leaflet" desc="交互式地图引擎" />
            <TechItem name="React-Leaflet" desc="React 地图组件绑定" />
            <TechItem name="Canvas API" desc="力导向关系图绘制" />
            <TechItem name="IndexedDB" desc="AI对话记录持久化" />
            <TechItem name="DeepSeek API" desc="AI 大模型智能问答" />
            <TechItem name="EventBus" desc="跨模块事件通信" />
            <TechItem name="CSS Variables" desc="主题系统，暗色古风" />
          </TechGrid>
        </Section>

        {/* 项目结构 */}
        <Section title="📂 项目结构">
          <CodeBlock>{`three-kingdoms-timeline/
├── public/
│   ├── china_provinces.json    # 中国省份 GeoJSON 数据
│   └── favicon.svg
├── src/
│   ├── ai/                     # AI 模块
│   │   ├── systemPrompt.ts     # 系统提示词（压缩项目数据）
│   │   └── chatDB.ts           # IndexedDB 对话记录管理
│   ├── components/             # 组件模块
│   │   ├── about/              # ℹ️ 关于页面
│   │   ├── ai-search/          # 🔍 AI 搜索（DeepSeek 对话）
│   │   ├── battle-sandbox/     # ⚔️ 战斗沙盘（战役回放）
│   │   ├── dashboard/          # 📊 数据仪表盘
│   │   ├── detail-panel/       # 📋 事件详情面板
│   │   ├── map-placeholder/    # 🗺️ 地图占位组件
│   │   ├── person-gallery/     # 👤 人物图鉴
│   │   ├── relation-graph/     # 🕸️ 人物关系图（Canvas 力导向）
│   │   ├── territory/          # 🗺️ 疆域演变地图（Leaflet）
│   │   ├── timeline/           # 📜 时间线（EventBar/Tracks/Axis）
│   │   ├── ui/                 # 🧩 通用UI组件库（Badge/Card/FilterBar 等）
│   │   ├── works/              # 📚 著作典籍
│   │   └── ModuleNav.tsx       # 导航栏组件（可折叠）
│   ├── core/                   # 核心模块
│   │   ├── EventBus.ts         # 事件总线（跨模块通信）
│   │   ├── router.tsx          # Hash 路由
│   │   └── navigation.ts       # 导航工具函数
│   ├── data/                   # 历史数据
│   │   ├── config.ts           # 全局配置
│   │   ├── events.ts           # 历史事件（73个）
│   │   ├── factions.ts         # 势力定义（魏蜀吴等）
│   │   ├── locations.ts        # 地点数据（94个）
│   │   ├── persons.ts          # 人物数据（123人 + 254条关系）
│   │   ├── provinceFactions.ts # 省份势力归属时间线
│   │   ├── statistics.ts       # 统计数据
│   │   ├── territories.ts      # 疆域面积时间线
│   │   └── works.ts            # 著作数据（36部）
│   ├── hooks/                  # 自定义 Hooks
│   │   └── useTimeline.ts      # 时间线状态管理
│   ├── styles/
│   │   └── global.css          # 全局样式（暗色古风主题）
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── App.tsx                 # 应用入口 + 路由渲染
│   └── main.tsx                # React 挂载
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts`}</CodeBlock>
        </Section>

        {/* 模块说明 */}
        <Section title="🧩 功能模块">
          <ModuleList>
            <ModuleItem icon="📜" name="时间线" route="#timeline" status="已完成"
              desc="多轨道时间轴（184-290年），支持事件筛选、缩放平移、详情面板、跨模块联动。控制面板可折叠，轨道区域支持垂直滚动。事件条显示年份标签。新增事件搜索（支持标题/描述/人物/地点/年份/拼音多维度搜索）、搜索高亮（白色边框闪烁+其他事件变暗）、全屏模式。" />
            <ModuleItem icon="🗺️" name="三国地图" route="#territory" status="已完成"
              desc="Leaflet 交互式地图，支持省份填色（势力归属）、地点标记（缩放自适应）、行军路线动画、时间轴播放（184-280年）。三图层切换：疆域/事件/著作。动画播放时自动高亮关联地点。新增颜色图例（放在地图外部避免遮挡）、著作标记（36部全部有坐标，点击弹出详情+原著阅读链接）。" />
            <ModuleItem icon="🕸️" name="人物关系图" route="#relation-graph" status="已完成"
              desc="Canvas 力导向图，123个人物节点 + 254条关系边。支持拼音搜索、势力筛选、节点聚焦高亮、缩放平移、详情面板。双人关系路径搜索（BFS最短路径）。新增全屏模式（Fullscreen API）。" />
            <ModuleItem icon="🔍" name="AI 搜索" route="#ai-search" status="已完成"
              desc="DeepSeek API 对话式AI助手。内置三国知识库（系统提示词压缩所有项目数据），支持联网搜索、SSE流式输出、IndexedDB对话记录管理。新增思考过程显示（DeepSeek reasoning_content 可折叠展示）、停止生成后内容保存。" />
            <ModuleItem icon="📚" name="著作典籍" route="#works" status="已完成"
              desc="36部三国时期著作展示（兵法/文学/史学/思想/医学），支持类型筛选、搜索。点击卡片弹出详情弹窗（模态框），显示完整信息+原著阅读链接。已清理非三国时期著作。" />
            <ModuleItem icon="👤" name="人物图鉴" route="#person-gallery" status="已完成"
              desc="123位三国人物卡片展示，支持势力筛选、年份筛选、搜索。点击人物可跳转关系图。覆盖魏蜀吴及其他势力的重要武将、谋士、文臣等。已修复年龄显示（缺失生卒年显示为?而非默认值）。" />
            <ModuleItem icon="⚔️" name="战斗沙盘" route="#battle-sandbox" status="已完成"
              desc="战役沙盘模块，战场地图 + 战役选择列表 + 行军/战役动画回放 + 参战势力/人物展示。通过 EventBus 与时间线/人物图鉴/地图模块双向联动。" />
            <ModuleItem icon="📊" name="数据仪表盘" route="#dashboard" status="已完成"
              desc="4 个图表面板：事件分类、势力兵力、人口趋势、疆域面积。消费所有模块数据，通过 EventBus 双向联动。" />
            <ModuleItem icon="ℹ️" name="关于项目" route="#about" status="已完成"
              desc="项目介绍、技术栈、数据规模、核心架构说明。" />
          </ModuleList>
        </Section>

        {/* 数据规模 */}
        <Section title="📊 数据规模">
          <DataGrid>
            <DataItem label="人物" value="123 人" desc="含生卒年、势力、头衔、描述" />
            <DataItem label="关系边" value="254 条" desc="家族/君臣/敌对/对手/联盟" />
            <DataItem label="历史事件" value="73 个" desc="含地图动画配置、重要性等级" />
            <DataItem label="著作" value="36 部" desc="兵法/文学/史学/思想/医学" />
            <DataItem label="地点" value="94 个" desc="城市/关隘/战场/都城，含坐标" />
            <DataItem label="势力" value="5 方" desc="曹魏/蜀汉/东吴/东汉/其他" />
            <DataItem label="时间跨度" value="184-280" desc="黄巾起义 → 西晋统一" />
            <DataItem label="省份归属" value="34 省" desc="逐年势力归属数据" />
          </DataGrid>
        </Section>

        {/* 交互设计 */}
        <Section title="🎮 交互设计">
          <SubSection title="时间线控制">
            <p>时间线支持多种交互方式，适配 PC 端和移动端：</p>
            <CodeBlock>{`PC 端：
  · 鼠标滚轮 → 缩放时间轴（以鼠标位置为锚点）
  · Ctrl + 滚轮 → 精细缩放
  · 鼠标左键拖拽 → 水平平移（画布+轨道区域统一）
  · Shift + 滚轮 → 轨道区域垂直滚动
  · 方向键 ← → ↑ ↓ → 水平平移时间轴
  · +/- 键 → 缩放
  · Home / End → 跳转到起始/结束年份
  · Esc → 重置视图

移动端：
  · 单指滑动 → 水平平移时间轴
  · 双指捏合 → 缩放时间轴
  · 轨道区域原生垂直滚动`}</CodeBlock>
          </SubSection>

          <SubSection title="地图交互">
            <p>地图支持缩放自适应显示，不同缩放级别下地点标记和著作标记的大小、字体、标签可见性会自动调整：</p>
            <CodeBlock>{`缩放自适应规则：
  · 地点标记：缩放比例 0.65x ~ 1.4x
  · 著作标记：图标 14-22px，字体 11-13px
  · 标签可见性：
    - 都城/战场 → 始终显示
    - 关隘 → zoom ≥ 5
    - 城市 → zoom ≥ 5
  · 动画播放时 → 自动高亮关联地点（脉冲发光效果）
  · 控制面板 → 可折叠，节省地图显示空间`}</CodeBlock>
          </SubSection>

          <SubSection title="人物关系图">
            <CodeBlock>{`交互功能：
  · 点击节点 → 聚焦并高亮第一层关系
  · 拖拽节点 → 自由移动位置
  · 搜索框 → 支持中文/拼音搜索人物
  · 势力筛选 → 按魏/蜀/吴筛选显示
  · 关系路径搜索 → 输入两个人名，BFS 找最短连接路径
  · 详情面板 → 浮动覆盖层，显示关系列表和相关事件
  · 全屏模式 → Fullscreen API，沉浸式浏览关系图
  · 跨模块跳转 → 人物图鉴、时间线`}</CodeBlock>
          </SubSection>
        </Section>

        {/* 核心架构 */}
        <Section title="🏗️ 核心架构">
          <SubSection title="跨模块通信 — EventBus">
            <p>所有模块通过自定义 <code style={codeStyle}>EventBus</code> 进行松耦合通信，支持事件监听、发送和取消订阅。</p>
            <CodeBlock>{`// 发送事件
eventBus.emit('event:selected', event, 'timeline');

// 监听事件
eventBus.on('event:selected', (payload) => {
  // 处理事件...
}, 'territory-map');`}</CodeBlock>
            <p style={{ marginTop: 12 }}>主要事件类型：</p>
            <EventTable />
          </SubSection>

          <SubSection title="路由系统 — Hash Router">
            <p>基于 <code style={codeStyle}>window.location.hash</code> 的轻量路由，支持模块间导航跳转。</p>
            <CodeBlock>{`// 路由定义
type Route = 'home' | 'timeline' | 'ai-search'
  | 'relation-graph' | 'territory'
  | 'person-gallery' | 'works' | 'about';

// 跨模块跳转
eventBus.emit('module:navigate', 'territory');`}</CodeBlock>
          </SubSection>

          <SubSection title="AI 系统">
            <p>AI 模块由三层组成：</p>
            <ol>
              <li><strong>systemPrompt.ts</strong> — 将所有项目数据（人物/事件/著作/地点/势力）压缩为结构化系统提示词</li>
              <li><strong>chatDB.ts</strong> — IndexedDB 对话记录管理（会话 CRUD + 消息 CRUD）</li>
              <li><strong>AISearchDemo.tsx</strong> — DeepSeek API 对话界面，支持 SSE 流式输出、联网搜索、思考过程显示（DeepSeek reasoning_content 可折叠展示）、停止生成后内容保存</li>
            </ol>
          </SubSection>
        </Section>

        {/* 快速开始 */}
        <Section title="🚀 快速开始">
          <CodeBlock>{`# 克隆项目
git clone <repo-url>
cd three-kingdoms-timeline

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview`}</CodeBlock>
          <p style={{ marginTop: 12 }}>AI 搜索功能需要用户自行提供 DeepSeek API Key（在 AI 搜索页面点击"设置Key"按钮配置）。</p>
        </Section>

      </div>
    </div>
  );
}

/* ===== Sub Components ===== */

const codeStyle: React.CSSProperties = {
  background: 'rgba(201,169,110,0.1)', padding: '2px 6px', borderRadius: '4px',
  fontSize: '13px', fontFamily: '"Fira Code", monospace', color: '#c9a96e',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '20px', fontWeight: 600, color: '#c9a96e', marginBottom: '16px',
        paddingBottom: '10px', borderBottom: '1px solid rgba(201,169,110,0.12)',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(232,224,208,0.7)' }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '16px', fontWeight: 600, color: '#e8e0d0', marginBottom: '10px',
      }}>
        {title}
      </h3>
      <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(232,224,208,0.65)' }}>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '8px', padding: '16px', margin: '12px 0',
      fontSize: '13px', lineHeight: 1.6, overflowX: 'auto',
      fontFamily: '"Fira Code", "Cascadia Code", monospace',
      color: 'rgba(232,224,208,0.65)',
    }}>
      {children}
    </pre>
  );
}

function TechGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '10px', marginTop: '12px',
    }}>
      {children}
    </div>
  );
}

function TechItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontWeight: 600, fontSize: '13px', color: '#e8e0d0' }}>{name}</span>
      <span style={{ fontSize: '12px', color: 'rgba(232,224,208,0.4)' }}>{desc}</span>
    </div>
  );
}

function ModuleList({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
      {children}
    </div>
  );
}

function ModuleItem({ icon, name, route, status, desc }: {
  icon: string; name: string; route: string; status: string; desc: string;
}) {
  return (
    <div style={{
      padding: '16px', borderRadius: '8px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#e8e0d0' }}>{name}</span>
          <code style={codeStyle}>{route}</code>
        </div>
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
          background: status === '已完成' ? 'rgba(74,222,128,0.1)' : 'rgba(201,169,110,0.1)',
          color: status === '已完成' ? '#4ADE80' : '#c9a96e',
          border: `1px solid ${status === '已完成' ? 'rgba(74,222,128,0.2)' : 'rgba(201,169,110,0.2)'}`,
        }}>
          {status}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(232,224,208,0.5)', lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '10px', marginTop: '12px',
    }}>
      {children}
    </div>
  );
}

function DataItem({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div style={{
      padding: '14px', borderRadius: '6px', textAlign: 'center',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#c9a96e' }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8e0d0', marginTop: '4px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: 'rgba(232,224,208,0.35)', marginTop: '2px' }}>{desc}</div>
    </div>
  );
}

function EventTable() {
  const events = [
    { event: 'event:selected', desc: '选中历史事件', sources: '时间线/地图/详情面板' },
    { event: 'map:flyTo', desc: '地图飞到指定坐标', sources: '详情面板/人物图鉴' },
    { event: 'map:playAnimation', desc: '播放地图动画', sources: '详情面板/AI搜索' },
    { event: 'relation:focusNode', desc: '聚焦关系图节点', sources: 'AI搜索/人物图鉴' },
    { event: 'relation:highlightNodes', desc: '高亮多个节点', sources: '时间线' },
    { event: 'module:navigate', desc: '跨模块导航跳转', sources: '所有模块' },
    { event: 'ai:search', desc: 'AI搜索请求', sources: '外部模块' },
    { event: 'works:selected', desc: '选中著作', sources: '著作模块' },
    { event: 'territory:yearChange', desc: '地图年份变化', sources: '时间线联动' },
    { event: 'timeline:viewChange', desc: '时间线视图变化', sources: '地图联动' },
  ];
  return (
    <div style={{ overflowX: 'auto', marginTop: '8px' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse', fontSize: '12px',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden',
      }}>
        <thead>
          <tr style={{ background: 'rgba(201,169,110,0.08)' }}>
            <th style={{ ...thStyle, textAlign: 'left' }}>事件名</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>说明</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>来源</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={e.event} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <td style={tdStyle}><code style={codeStyle}>{e.event}</code></td>
              <td style={tdStyle}>{e.desc}</td>
              <td style={{ ...tdStyle, color: 'rgba(232,224,208,0.4)' }}>{e.sources}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px', fontWeight: 600, color: '#c9a96e',
  borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '12px',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)',
  color: 'rgba(232,224,208,0.65)',
};
