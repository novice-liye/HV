import React from 'react';

interface BadgeProps {
  label: string;
  color: string;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span style={{
      background: `${color}22`,
      border: `1px solid ${color}44`,
      borderRadius: 4,
      padding: '2px 8px',
      color,
      fontSize: 12,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
