import React from 'react';

interface PageHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  titleColor?: string;
}

export function PageHeader({ icon, title, subtitle, align = 'center', titleColor = '#c9a96e' }: PageHeaderProps) {
  return (
    <div style={{ textAlign: align, marginBottom: 24 }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>}
      <h2 style={{ fontSize: 24, fontWeight: 700, color: titleColor, margin: '0 0 4px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'rgba(232,224,208,0.4)', margin: 0 }}>{subtitle}</p>}
    </div>
  );
}
