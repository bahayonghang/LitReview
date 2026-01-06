import React from 'react';
import styles from './TemplateCard.module.css';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'academic' | 'general' | 'technical' | 'medical';
  tags: string[];
  isNew?: boolean;
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => {
  return (
    <button
      className={`
        ${styles.templateCard}
        ${isSelected ? styles.templateCardSelected : ''}
      `}
      onClick={onSelect}
    >
      <div className={styles.templateHeader}>
        <span className={styles.templateIcon}>{template.icon}</span>
        {template.isNew && (
          <span className={styles.templateBadge}>NEW</span>
        )}
      </div>

      <div className={styles.templateContent}>
        <h3 className={styles.templateName}>{template.name}</h3>
        <p className={styles.templateDescription}>{template.description}</p>
        <div className={styles.templateTags}>
          {template.tags.map(tag => (
            <span key={tag} className={styles.templateTag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
};
