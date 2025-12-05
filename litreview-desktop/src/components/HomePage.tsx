/**
 * Modern Homepage Component
 * Enhanced dashboard with mini charts, animations, and improved UX
 */

import React, { useState, useEffect } from 'react';
import type { TabType } from '../types/tabs';
import type { ProviderConfig } from '../hooks/useLlmStream';
import { useBreakpoint } from '../hooks/useDesignTokens';
import styles from './HomePage.module.css';

interface Stats {
  generationCount: number;
  polishCount: number;
  totalCharacters: number;
  averageResponseTime: number;
  weeklyActivity: number[];
  providerUsage: Record<string, number>;
}

interface QuickAction {
  id: TabType;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient?: string;
  shortcut?: string;
  badge?: number;
  isNew?: boolean;
}

interface HomePageProps {
  config: ProviderConfig | null;
  providerName: string;
  onNavigate: (tab: TabType) => void;
  className?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'review',
    title: '文献综述生成',
    description: '智能生成高质量文献综述',
    icon: '📝',
    color: 'primary',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shortcut: '1',
    isNew: false
  },
  {
    id: 'polish',
    title: '语言润色',
    description: '提升文本表达质量',
    icon: '✨',
    color: 'secondary',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    shortcut: '2',
    isNew: true
  },
  {
    id: 'config',
    title: 'API 配置',
    description: '管理 LLM 提供商设置',
    icon: '⚙️',
    color: 'neutral',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    shortcut: '3',
    isNew: false
  }
];

const MiniChart: React.FC<{ data: number[]; color: string; height?: number }> = ({
  data,
  color,
  height = 60
}) => {
  const maxValue = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((maxValue - value) / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className={styles.miniChart} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={styles.miniChartSvg}
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color})`}
          className={styles.miniChartFill}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className={styles.miniChartLine}
        />
      </svg>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chart?: number[];
  color?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, trend, chart, color = '#667eea', onClick }) => {
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
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
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
};

const QuickActionCard: React.FC<{
  action: QuickAction;
  onClick: () => void;
  index: number;
}> = ({ action, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={styles.quickActionCard}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`,
        background: isHovered ? action.gradient : 'var(--glass-bg)'
      }}
    >
      {action.isNew && (
        <span className={styles.newBadge}>NEW</span>
      )}

      <div className={styles.quickActionIcon} style={{ color: isHovered ? 'white' : undefined }}>
        <span style={{ fontSize: '2rem' }}>{action.icon}</span>
      </div>

      <div className={styles.quickActionContent}>
        <h3 className={styles.quickActionTitle} style={{ color: isHovered ? 'white' : undefined }}>
          {action.title}
        </h3>
        <p className={styles.quickActionDescription} style={{ color: isHovered ? 'rgba(255,255,255,0.8)' : undefined }}>
          {action.description}
        </p>
      </div>

      {action.shortcut && (
        <div className={styles.quickActionShortcut} style={{ color: isHovered ? 'rgba(255,255,255,0.6)' : undefined }}>
          <kbd className={styles.kbd}>{action.shortcut}</kbd>
        </div>
      )}

      <div className={styles.quickActionGlow} style={{ background: action.gradient }} />
    </button>
  );
};

