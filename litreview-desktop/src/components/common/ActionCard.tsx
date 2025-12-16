import React, { useState } from 'react';
import styles from './ActionCard.module.css';

export interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  gradient?: string;
  shortcut?: string;
  isNew?: boolean;
  index?: number;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  gradient,
  shortcut,
  isNew,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={styles.actionCard}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`,
        background: isHovered && gradient ? gradient : 'var(--glass-bg)'
      }}
    >
      {isNew && (
        <span className={styles.newBadge}>NEW</span>
      )}

      <div className={styles.actionIcon} style={{ color: isHovered ? 'white' : undefined }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
      </div>

      <div className={styles.actionContent}>
        <h3 className={styles.actionTitle} style={{ color: isHovered ? 'white' : undefined }}>
          {title}
        </h3>
        <p className={styles.actionDescription} style={{ color: isHovered ? 'rgba(255,255,255,0.8)' : undefined }}>
          {description}
        </p>
      </div>

      {shortcut && (
        <div className={styles.actionShortcut} style={{ color: isHovered ? 'rgba(255,255,255,0.6)' : undefined }}>
          <kbd className={styles.kbd}>{shortcut}</kbd>
        </div>
      )}

      {gradient && (
        <div className={styles.actionGlow} style={{ background: gradient }} />
      )}
    </button>
  );
};
