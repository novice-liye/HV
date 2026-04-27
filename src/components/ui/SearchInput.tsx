import React, { useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => placeholder;
  placeholder?: string;
  width?: number | string;
  onCompositionStart?: () => void;
  onCompositionEnd?: (e: React.CompositionEvent<HTMLInputElement>) => void;
}

export function SearchInput({ value, onChange, placeholder = '🔍 搜索...', width = 220, onCompositionStart, onCompositionEnd }: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(201,169,110,0.2)',
        borderRadius: 6,
        padding: '8px 14px',
        color: '#e8e0d0',
        fontSize: 14,
        width: typeof width === 'number' ? width : width,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}
