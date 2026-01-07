import React, { useState } from 'react';
import { MiniChart } from './MiniChart';
import styles from './StatCard.module.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chart?: number[];
  color?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  subtitle,
  icon,
  trend,
  chart,
  color = '#667eea',
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.statCard} ${onClick ? styles.statCardClickable : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.statCardHeader}>
        <div className={styles.statCardIcon} style={{ backgroundColor: `${color}20` }}>
          <span className={styles.statCardIconInner}>{icon}</span>
        </div>
        {trend && (
          <div className={`${styles.trend} ${trend.isPositive ? styles.trendPositive : styles.trendNegative}`}>
            <span className={styles.trendIcon}>
              {trend.isPositive ? '↑' : '↓'}
            </span>
            <span className={styles.trendValue}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      <div className={styles.statCardContent}>
        <div className={styles.statCardValue}>{value}</div>
        <div className={styles.statCardTitle}>{title}</div>
        {subtitle && (
          <div className={styles.statCardSubtitle}>{subtitle}</div>
        )}
      </div>

      {chart && (
        <div className={styles.statCardChart}>
          <MiniChart data={chart} color={color} height={40} />
        </div>
      )}

      {isHovered && onClick && (
        <div className={styles.statCardOverlay}>
          <span className={styles.statCardOverlayText}>查看详情</span>
        </div>
      )}
    </div>
  );
});