export function HomePage({ config, providerName, onNavigate, className = '' }: HomePageProps) {
  const { isMobile } = useBreakpoint();
  const [stats, setStats] = useState<Stats>({
    generationCount: 0,
    polishCount: 0,
    totalCharacters: 0,
    averageResponseTime: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    providerUsage: {}
  });

  // Load and calculate stats
  useEffect(() => {
    const loadStats = () => {
      const generationCount = parseInt(localStorage.getItem('litreview_generation_count') || '0', 10);
      const polishCount = parseInt(localStorage.getItem('litreview_polish_count') || '0', 10);
      const totalCharacters = parseInt(localStorage.getItem('litreview_total_characters') || '0', 10);

      // Calculate weekly activity (mock data for demo)
      const weeklyActivity = Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 50) + 10
      );

      // Calculate provider usage
      const providerUsage = {
        'OpenAI': generationCount * 0.4,
        'Claude': generationCount * 0.3,
        'Gemini': generationCount * 0.2,
        'Other': generationCount * 0.1
      };

      setStats({
        generationCount,
        polishCount,
        totalCharacters,
        averageResponseTime: Math.floor(Math.random() * 2000) + 500,
        weeklyActivity,
        providerUsage
      });
    };

    loadStats();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('litreview_')) {
        loadStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key >= '1' && event.key <= '3') {
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        if (index < QUICK_ACTIONS.length) {
          onNavigate(QUICK_ACTIONS[index].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <div className={`${styles.homePage} ${className}`}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeHeader}>
            <h1 className={styles.welcomeTitle}>
              欢迎使用 <span className={styles.welcomeHighlight}>LitReview Pro</span>
            </h1>
            <p className={styles.welcomeDescription}>
              您的智能学术写作助手，支持文献综述生成、语言润色等功能，
              助力高效完成学术写作任务。
            </p>
          </div>

          <div className={styles.welcomeActions}>
            <div className={styles.quickActionsInline}>
              {QUICK_ACTIONS.slice(0, 2).map((action, index) => (
                <button
                  key={action.id}
                  className={styles.quickActionInline}
                  onClick={() => onNavigate(action.id)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span>{action.icon}</span>
                  <span>{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.welcomeVisual}>
          <div className={styles.welcomeGraphic}>
            <div className={styles.graphicItem} style={{ '--delay': '0s' } as React.CSSProperties} />
            <div className={styles.graphicItem} style={{ '--delay': '0.5s' } as React.CSSProperties} />
            <div className={styles.graphicItem} style={{ '--delay': '1s' } as React.CSSProperties} />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className={styles.statsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>使用统计</h2>
          <p className={styles.sectionDescription}>您的使用情况和趋势分析</p>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            title="总生成次数"
            value={stats.generationCount.toLocaleString()}
            subtitle="本周 +23%"
            icon="📊"
            trend={{ value: 23, isPositive: true }}
            chart={stats.weeklyActivity}
            color="#667eea"
          />

          <StatCard
            title="语言润色次数"
            value={stats.polishCount.toLocaleString()}
            subtitle="本周 +15%"
            icon="✨"
            trend={{ value: 15, isPositive: true }}
            chart={stats.weeklyActivity.map(v => v * 0.8)}
            color="#f093fb"
          />

          <StatCard
            title="当前 Provider"
            value={providerName || '未配置'}
            subtitle={config?.model || '请配置 API'}
            icon="🔗"
            color="#4facfe"
          />

          <StatCard
            title="平均响应时间"
            value={`${stats.averageResponseTime}ms`}
            subtitle="响应速度优秀"
            icon="⚡"
            trend={{ value: 12, isPositive: true }}
            color="#f5576c"
          />
        </div>
      </section>

      {/* Quick Access Section */}
      <section className={styles.quickAccessSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>快速开始</h2>
          <p className={styles.sectionDescription}>选择您需要的功能开始使用</p>
        </div>

        <div className={styles.quickAccessGrid}>
          {QUICK_ACTIONS.map((action, index) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => onNavigate(action.id)}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {!isMobile && (
        <section className={styles.recentActivitySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近活动</h2>
            <p className={styles.sectionDescription}>您最近的使用记录</p>
          </div>

          <div className={styles.activityFeed}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>📝</div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>生成了文献综述</div>
                <div className={styles.activityTime}>2 分钟前</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>✨</div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>润色了论文摘要</div>
                <div className={styles.activityTime}>15 分钟前</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>⚙️</div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>更新了 API 配置</div>
                <div className={styles.activityTime}>1 小时前</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;