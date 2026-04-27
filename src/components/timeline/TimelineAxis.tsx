// ============================================================
// TimelineAxis - 时间轴刻度组件
// 显示年份刻度线和标签
// ============================================================

import React, { useMemo } from 'react';
import type { TimelineViewState } from '../../types';

interface TimelineAxisProps {
  viewState: TimelineViewState;
  yearToX: (year: number, width: number) => number;
  width: number;
}

/** 计算合适的刻度间隔 */
function getTickInterval(range: number): number {
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100];
  const ideal = range / 15;
  for (const c of candidates) {
    if (c >= ideal) return c;
  }
  return 100;
}

export const TimelineAxis: React.FC<TimelineAxisProps> = React.memo(({ viewState, yearToX, width }) => {
  const ticks = useMemo(() => {
    const range = viewState.viewEnd - viewState.viewStart;
    const interval = getTickInterval(range);
    const startTick = Math.ceil(viewState.viewStart / interval) * interval;
    const result: number[] = [];

    for (let year = startTick; year <= viewState.viewEnd; year += interval) {
      if (year >= 184 && year <= 290) {
        result.push(year);
      }
    }
    return result;
  }, [viewState]);

  const range = viewState.viewEnd - viewState.viewStart;
  const showSubTicks = range <= 30;

  // 根据可视范围动态调整字体大小，确保文字完整显示
  // 范围越大，刻度越密，字体适当缩小
  const majorFontSize = range > 80 ? 11 : range > 50 ? 12 : 13;
  const minorFontSize = range > 80 ? 9 : 10;

  return (
    <div className="timeline-axis" style={{ width }}>
      <svg width={width} height={52} className="timeline-axis-svg">
        {/* 主轴线 */}
        <line
          x1={0}
          y1={32}
          x2={width}
          y2={32}
          stroke="var(--color-gold)"
          strokeWidth={2}
          opacity={0.6}
        />
        {/* 刻度 */}
        {ticks.map(year => {
          const x = yearToX(year, width);
          const isMajor = year % 10 === 0 || range > 50;
          const fontSize = isMajor ? majorFontSize : minorFontSize;
          return (
            <g key={year}>
              <line
                x1={x}
                y1={isMajor ? 20 : 26}
                x2={x}
                y2={32}
                stroke="var(--color-gold)"
                strokeWidth={isMajor ? 2 : 1}
                opacity={isMajor ? 0.8 : 0.4}
              />
              <text
                x={x}
                y={isMajor ? 15 : 23}
                textAnchor="middle"
                fill="var(--color-gold)"
                fontSize={fontSize}
                fontFamily="var(--font-display)"
                fontWeight={isMajor ? 600 : 400}
                opacity={isMajor ? 1 : 0.6}
              >
                {year}
              </text>
              {/* 子刻度 */}
              {showSubTicks && isMajor && (
                Array.from({ length: 4 }, (_, i) => {
                  const subYear = year + (i + 1) * (range > 15 ? 1 : 0.5);
                  if (subYear > viewState.viewEnd || subYear > 290) return null;
                  const subX = yearToX(subYear, width);
                  return (
                    <line
                      key={subYear}
                      x1={subX}
                      y1={29}
                      x2={subX}
                      y2={32}
                      stroke="var(--color-gold)"
                      strokeWidth={0.5}
                      opacity={0.3}
                    />
                  );
                })
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

TimelineAxis.displayName = 'TimelineAxis';
