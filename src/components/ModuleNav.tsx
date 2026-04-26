import React from 'react';
import type { Route } from '../core/router';
import { routePaths } from '../core/router';

interface ModuleNavProps {
  currentRoute: Route;
}

const navItems: { route: Route; label: string; icon: string }[] = [
  { route: 'home', label: '首页', icon: '🏠' },
  { route: 'timeline', label: '时间线', icon: '📜' },
  { route: 'ai-search', label: 'AI搜索', icon: '🔍' },
  { route: 'relation-graph', label: '关系图', icon: '🕸️' },
  { route: 'territory', label: '地图', icon: '🗺️' },
  { route: 'dashboard', label: '仪表盘', icon: '📊' },
  { route: 'works', label: '著作', icon: '📚' },
  { route: 'person-gallery', label: '人物', icon: '👤' },
  { route: 'battle-sandbox', label: '战役', icon: '⚔️' },
  { route: 'about', label: '关于', icon: 'ℹ️' },
];

export const ModuleNav: React.FC<ModuleNavProps> = ({ currentRoute }) => {
  return (
    <nav className="module-nav">
      <div className="module-nav__brand">
        <span className="module-nav__brand-icon">⚔️</span>
        <span className="module-nav__brand-text">三国志</span>
      </div>
      <div className="module-nav__links">
        {navItems.map(item => (
          <a
            key={item.route}
            href={routePaths[item.route]}
            className={`module-nav__link ${currentRoute === item.route ? 'module-nav__link--active' : ''}`}
          >
            <span className="module-nav__link-icon">{item.icon}</span>
            <span className="module-nav__link-text">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};
