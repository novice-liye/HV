// ============================================================
// AISearchPlaceholder - AI搜索模块占位组件
// ============================================================

import React, { useEffect, useState } from 'react';
import { eventBus } from '../../core/EventBus';

export const AISearchPlaceholder: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('ai:search', (payload) => {
      const q = payload as string;
      setQuery(q);
      setResult(`搜索"${q}"的结果将在此显示...`);
    }, 'ai-search-placeholder');

    return () => unsub();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      eventBus.emit('ai:search', query, 'ai-search-placeholder');
      setResult(`正在搜索"${query}"...`);
    }
  };

  return (
    <div className="module-placeholder module-placeholder--ai">
      <div className="module-placeholder__icon">🔍</div>
      <h3 className="module-placeholder__title">AI 搜索</h3>
      <div className="ai-search-box">
        <input
          type="text"
          className="ai-search-box__input"
          placeholder="搜索三国演义小说..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="ai-search-box__btn" onClick={handleSearch}>
          搜索
        </button>
      </div>
      {result && (
        <div className="ai-search-result">
          {result}
        </div>
      )}
      <div className="module-placeholder__api">
        <span>接口: ai:search | ai:result</span>
      </div>
    </div>
  );
};
