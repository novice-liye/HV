import React from 'react';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hover?: boolean;
  hoverColor?: string;
  padding?: number;
  style?: React.CSSProperties;
}

export function Card({ children, onClick, hover = false, hoverColor = '#c9a96e', padding = 16, style }: CardProps) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hover && hovered ? `${hoverColor}44` : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...(hover && hovered ? { background: 'rgba(255,255,255,0.05)', transform: 'translateY(-1px)' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
