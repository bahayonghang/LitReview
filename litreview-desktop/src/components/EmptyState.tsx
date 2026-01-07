/**
 * Empty State Component
 * 空状态组件 - 为空数据提供友好的提示和引导
 */

import React from 'react';
import {
  DocumentIcon,
  SparklesIcon,
  SettingsIcon,
  HistoryIcon,
  SearchIcon,
} from './icons';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'not-configured' | 'no-history' | 'no-templates';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Empty State Component - 空状态展示
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  size = 'medium'
}) => {
  const getDefaultConfig = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: <DocumentIcon size={48} />,
          title: title || '暂无数据',
          description: description || '还没有任何数据，开始您的第一次操作吧！'
        };
      case 'no-results':
        return {
          icon: <SearchIcon size={48} />,
          title: title || '未找到结果',
          description: description || '没有找到匹配的结果，请尝试其他搜索条件。'
        };
      case 'not-configured':
        return {
          icon: <SettingsIcon size={48} />,
          title: title || '需要配置',
          description: description || '请先配置API密钥以使用此功能。'
        };
      case 'no-history':
        return {
          icon: <HistoryIcon size={48} />,
          title: title || '暂无历史记录',
          description: description || '您的操作历史将显示在这里。'
        };
      case 'no-templates':
        return {
          icon: <SparklesIcon size={48} />,
          title: title || '暂无模板',
          description: description || '还没有可用的模板。'
        };
      default:
        return {
          icon: <DocumentIcon size={48} />,
          title: title || '暂无数据',
          description: description || '还没有任何数据。'
        };
    }
  };

  const config = getDefaultConfig();

  return (
    <div className={`${styles.emptyState} ${styles[size]}`}>
      <div className={styles.emptyStateIcon}>
        {illustration || config.icon}
      </div>

      <h3 className={styles.emptyStateTitle}>
        {config.title}
      </h3>

      <p className={styles.emptyStateDescription}>
        {config.description}
      </p>

      {actionLabel && onAction && (
        <button
          className={styles.emptyStateAction}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Quick Empty States - 预定义的常用空状态
 */
export const NoDataEmpty: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    type="no-data"
    title="暂无内容"
    description="还没有任何内容，点击下方按钮开始创建吧！"
    actionLabel="开始创建"
    onAction={onAction}
  />
);

export const NoResultsEmpty: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    type="no-results"
    title="未找到结果"
    description="没有找到匹配的内容，请尝试其他搜索条件。"
    actionLabel="清除筛选"
    onAction={onAction}
  />
);

export const NotConfiguredEmpty: React.FC<{ onConfig?: () => void }> = ({ onConfig }) => (
  <EmptyState
    type="not-configured"
    title="需要配置 API"
    description="请先在设置中配置 LLM Provider 的 API 密钥。"
    actionLabel="前往配置"
    onAction={onConfig}
  />
);

export const NoHistoryEmpty: React.FC = () => (
  <EmptyState
    type="no-history"
    title="暂无历史记录"
    description="您的操作历史将显示在这里，包括生成的综述和润色的文本。"
    size="small"
  />
);

export default EmptyState;
