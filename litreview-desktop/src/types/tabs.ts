/**
 * Tab Types for Application Navigation
 */

export type TabType = "home" | "review" | "polish" | "config";

export interface TabConfig {
  id: TabType;
  title: string;
  description: string;
  icon: string;
  keywords?: string[];
  category?: 'main' | 'settings' | 'tools';
}

export const TAB_CONFIGS: Record<TabType, TabConfig> = {
  home: {
    id: 'home',
    title: '首页',
    description: '仪表板和快速操作',
    icon: '🏠',
    keywords: ['dashboard', 'overview', 'statistics'],
    category: 'main'
  },
  review: {
    id: 'review',
    title: '综述生成',
    description: '生成文献综述',
    icon: '📝',
    keywords: ['generate', 'literature', 'review', 'paper'],
    category: 'main'
  },
  polish: {
    id: 'polish',
    title: '语言润色',
    description: '改进文本表达',
    icon: '✨',
    keywords: ['polish', 'improve', 'language', 'writing'],
    category: 'tools'
  },
  config: {
    id: 'config',
    title: 'API 配置',
    description: '管理LLM提供商',
    icon: '⚙️',
    keywords: ['config', 'settings', 'api', 'llm', 'provider'],
    category: 'settings'
  }
};

export function isValidTab(tab: string): tab is TabType {
  return Object.values(TAB_CONFIGS).some(config => config.id === tab);
}

export function getTabById(id: string): TabConfig | undefined {
  return TAB_CONFIGS[id as TabType];
}

export function getTabsByCategory(category: TabConfig['category']): TabConfig[] {
  return Object.values(TAB_CONFIGS).filter(config => config.category === category);
}

export function searchTabs(query: string): TabConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(TAB_CONFIGS).filter(config =>
    config.title.toLowerCase().includes(lowerQuery) ||
    config.description.toLowerCase().includes(lowerQuery) ||
    config.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}