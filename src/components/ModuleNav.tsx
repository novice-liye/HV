import React, { useState, useRef, useEffect } from 'react';
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
  { route: 'works', label: '著作', icon: '📚' },
  { route: 'person-gallery', label: '人物', icon: '👤' },
  { route: 'about', label: '关于', icon: 'ℹ️' },
];

export const ModuleNav: React.FC<ModuleNavProps> = ({ currentRoute }) => {
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // 点击外部关闭导航
  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [expanded]);

  // 路由变化时自动收起
  useEffect(() => {
    setExpanded(false);
  }, [currentRoute]);

  return (
    <nav
      ref={navRef}
      className={`module-nav ${expanded ? 'module-nav--expanded' : 'module-nav--collapsed'}`}
    >
      {/* 品牌区域 - 始终显示，点击展开/收缩 */}
      <button className="module-nav__brand" onClick={() => setExpanded(!expanded)} type="button">
        <span className="module-nav__brand-icon">⚔️</span>
        {expanded && <span className="module-nav__brand-text">三国志</span>}
      </button>

      {/* 导航链接 */}
      <div className="module-nav__links">
        {navItems.map(item => (
          <a
            key={item.route}
            href={routePaths[item.route]}
            className={`module-nav__link ${currentRoute === item.route ? 'module-nav__link--active' : ''}`}
            title={item.label}
          >
            <span className="module-nav__link-icon">{item.icon}</span>
            {expanded && <span className="module-nav__link-text">{item.label}</span>}
          </a>
        ))}
      </div>
    </nav>
  );
};
