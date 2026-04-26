import React, { useState, useMemo, useCallback } from 'react';
import { works, WORK_TYPE_LABELS, WORK_TYPE_COLORS, type Work } from '../../data/works';
import { eventBus } from '../../core/EventBus';

export function WorksGallery() {
  const [filterType, setFilterType] = useState<Work['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorks = useMemo(() => {
    return works.filter(w => {
      if (filterType !== 'all' && w.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return w.title.toLowerCase().includes(q) || w.author.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterType, searchQuery]);

  const handleWorkClick = useCallback((work: Work) => {
    eventBus.emit('works:selected', work, 'works-gallery');
    if (work.location) {
      eventBus.emit('map:flyTo', work.location.coordinate, 'works-gallery');
    }
  }, []);

  const types: Array<{ key: Work['type'] | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'military', label: '兵法' },
    { key: 'literature', label: '文学' },
    { key: 'history', label: '史学' },
    { key: 'philosophy', label: '思想' },
    { key: 'medical', label: '医学' },
    { key: 'other', label: '其他' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#e8e0d0', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          📚 三国时期著名著作
        </h2>
        <p style={{ color: 'rgba(232,224,208,0.5)', fontSize: '14px' }}>
          收录三国时期及相关的兵法、文学、史学、思想、医学等著作 · {works.length}部
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 搜索著作或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(201,169,110,0.2)',
            borderRadius: '6px',
            padding: '8px 14px',
            color: '#e8e0d0',
            fontSize: '14px',
            width: '220px',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {types.map(t => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              style={{
                background: filterType === t.key ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filterType === t.key ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '4px',
                padding: '5px 12px',
                color: filterType === t.key ? '#c9a96e' : 'rgba(232,224,208,0.6)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Works Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px',
      }}>
        {filteredWorks.map(work => (
          <div
            key={work.id}
            onClick={() => handleWorkClick(work)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.3)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <h3 style={{ color: '#e8e0d0', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                《{work.title}》
              </h3>
              <span style={{
                background: `${WORK_TYPE_COLORS[work.type]}22`,
                border: `1px solid ${WORK_TYPE_COLORS[work.type]}44`,
                borderRadius: '4px',
                padding: '2px 8px',
                color: WORK_TYPE_COLORS[work.type],
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}>
                {WORK_TYPE_LABELS[work.type]}
              </span>
            </div>
            <div style={{ color: 'rgba(232,224,208,0.5)', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#c9a96e' }}>{work.author}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span>{work.year < 0 ? `公元前${Math.abs(work.year)}年` : `${work.year}年`}</span>
              {work.location && (
                <>
                  <span style={{ margin: '0 8px' }}>·</span>
                  <span>📍 {work.location.name}</span>
                </>
              )}
            </div>
            <p style={{ color: 'rgba(232,224,208,0.7)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 8px' }}>
              {work.description}
            </p>
            <div style={{
              background: 'rgba(201,169,110,0.06)',
              borderLeft: `3px solid ${WORK_TYPE_COLORS[work.type]}`,
              borderRadius: '0 4px 4px 0',
              padding: '8px 12px',
              fontSize: '13px',
              color: 'rgba(232,224,208,0.5)',
            }}>
              ✦ {work.significance}
            </div>
          </div>
        ))}
      </div>

      {filteredWorks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(232,224,208,0.3)', fontSize: '16px' }}>
          没有找到匹配的著作
        </div>
      )}
    </div>
  );
}
