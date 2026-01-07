import React, { useState } from 'react';
import { DocumentIcon, TrashIcon } from '../icons';
import styles from './HistoryItem.module.css';

export interface ReviewHistory {
  id: string;
  prompt: string;
  result: string;
  timestamp: Date;
  provider: string;
  model: string;
  wordCount: number;
}

interface HistoryItemProps {
  item: ReviewHistory;
  onLoad: () => void;
  onDelete: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ item, onLoad, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.historyItem}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.historyContent}>
        <div className={styles.historyHeader}>
          <h4 className={styles.historyTitle}>
            {item.prompt.substring(0, 60)}{item.prompt.length > 60 ? '...' : ''}
          </h4>
          <div className={styles.historyActions}>
            {isHovered && (
              <>
                <button
                  className={styles.historyAction}
                  onClick={(e) => { e.stopPropagation(); onLoad(); }}
                  title="加载此记录"
                >
                  <DocumentIcon size={14} />
                </button>
                <button
                  className={styles.historyAction}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="删除此记录"
                >
                  <TrashIcon size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles.historyMeta}>
          <span className={styles.historyProvider}>{item.provider}</span>
          <span className={styles.historyWordCount}>{item.wordCount} 字</span>
          <span className={styles.historyDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});