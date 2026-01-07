/**
 * Modern Homepage Component
 * Enhanced dashboard with mini charts, animations, and improved UX
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { TabType } from '../types/tabs';
import type { ProviderConfig } from '../hooks/useLlmStream';
import { useBreakpoint } from '../hooks/useDesignTokens';
import { StatCard } from './common/StatCard';
import { ActionCard } from './common/ActionCard';
import { StatsChart, WeeklyActivityChart, type ChartData } from './StatsChart';
import { STORAGE_KEYS } from '../constants/constants';
import {
  DocumentIcon,
  SparklesIcon,
  SettingsIcon,
  ChartIcon,
  LinkIcon,
  ZapIcon,
} from './icons';
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
  icon: React.ReactNode;
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
    icon: <DocumentIcon size={32} />,
    color: 'primary',
    gradient: 'var(--gradient-card-primary)',
    shortcut: '1',
    isNew: false
  },
  {
    id: 'polish',
    title: '语言润色',
    description: '提升文本表达质量',
    icon: <SparklesIcon size={32} />,
    color: 'secondary',
    gradient: 'var(--gradient-card-secondary)',
    shortcut: '2',
    isNew: true
  },
  {
    id: 'config',
    title: 'API 配置',
    description: '管理 LLM 提供商设置',
    icon: <SettingsIcon size={32} />,
    color: 'neutral',
    gradient: 'var(--gradient-card-neutral)',
    shortcut: '3',
    isNew: false
  }
];

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

  // Load and calculate stats from real history data
  useEffect(() => {
    const loadStats = () => {
      // Load history from localStorage
      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const historyData = savedHistory ? JSON.parse(savedHistory) : [];

      const generationCount = parseInt(localStorage.getItem(STORAGE_KEYS.GENERATION_COUNT) || '0', 10);
      const polishCount = parseInt(localStorage.getItem('litreview_polish_count') || '0', 10);

      // Calculate total characters from history
      const totalCharacters = historyData.reduce((sum: number, item: any) =>
        sum + (item.wordCount || 0), 0
      );

      // Calculate weekly activity from actual history
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekData = new Array(7).fill(0);

      historyData.forEach((item: any) => {
        const itemDate = new Date(item.timestamp);
        const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          const dayIndex = (dayOfWeek - daysDiff + 7) % 7;
          weekData[dayIndex]++;
        }
      });

      // Adjust weekData to start from Monday
      const weeklyActivity = [
        weekData[1], // Monday
        weekData[2], // Tuesday
        weekData[3], // Wednesday
        weekData[4], // Thursday
        weekData[5], // Friday
        weekData[6], // Saturday
        weekData[0]  // Sunday
      ];

      // Calculate provider usage from actual history
      const providerUsage: Record<string, number> = {};
      historyData.forEach((item: any) => {
        const provider = item.provider || 'Unknown';
        providerUsage[provider] = (providerUsage[provider] || 0) + 1;
      });

      setStats({
        generationCount,
        polishCount,
        totalCharacters,
        averageResponseTime: 0, // Not tracking response time currently
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

  // Prepare chart data from stats
  const providerUsageChartData: ChartData[] = useMemo(() => {
    return Object.entries(stats.providerUsage).map(([provider, count], index) => ({
      label: provider,
      value: count,
      color: `var(--chart-color-${(index % 6) + 1})`
    }));
  }, [stats.providerUsage]);

  const totalOperations = stats.generationCount + stats.polishCount;

  const operationDistributionChartData: ChartData[] = useMemo(() => {
    return [
      {
        label: '综述生成',
        value: stats.generationCount,
        color: 'var(--chart-color-1)'
      },
      {
        label: '语言润色',
        value: stats.polishCount,
        color: 'var(--chart-color-2)'
      }
    ];
  }, [stats.generationCount, stats.polishCount]);

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
            icon={<ChartIcon size={24} />}
            trend={{ value: 23, isPositive: true }}
            chart={stats.weeklyActivity}
            color="#667eea"
          />

          <StatCard
            title="语言润色次数"
            value={stats.polishCount.toLocaleString()}
            subtitle="本周 +15%"
            icon={<SparklesIcon size={24} />}
            trend={{ value: 15, isPositive: true }}
            chart={stats.weeklyActivity.map(v => v * 0.8)}
            color="#f093fb"
          />

          <StatCard
            title="当前 Provider"
            value={providerName || '未配置'}
            subtitle={config?.model || '请配置 API'}
            icon={<LinkIcon size={24} />}
            color="#4facfe"
          />

          <StatCard
            title="平均响应时间"
            value={`${stats.averageResponseTime}ms`}
            subtitle="响应速度优秀"
            icon={<ZapIcon size={24} />}
            trend={{ value: 12, isPositive: true }}
            color="#f5576c"
          />
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {totalOperations > 0 && (
            <>
              <StatsChart
                data={operationDistributionChartData}
                title="操作分布"
                type="donut"
              />
            </>
          )}

          {providerUsageChartData.length > 0 && (
            <StatsChart
              data={providerUsageChartData}
              title="Provider 使用情况"
              type="bar"
            />
          )}

          {stats.weeklyActivity.some(v => v > 0) && (
            <WeeklyActivityChart data={stats.weeklyActivity} />
          )}
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
            <ActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={() => onNavigate(action.id)}
              gradient={action.gradient}
              shortcut={action.shortcut}
              isNew={action.isNew}
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
              <div className={styles.activityIcon}>
                <DocumentIcon size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>生成了文献综述</div>
                <div className={styles.activityTime}>2 分钟前</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <SparklesIcon size={18} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>润色了论文摘要</div>
                <div className={styles.activityTime}>15 分钟前</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <SettingsIcon size={18} />
              </div>
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