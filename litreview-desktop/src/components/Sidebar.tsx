/**
 * Modern Sidebar Component
 * Responsive, collapsible sidebar with enhanced accessibility
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTheme, useBreakpoint } from '../hooks/useDesignTokens';
import type { TabType } from '../types/tabs';
import {
  HomeIcon,
  DocumentIcon,
  SparklesIcon,
  SettingsIcon,
  BookIcon,
  MoonIcon,
  SunIcon,
  MenuIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons';
import styles from './Sidebar.module.css';

interface NavItem {
  id: TabType;
  icon: React.ReactNode;
  label: string;
  description?: string;
  badge?: string;
  keyboard?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    icon: <HomeIcon size={20} />,
    label: "首页",
    description: "仪表板和快速操作",
    keyboard: "1"
  },
  {
    id: "review",
    icon: <DocumentIcon size={20} />,
    label: "综述生成",
    description: "生成文献综述",
    keyboard: "2"
  },
  {
    id: "polish",
    icon: <SparklesIcon size={20} />,
    label: "语言润色",
    description: "改进文本表达",
    keyboard: "3"
  },
  {
    id: "config",
    icon: <SettingsIcon size={20} />,
    label: "API 配置",
    description: "管理LLM提供商",
    keyboard: "4"
  },
];

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({
  item,
  isActive,
  onClick,
  isCollapsed
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      className={`
        ${styles.navButton}
        ${isActive ? styles.navButtonActive : ''}
        ${isCollapsed ? styles.navButtonCollapsed : ''}
      `}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`${item.label} - ${item.description}`}
      data-tooltip={isCollapsed ? item.label : undefined}
      data-tooltip-position="right"
    >
      <span className={styles.navButtonIcon} aria-hidden="true">
        {item.icon}
      </span>

      {!isCollapsed && (
        <>
          <span className={styles.navButtonContent}>
            <span className={styles.navButtonLabel}>{item.label}</span>
            <span className={styles.navButtonDescription}>{item.description}</span>
          </span>

          {item.keyboard && (
            <span className={styles.navButtonKeyboard} aria-hidden="true">
              {item.keyboard}
            </span>
          )}
        </>
      )}

      {item.badge && (
        <span className={styles.navButtonBadge} aria-label={`${item.badge} 个通知`}>
          {item.badge}
        </span>
      )}
    </button>
  );
};

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
  className = ""
}: SidebarProps) {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Number key shortcuts
      if (event.key >= '1' && event.key <= '4') {
        const index = parseInt(event.key) - 1;
        if (index < NAV_ITEMS.length) {
          event.preventDefault();
          onTabChange(NAV_ITEMS[index].id);
        }
      }

      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        onToggleCollapse?.();
      }

      // Close mobile menu with Escape
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, onToggleCollapse, isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Auto-collapse on mobile
  const shouldShowAsMobile = isMobile || (isTablet && isMobileMenuOpen);
  const actualIsCollapsed = shouldShowAsMobile ? !isMobileMenuOpen : isCollapsed;

  const handleToggleMenu = () => {
    if (shouldShowAsMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      onToggleCollapse?.();
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          ref={toggleButtonRef}
          className={styles.mobileMenuToggle}
          onClick={handleToggleMenu}
          aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-navigation"
        >
          <span className={styles.mobileMenuToggleIcon} aria-hidden="true">
            {isMobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </span>
        </button>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="sidebar-navigation"
        className={`
          ${styles.sidebar}
          ${actualIsCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}
          ${shouldShowAsMobile ? styles.sidebarMobile : styles.sidebarDesktop}
          ${isMobileMenuOpen ? styles.sidebarMobileOpen : styles.sidebarMobileClosed}
          ${className}
        `}
        aria-label="主导航"
      >
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <span className={styles.sidebarLogoIcon} aria-hidden="true">
              <BookIcon size={24} />
            </span>
            {!actualIsCollapsed && (
              <span className={styles.sidebarLogoText}>LitReview Pro</span>
            )}
          </div>

          {!shouldShowAsMobile && onToggleCollapse && (
            <button
              className={styles.sidebarToggle}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
              aria-expanded={!isCollapsed}
            >
              <span className={styles.sidebarToggleIcon} aria-hidden="true">
                {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
              </span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav} role="navigation" aria-label="页面导航">
          <ul className={styles.sidebarNavList} role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className={styles.sidebarNavItem} role="none">
                <NavButton
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (shouldShowAsMobile) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  isCollapsed={actualIsCollapsed}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarThemeInfo}>
            <span className={styles.sidebarThemeIcon} aria-hidden="true">
              {theme === 'dark' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </span>
            {!actualIsCollapsed && (
              <span className={styles.sidebarThemeLabel}>
                {theme === 'system'
                  ? `系统 (${useTheme().systemTheme === 'dark' ? '深色' : '浅色'})`
                  : theme === 'dark' ? '深色模式' : '浅色模式'
                }
              </span>
            )}
          </div>

          {!actualIsCollapsed && (
            <div className={styles.sidebarVersion}>
              <span className={styles.sidebarVersionText}>v2.0.0</span>
            </div>
          )}
        </div>

        {/* Mobile Overlay */}
        {shouldShowAsMobile && isMobileMenuOpen && (
          <div
            className={styles.sidebarOverlay}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </aside>
    </>
  );
}

export default Sidebar;