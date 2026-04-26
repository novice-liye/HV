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
          三国历史可视化
        </h1>
        <p style={{
          fontSize: '15px', color: 'rgba(232,224,208,0.4)', margin: 0,
        }}>
          多维度展示三国时期（184—280 AD）的历史脉络 · React + TypeScript + Leaflet
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* 项目简介 */}
        <Section title="📋 项目简介">
          <p>本项目是一个交互式三国历史可视化平台，涵盖时间线、地图疆域演变、人物关系图谱、AI智能问答等多个维度，旨在通过可视化手段让用户直观理解三国时期的历史脉络。</p>
          <p>项目采用纯前端架构，所有历史数据内置于代码中，无需后端服务即可运行。</p>
        </Section>

        {/* 技术栈 */}
        <Section title="⚙️ 技术栈">
          <TechGrid>
            <TechItem name="React 19" desc="UI 框架，组件化开发" />
            <TechItem name="TypeScript 6" desc="类型安全，提升代码质量" />
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
│   │   ├── battle-sandbox/     # ⚔️ 战役沙盘
│   │   ├── dashboard/          # 📊 数据仪表盘
│   │   ├── detail-panel/       # 📋 事件详情面板
│   │   ├── map-placeholder/    # 🗺️ 占位地图
│   │   ├── person-gallery/     # 👤 人物图鉴
│   │   ├── relation-graph/     # 🕸️ 人物关系图（Canvas 力导向）
│   │   ├── territory/          # 🗺️ 疆域演变地图（Leaflet）
│   │   ├── timeline/           # 📜 时间线（EventBar/Tracks/Axis）
│   │   ├── works/              # 📚 著作典籍
│   │   └── ModuleNav.tsx       # 导航栏组件
│   ├── core/                   # 核心模块
│   │   ├── EventBus.ts         # 事件总线（跨模块通信）
│   │   ├── router.tsx          # Hash 路由
│   │   └── navigation.ts       # 导航工具函数
│   ├── data/                   # 历史数据
│   │   ├── config.ts           # 全局配置
│   │   ├── events.ts           # 历史事件（73个）
│   │   ├── factions.ts         # 势力定义（魏蜀吴等）
│   │   ├── locations.ts        # 地点数据（80+个）
│   │   ├── persons.ts          # 人物数据（73人 + 166条关系）
│   │   ├── provinceFactions.ts # 省份势力归属时间线
│   │   ├── statistics.ts       # 统计数据
│   │   ├── territories.ts      # 疆域面积时间线
│   │   └── works.ts            # 著作数据（43部）
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
              desc="多轨道时间轴，支持事件筛选、详情面板、跨模块联动。包含 EventBar（事件条）、TimelineTracks（轨道容器）、TimelineAxis（时间轴）等子组件。" />
            <ModuleItem icon="🗺️" name="三国地图" route="#territory" status="已完成"
              desc="Leaflet 交互式地图，支持省份填色（势力归属）、地点标记、行军路线动画、时间轴播放（184-280年）。三图层切换：疆域/事件/著作。" />
            <ModuleItem icon="🕸️" name="人物关系图" route="#relation-graph" status="已完成"
              desc="Canvas 力导向图，73个人物节点 + 166条关系边。支持拼音搜索、势力筛选、节点聚焦高亮、缩放平移、详情面板。" />
            <ModuleItem icon="🔍" name="AI 搜索" route="#ai-search" status="已完成"
              desc="DeepSeek API 对话式AI助手。内置三国知识库（系统提示词压缩所有项目数据），支持联网搜索、SSE流式输出、IndexedDB对话记录管理。" />
            <ModuleItem icon="📚" name="著作典籍" route="#works" status="已完成"
              desc="43部三国时期著作展示（兵法/文学/史学/思想/医学），支持类型筛选、搜索。点击卡片可跳转地图定位。" />
            <ModuleItem icon="📊" name="数据仪表盘" route="#dashboard" status="已完成"
              desc="势力疆域面积变化图表、人口统计、战役数据可视化。" />
            <ModuleItem icon="👤" name="人物图鉴" route="#person-gallery" status="已完成"
              desc="人物卡片展示，支持势力筛选、年份筛选、搜索。点击人物可跳转关系图。" />
            <ModuleItem icon="⚔️" name="战役沙盘" route="#battle-sandbox" status="已完成"
              desc="战役模拟沙盘，展示兵力部署和战术布局。" />
          </ModuleList>
        </Section>

        {/* 数据规模 */}
        <Section title="📊 数据规模">
          <DataGrid>
            <DataItem label="人物" value="73 人" desc="含生卒年、势力、头衔、描述" />
            <DataItem label="关系边" value="166 条" desc="家族/君臣/敌对/对手/联盟" />
            <DataItem label="历史事件" value="73 个" desc="含地图动画配置、重要性等级" />
            <DataItem label="著作" value="43 部" desc="兵法/文学/史学/思想/医学" />
            <DataItem label="地点" value="80+ 个" desc="城市/关隘/战场，含坐标" />
            <DataItem label="势力" value="5 方" desc="曹魏/蜀汉/东吴/东汉/其他" />
            <DataItem label="时间跨度" value="184-280" desc="黄巾起义 → 西晋统一" />
            <DataItem label="省份归属" value="34 省" desc="逐年势力归属数据" />
          </DataGrid>
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
type Route = 'home' | 'timeline' | 'map' | 'ai-search'
  | 'relation-graph' | 'territory' | 'dashboard'
  | 'person-gallery' | 'battle-sandbox' | 'works' | 'about';

