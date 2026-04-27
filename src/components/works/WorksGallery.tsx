import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader, SearchInput, FilterBar, Card, Badge, VirtualGrid } from '../ui';
import { works, WORK_TYPE_LABELS, WORK_TYPE_COLORS, type Work } from '../../data/cache';
import { eventBus } from '../../core/EventBus';

const types = [
  { key: 'all', label: '全部' },
  { key: 'military', label: '兵法' },
  { key: 'literature', label: '文学' },
  { key: 'history', label: '史学' },
  { key: 'philosophy', label: '思想' },
  { key: 'medical', label: '医学' },
  { key: 'other', label: '其他' },
];

export function WorksGallery() {
  const [filterType, setFilterType] = useState<Work['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [containerHeight, setContainerHeight] = useState(() => window.innerHeight - 200);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight - 200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ESC 关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedWork) {
        setSelectedWork(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWork]);

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
    setSelectedWork(work);
    eventBus.emit('works:selected', work, 'works-gallery');
    if (work.location) {
      eventBus.emit('map:flyTo', work.location.coordinate, 'works-gallery');
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedWork(null);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedWork(null);
    }
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        icon="📚"
        title="三国时期著名著作"
        subtitle={`收录三国时期及相关的兵法、文学、史学、思想、医学等著作 · ${works.length}部`}
        align="left"
      />

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="🔍 搜索著作或作者..."
        />
        <FilterBar
          items={types}
          activeKey={filterType}
          onChange={(key) => setFilterType(key as Work['type'] | 'all')}
        />
      </div>

      {/* Works Grid */}
      {filteredWorks.length > 0 ? (
        <VirtualGrid
          items={filteredWorks}
          renderItem={(work) => (
            <Card key={work.id} onClick={() => handleWorkClick(work)} hover padding={20} style={{ height: '100%', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ color: '#e8e0d0', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                  《{work.title}》
                </h3>
                <Badge label={WORK_TYPE_LABELS[work.type]} color={WORK_TYPE_COLORS[work.type]} />
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
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'rgba(232,224,208,0.3)' }}>查看详情 →</span>
              </div>
            </Card>
          )}
          itemHeight={220}
          columns={2}
          gap={16}
          containerHeight={containerHeight}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(232,224,208,0.3)', fontSize: '16px' }}>
          没有找到匹配的著作
        </div>
      )}

      {/* Detail Modal */}
      {selectedWork && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(145deg, #1e1e2e 0%, #16161f 100%)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(201,169,110,0.08)',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'rgba(232,224,208,0.6)',
                fontSize: '18px',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = '#e8e0d0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,224,208,0.6)';
              }}
            >
              ✕
            </button>

            {/* Title */}
            <h2 style={{
              color: '#e8e0d0',
              fontSize: '26px',
              fontWeight: 700,
              margin: '0 0 16px',
              lineHeight: 1.3,
            }}>
              《{selectedWork.title}》
            </h2>

            {/* Author / Year / Type */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: '#c9a96e', fontSize: '15px', fontWeight: 500 }}>
                {selectedWork.author}
              </span>
              <span style={{ color: 'rgba(232,224,208,0.3)' }}>·</span>
              <span style={{ color: 'rgba(232,224,208,0.6)', fontSize: '14px' }}>
                {selectedWork.year < 0 ? `公元前${Math.abs(selectedWork.year)}年` : `${selectedWork.year}年`}
              </span>
              <Badge
                label={WORK_TYPE_LABELS[selectedWork.type]}
                color={WORK_TYPE_COLORS[selectedWork.type]}
              />
            </div>

            {/* Location */}
            {selectedWork.location && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                color: 'rgba(232,224,208,0.5)',
                fontSize: '14px',
              }}>
                <span>📍</span>
                <span>{selectedWork.location.name}</span>
              </div>
            )}

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)',
              margin: '16px 0 20px',
            }} />

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                color: 'rgba(232,224,208,0.5)',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 8px',
              }}>
                内容简介
              </h4>
              <p style={{
                color: 'rgba(232,224,208,0.8)',
                fontSize: '15px',
                lineHeight: 1.8,
                margin: 0,
              }}>
                {selectedWork.description}
              </p>
            </div>

            {/* Significance */}
            <div style={{
              background: `rgba(${selectedWork.type === 'military' ? '217,74,74' : selectedWork.type === 'literature' ? '74,144,217' : selectedWork.type === 'history' ? '217,168,74' : selectedWork.type === 'philosophy' ? '139,92,246' : selectedWork.type === 'medical' ? '74,222,128' : '156,163,175'},0.08)`,
              borderLeft: `3px solid ${WORK_TYPE_COLORS[selectedWork.type]}`,
              borderRadius: '0 8px 8px 0',
              padding: '14px 16px',
              marginBottom: '24px',
            }}>
              <h4 style={{
                color: 'rgba(232,224,208,0.5)',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 6px',
              }}>
                历史意义
              </h4>
              <p style={{
                color: 'rgba(232,224,208,0.7)',
                fontSize: '14px',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {selectedWork.significance}
              </p>
            </div>

            {/* Read Online Button */}
            {selectedWork.readUrl && (
              <a
                href={selectedWork.readUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #4A90D9 0%, #357ABD 100%)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(74,144,217,0.3)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(74,144,217,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(74,144,217,0.3)';
                }}
              >
                📖 阅读原著
                <span style={{ fontSize: '12px', opacity: 0.7 }}>↗</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
