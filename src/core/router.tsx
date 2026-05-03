// ============================================================
// 简易 Hash 路由
// ============================================================

import { useState, useEffect, useCallback } from 'react';

export type Route = 'home' | 'timeline' | 'map' | 'ai-search' | 'relation-graph' | 'territory' | 'dashboard' | 'person-gallery' | 'battle-sandbox' | 'works' | 'novel-reader' | 'about';

const routeMap: Record<string, Route> = {
  '': 'home',
  '#timeline': 'timeline',
  '#map': 'map',
  '#ai-search': 'ai-search',
  '#relation-graph': 'relation-graph',
  '#territory': 'territory',
  '#dashboard': 'dashboard',
  '#person-gallery': 'person-gallery',
  '#battle-sandbox': 'battle-sandbox',
  '#works': 'works',
  '#novel-reader': 'novel-reader',
  '#about': 'about',
};

const reverseMap: Record<Route, string> = {
  'home': '#',
  'timeline': '#timeline',
  'map': '#map',
  'ai-search': '#ai-search',
  'relation-graph': '#relation-graph',
  'territory': '#territory',
  'dashboard': '#dashboard',
  'person-gallery': '#person-gallery',
  'battle-sandbox': '#battle-sandbox',
  'works': '#works',
  'novel-reader': '#novel-reader',
  'about': '#about',
};

export function useHashRouter() {
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash || '';
    return routeMap[hash] || 'home';
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash || '';
      setRoute(routeMap[hash] || 'home');
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((target: Route) => {
    window.location.hash = reverseMap[target];
  }, []);

  return { route, navigate };
}

export { reverseMap as routePaths };