// 跨模块跳转
eventBus.emit('module:navigate', 'territory');`}</CodeBlock>
          </SubSection>

          <SubSection title="AI 系统">
            <p>AI 模块由三层组成：</p>
            <ol>
              <li><strong>systemPrompt.ts</strong> — 将所有项目数据（人物/事件/著作/地点/势力）压缩为结构化系统提示词</li>
              <li><strong>chatDB.ts</strong> — IndexedDB 对话记录管理（会话 CRUD + 消息 CRUD）</li>
              <li><strong>AISearchDemo.tsx</strong> — DeepSeek API 对话界面，支持 SSE 流式输出和联网搜索</li>
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

        {/* 项目愿景 - 放在最后，不显眼 */}
        <div style={{
          marginTop: '64px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          opacity: 0.5,
        }}>
          <Section title="关于这个项目">
            <p style={{ fontSize: '13px' }}>历史可视化：让过去成为你的人生导航</p>
            <p style={{ fontSize: '13px' }}>历史不是课本里枯燥的年份和人名，而是人类走过的所有路。我们做这个项目，就是想把这些路画成一张清晰的地图。</p>
            <p style={{ fontSize: '13px' }}>历史是人类最好的"错题本"。别人踩过的坑，我们没必要再踩一遍；别人走过的捷径，我们可以直接借鉴。</p>
            <p style={{ fontSize: '13px' }}>我们做这个项目，不是为了让你记住更多历史知识，而是为了让你从历史中学会思考。</p>
            <blockquote style={{
              borderLeft: '2px solid rgba(201,169,110,0.3)', margin: '16px 0', padding: '12px 16px',
              background: 'rgba(201,169,110,0.03)', borderRadius: '0 6px 6px 0',
              fontStyle: 'italic', fontSize: '13px', color: 'rgba(232,224,208,0.5)',
            }}>
              了解过去，是为了更好地过好现在；读懂历史，是为了更清晰地走向未来。
            </blockquote>
            <p style={{ fontSize: '13px', textAlign: 'center', color: 'rgba(232,224,208,0.3)' }}>
              历史已经发生，但未来仍在我们手中。让我们一起，以史为鉴，照亮前路。
            </p>
          </Section>
        </div>

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
