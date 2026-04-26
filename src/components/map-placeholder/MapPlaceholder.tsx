// ============================================================
// MapPlaceholder - 地图模块占位组件
// 预留接口，后续实现地图模块时替换
// ============================================================

import React, { useEffect, useState } from 'react';
import { eventBus } from '../../core/EventBus';
import type { GeoCoordinate, MapAnimationConfig } from '../../types';

export const MapPlaceholder: React.FC = () => {
  const [status, setStatus] = useState<string>('等待交互...');
  const [animation, setAnimation] = useState<MapAnimationConfig | null>(null);

  useEffect(() => {
    const unsubs = [
      eventBus.on('map:flyTo', (payload) => {
        const coord = payload as GeoCoordinate;
        setStatus(`飞往: ${coord.lat.toFixed(2)}, ${coord.lng.toFixed(2)}`);
      }, 'map-placeholder'),

      eventBus.on('map:playAnimation', (payload) => {
        const anim = payload as MapAnimationConfig;
        setAnimation(anim);
        setStatus(`播放动画: ${anim.type} (${anim.path.length}个路径点)`);
      }, 'map-placeholder'),

      eventBus.on('map:clearAnimation', () => {
        setAnimation(null);
        setStatus('等待交互...');
      }, 'map-placeholder'),
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="module-placeholder module-placeholder--map">
      <div className="module-placeholder__icon">🗺️</div>
      <h3 className="module-placeholder__title">地图模块</h3>
      <p className="module-placeholder__desc">
        此模块将在后续开发中实现，支持古地图展示、行军路线动画等功能
      </p>
      <div className="module-placeholder__status">
        状态: {status}
      </div>
      {animation && (
        <div className="module-placeholder__detail">
          <span>类型: {animation.type}</span>
          <span>路径点: {animation.path.length}</span>
          <span>时长: {animation.duration || 3000}ms</span>
        </div>
      )}
      <div className="module-placeholder__api">
        <span>接口: map:flyTo | map:playAnimation | map:clearAnimation</span>
      </div>
    </div>
  );
};
