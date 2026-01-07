/**
 * Stats Chart Component
 * 简单优雅的统计图表组件 - 使用 CSS 实现
 */

import React from 'react';
import styles from './StatsChart.module.css';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface StatsChartProps {
  data: ChartData[];
  title?: string;
  type?: 'bar' | 'donut';
  maxValue?: number;
  className?: string;
}

export const StatsChart: React.FC<StatsChartProps> = ({
  data,
  title,
  type = 'bar',
  maxValue,
  className = ''
}) => {
  const calculatedMax = maxValue || Math.max(...data.map(d => d.value), 1);

  if (type === 'donut') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className={`${styles.chartContainer} ${styles.donutChart} ${className}`}>
        {title && <h4 className={styles.chartTitle}>{title}</h4>}
        <div className={styles.donut}>
          <svg viewBox="0 0 100 100" className={styles.donutSvg}>
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const dashArray = `${percentage} ${100 - percentage}`;
              const angle = (currentAngle / 100) * 360;
              currentAngle += percentage;

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color || `var(--chart-color-${index + 1})`}
                  strokeWidth="10"
                  strokeDasharray={dashArray}
                  transform={`rotate(${angle - 90} 50 50)`}
                  className={styles.donutSegment}
                />
              );
            })}
          </svg>
          <div className={styles.donutCenter}>
            <span className={styles.donutValue}>{total}</span>
          </div>
        </div>
        <div className={styles.chartLegend}>
          {data.map((item, index) => (
            <div key={index} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: item.color || `var(--chart-color-${index + 1})` }}
              />
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chartContainer} ${styles.barChart} ${className}`}>
      {title && <h4 className={styles.chartTitle}>{title}</h4>}
      <div className={styles.barChartContent}>
        {data.map((item, index) => {
          const percentage = (item.value / calculatedMax) * 100;

          return (
            <div key={index} className={styles.barItem}>
              <div className={styles.barLabel}>{item.label}</div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || `var(--chart-color-${index + 1})`
                  }}
                />
              </div>
              <div className={styles.barValue}>{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface WeeklyActivityChartProps {
  data: number[];
  className?: string;
}

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  data,
  className = ''
}) => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const maxValue = Math.max(...data, 1);

  return (
    <div className={`${styles.chartContainer} ${className}`}>
      <h4 className={styles.chartTitle}>本周活动</h4>
      <div className={styles.activityChart}>
        <div className={styles.activityBars}>
          {data.map((value, index) => {
            const percentage = (value / maxValue) * 100;

            return (
              <div key={index} className={styles.activityBar}>
                <div
                  className={styles.activityBarFill}
                  style={{ height: `${percentage}%` }}
                  title={`${days[index]}: ${value} 次`}
                />
                <div className={styles.activityBarLabel}>{days[index]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsChart, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.type === nextProps.type &&
    prevProps.maxValue === nextProps.maxValue &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

export const WeeklyActivityChartMemo = React.memo(WeeklyActivityChart, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});
