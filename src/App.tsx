import './styles/global.css';
import { useHashRouter, type Route } from './core/router';
import { eventBus } from './core/EventBus';
import { Timeline } from './components/timeline/Timeline';
import { AISearchDemo } from './components/ai-search/AISearchDemo';
import { RelationGraphDemo } from './components/relation-graph/RelationGraphDemo';
import { TerritoryEvolution } from './components/territory/TerritoryEvolution';
import { PersonGallery } from './components/person-gallery/PersonGallery';
import { WorksGallery } from './components/works/WorksGallery';
import { NovelReader } from './components/novel-reader/NovelReader';
import { AboutPage } from './components/about/AboutPage';
import { ModuleNav } from './components/ModuleNav';
import { useEffect } from 'react';

function App() {
  const { route, navigate } = useHashRouter();

  // 全局跨模块导航：任何模块都可发送 module:navigate 事件来跳转页面
  useEffect(() => {
    const unsub = eventBus.on('module:navigate', (payload) => {
      const targetRoute = payload as Route;
      if (targetRoute && targetRoute !== route) {
        navigate(targetRoute);
      }
    }, 'app-router');
    return unsub;
  }, [navigate, route]);

  return (
    <div className="app-root">
      <ModuleNav currentRoute={route} />
      <main className="app-content">
        {route === 'home' && <HomePage />}
        {route === 'timeline' && <Timeline />}
        {route === 'ai-search' && <AISearchDemo />}
        {route === 'relation-graph' && <RelationGraphDemo />}
        {route === 'territory' && <TerritoryEvolution />}
        {route === 'person-gallery' && <PersonGallery />}
        {route === 'works' && <WorksGallery />}
        {route === 'novel-reader' && <NovelReader />}
        {route === 'about' && <AboutPage />}
      </main>
    </div>
  );
}

function HomePage() {
  const { navigate } = useHashRouter();

  const modules = [
    {
      route: 'timeline' as Route,
      icon: '📜',
      title: '时间线',
      desc: '三国演义小说时间线，支持缩放、平移、事件筛选和详情查看',
      status: '已完成',
    },
    {
      route: 'ai-search' as Route,
      icon: '🔍',
      title: 'AI 搜索',
      desc: '智能搜索三国演义小说人物、事件、地点',
      status: 'Demo',
    },
    {
      route: 'relation-graph' as Route,
      icon: '🕸️',
      title: '关系图',
      desc: '人物与势力关系网络，力导向布局，点击节点查看详情并跳转',
      status: '已完成',
    },
    {
      route: 'territory' as Route,
      icon: '🗺️',
      title: '三国地图',
      desc: '交互式地图，支持疆域演变、地点详情、行军路线动画',
      status: '已完成',
    },
    {
      route: 'person-gallery' as Route,
      icon: '👤',
      title: '人物图鉴',
      desc: '三国人物百科，按势力筛选、年份过滤，查看人物关系与相关事件',
      status: '已完成',
    },
    {
      route: 'works' as Route,
      icon: '📚',
      title: '著作',
      desc: '三国时期著名著作，涵盖兵法、文学、史学、思想、医学等领域',
      status: '已完成',
    },
    {
      route: 'novel-reader' as Route,
      icon: '📖',
      title: '小说阅读器',
      desc: '上传小说文件，按章节拆分，支持全文搜索和点击跳转',
      status: '新',
    },
    {
      route: 'about' as Route,
      icon: 'ℹ️',
      title: '关于项目',
      desc: '了解我们的理念与愿景',
      status: '新',
    },
  ];

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-hero__title">三国演义小说可视化</h1>
        <p className="home-hero__subtitle">
          多维度展示三国时期（184—280 AD）的历史脉络
        </p>
      </div>
      <div className="home-modules">
        {modules.map(m => (
          <div
            key={m.route}
            className="home-module-card"
            onClick={() => navigate(m.route)}
          >
            <div className="home-module-card__icon">{m.icon}</div>
            <div className="home-module-card__info">
              <h3 className="home-module-card__title">{m.title}</h3>
              <p className="home-module-card__desc">{m.desc}</p>
            </div>
            <span className={`home-module-card__status home-module-card__status--${m.status === '已完成' ? 'done' : 'demo'}`}>
              {m.status}
            </span>
          </div>
        ))}
      </div>
      <div className="home-footer">
        <p>模块间通过 EventBus 通信，支持独立开发和测试</p>
      </div>
    </div>
  );
}

export default App;
