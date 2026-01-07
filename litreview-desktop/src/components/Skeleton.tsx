/**
 * Skeleton Loading Component
 * 学术优雅主义骨架屏 - 提升加载体验
 */

import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

/**
 * Skeleton Component - 骨架屏加载占位符
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  animation = 'pulse'
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`${styles.skeleton} ${styles[variant]} ${styles[animation]}`}
          style={{
            width: width !== undefined ? typeof width === 'number' ? `${width}px` : width : undefined,
            height: height !== undefined ? typeof height === 'number' ? `${height}px` : height : undefined,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

/**
 * Text Skeleton - 文本骨架屏
 */
export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className={styles.textSkeleton}>
      <Skeleton variant="text" width="100%" />
      {lines > 1 && <Skeleton variant="text" width="90%" />}
      {lines > 2 && <Skeleton variant="text" width="60%" />}
    </div>
  );
};

/**
 * Card Skeleton - 卡片骨架屏
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className={styles.cardSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.cardItem}>
          <Skeleton variant="circular" width={48} height={48} />
          <div className={styles.cardContent}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="80%" height={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Stats Card Skeleton - 统计卡片骨架屏
 */
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsHeader}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="30%" />
      </div>
      <Skeleton variant="rectangular" width="100%" height={32} className={styles.statsValue} />
      <Skeleton variant="text" width="50%" />
      <Skeleton variant="rectangular" width="100%" height={40} className={styles.statsChart} />
    </div>
  );
};

/**
 * Table Skeleton - 表格骨架屏
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className={styles.tableSkeleton}>
      {/* Header */}
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={20} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="80%" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Content Skeleton - 内容骨架屏（用于ReviewGenerator等）
 */
export const ContentSkeleton: React.FC<{ withChart?: boolean }> = ({ withChart = true }) => {
  return (
    <div className={styles.contentSkeleton}>
      <Skeleton variant="text" width="30%" height={28} className={styles.title} />
      <Skeleton variant="text" width="60%" height={16} className={styles.subtitle} />

      <div className={styles.contentBody}>
        <TextSkeleton lines={8} />
      </div>

      {withChart && (
        <div className={styles.contentChart}>
          <Skeleton variant="rectangular" width="100%" height={200} />
        </div>
      )}
    </div>
  );
};

/**
 * Page Loading Skeleton - 整页加载骨架屏
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className={styles.pageSkeleton}>
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div style={{ marginTop: '2rem' }}>
        <StatsCardSkeleton />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <CardSkeleton count={3} />
      </div>
    </div>
  );
};

export default Skeleton;
