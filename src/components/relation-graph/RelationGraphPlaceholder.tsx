// ============================================================
// RelationGraphPlaceholder - 关系图模块占位组件
// ============================================================

import React, { useEffect, useState } from 'react';
import { eventBus } from '../../core/EventBus';

export const RelationGraphPlaceholder: React.FC = () => {
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);

  useEffect(() => {
    const unsubs = [
      eventBus.on('relation:focusNode', (payload) => {
        const nodeId = payload as string;
        setFocusedNode(nodeId);
      }, 'relation-graph-placeholder'),

      eventBus.on('relation:highlightNodes', (payload) => {
        const nodes = payload as string[];
        setHighlightedNodes(nodes);
      }, 'relation-graph-placeholder'),
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="module-placeholder module-placeholder--relation">
      <div className="module-placeholder__icon">🕸️</div>
      <h3 className="module-placeholder__title">关系图</h3>
      <p className="module-placeholder__desc">
        此模块将在后续开发中实现，支持人物关系、势力关系的可视化展示
      </p>
      <div className="module-placeholder__status">
        {focusedNode ? `聚焦节点: ${focusedNode}` : '等待交互...'}
      </div>
      {highlightedNodes.length > 0 && (
        <div className="module-placeholder__detail">
          <span>高亮节点: {highlightedNodes.join(', ')}</span>
        </div>
      )}
      <div className="module-placeholder__api">
        <span>接口: relation:focusNode | relation:highlightNodes</span>
      </div>
    </div>
  );
};
