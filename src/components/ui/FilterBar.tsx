import React from 'react';

interface FilterItem {
  key: string;
  label: string;
}

interface FilterBarProps {
  items: FilterItem[];
  activeKey: string;
  onChange: (key: string) => void;
  color?: string; // custom active color, defaults to gold
}

export function FilterBar({ items, activeKey, onChange, color }: FilterBarProps) {
  const c = color || '#c9a96e';
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map(item => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            style={{
              background: active ? `${c}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? `${c}55` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 4,
              padding: '5px 12px',
              color: active ? c : 'rgba(232,224,208,0.5)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
