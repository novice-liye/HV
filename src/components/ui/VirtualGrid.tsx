import React, { useRef, useState, useCallback } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  columns: number;
  gap: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function VirtualGrid<T>({ items, renderItem, itemHeight, columns, gap, containerHeight, overscan = 2, className, style }: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const rows: React.ReactNode[] = [];
  for (let row = startRow; row < endRow; row++) {
    const rowItems: React.ReactNode[] = [];
    for (let col = 0; col < columns; col++) {
      const idx = row * columns + col;
      if (idx < items.length) {
        rowItems.push(
          <div key={idx} style={{ flex: '1 1 0', minWidth: 0 }}>
            {renderItem(items[idx], idx)}
          </div>
        );
      } else {
        rowItems.push(<div key={`empty-${col}`} style={{ flex: '1 1 0', minWidth: 0 }} />);
      }
    }
    rows.push(
      <div key={row} style={{
        display: 'flex', gap, height: itemHeight,
        marginBottom: row < endRow - 1 ? gap : 0,
      }}>
        {rowItems}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        overflowY: 'auto',
        height: containerHeight,
        ...style,
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startRow * rowHeight}px)` }}>
          {rows}
        </div>
      </div>
    </div>
  );
}
