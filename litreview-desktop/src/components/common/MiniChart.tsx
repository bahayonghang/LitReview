import React from 'react';
import styles from './MiniChart.module.css';

export interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color,
  height = 60
}) => {
  const maxValue = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - value) / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  // Create a safe ID for gradient
  const gradientId = `gradient-${color.replace(/[^a-zA-Z0-9-]/g, '')}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={styles.miniChart} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={styles.miniChartSvg}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#${gradientId})`}
          className={styles.miniChartFill}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className={styles.miniChartLine}
        />
      </svg>
    </div>
  );
};
