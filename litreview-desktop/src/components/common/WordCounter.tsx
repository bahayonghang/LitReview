import React from 'react';
import styles from './WordCounter.module.css';

export const WordCounter: React.FC<{ text: string }> = ({ text }) => {
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;
  // Estimated reading time: 200 words per minute
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className={styles.wordCounter}>
      <div className={styles.wordCounterItem}>
        <span className={styles.wordCounterLabel}>字数</span>
        <span className={styles.wordCounterValue}>{wordCount.toLocaleString()}</span>
      </div>
      <div className={styles.wordCounterItem}>
        <span className={styles.wordCounterLabel}>字符</span>
        <span className={styles.wordCounterValue}>{charCount.toLocaleString()}</span>
      </div>
      <div className={styles.wordCounterItem}>
        <span className={styles.wordCounterLabel}>阅读时间</span>
        <span className={styles.wordCounterValue}>
          {readingTime} 分钟
        </span>
      </div>
    </div>
  );
};
