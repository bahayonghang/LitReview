/**
 * Keyboard Shortcuts Help Modal
 * 键盘快捷键帮助模态框
 */

import React from 'react';
import { CloseIcon } from './icons';
import styles from './KeyboardShortcuts.module.css';

export interface Shortcut {
  key: string;
  description: string;
  category?: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: '导航',
    shortcuts: [
      { key: '1', description: '切换到首页' },
      { key: '2', description: '切换到综述生成' },
      { key: '3', description: '切换到语言润色' },
      { key: '4', description: '切换到API配置' },
      { key: 'Alt + 1/2/3', description: '快速访问功能' },
    ]
  },
  {
    category: '侧边栏',
    shortcuts: [
      { key: 'Ctrl/Cmd + B', description: '折叠/展开侧边栏' },
    ]
  },
  {
    category: '操作',
    shortcuts: [
      { key: 'Esc', description: '关闭模态框/菜单' },
      { key: 'Enter', description: '确认操作' },
    ]
  }
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard Shortcuts Modal Component
 */
export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>键盘快捷键</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {SHORTCUTS.map((group) => (
            <div key={group.category} className={styles.shortcutGroup}>
              <h3 className={styles.shortcutCategory}>{group.category}</h3>
              <div className={styles.shortcutList}>
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className={styles.shortcutItem}>
                    <kbd className={styles.shortcutKey}>
                      {shortcut.key}
                    </kbd>
                    <span className={styles.shortcutDescription}>
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerHint}>
            💡 提示：使用快捷键可以更高效地操作
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Keyboard Shortcuts Help Button
 */
interface KeyboardShortcutsButtonProps {
  onClick: () => void;
}

export const KeyboardShortcutsButton: React.FC<KeyboardShortcutsButtonProps> = ({
  onClick
}) => {
  return (
    <button
      className={styles.helpButton}
      onClick={onClick}
      aria-label="查看键盘快捷键"
      title="键盘快捷键 (Ctrl/Cmd + /)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    </button>
  );
};

export default KeyboardShortcutsModal;
