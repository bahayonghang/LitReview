/**
 * Enhanced Review Generator Component
 * Advanced features: templates, real-time preview, export, etc.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ProviderConfig } from '../hooks/useLlmStream';
import { STORAGE_KEYS, HISTORY_MAX_ITEMS, AUTO_SAVE_DELAY, ANIMATION_DELAY_BASE } from '../constants/constants';
import { TemplateCard, type Template } from './review/TemplateCard';
import { HistoryItem, type ReviewHistory } from './review/HistoryItem';
import { WordCounter } from './common/WordCounter';
import {
  BookIcon,
  ZapIcon,
  SearchIcon,
  CodeIcon,
  HospitalIcon,
  DocumentIcon,
  EditIcon,
  ExportIcon,
  TemplateIcon,
  HistoryIcon,
  BotIcon,
  RocketIcon,
  LoaderIcon,
  RefreshIcon,
  AlertIcon,
  CloseIcon,
  EyeIcon,
  CopyIcon,
} from './icons';
import styles from './ReviewGenerator.module.css';

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
  mimeType: string;
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'academic', name: '学术' },
  { id: 'general', name: '通用' },
  { id: 'technical', name: '技术' },
  { id: 'medical', name: '医学' },
];

const TEMPLATES: Template[] = [
  {
    id: 'standard-academic',
    name: '标准学术综述',
    description: '适用于学术期刊的标准文献综述格式',
    icon: <BookIcon size={24} />,
    category: 'academic',
    tags: ['学术', '期刊', '标准格式'],
    prompt: '请撰写一篇关于{topic}的学术文献综述，包含以下部分：\n1. 引言\n2. 文献检索策略\n3. 主要研究发现\n4. 研究方法分析\n5. 未来研究方向\n6. 结论\n\n要求：\n- 字数约2000-3000字\n- 引用至少20篇相关文献\n- 使用学术写作风格\n- 包含批判性分析',
    isNew: false
  },
  {
    id: 'quick-summary',
    name: '快速文献摘要',
    description: '快速生成文献的核心内容摘要',
    icon: <ZapIcon size={24} />,
    category: 'general',
    tags: ['快速', '摘要', '核心内容'],
    prompt: '请为以下文献{topic}生成一份简明摘要，包括：\n1. 研究背景\n2. 主要贡献\n3. 关键方法\n4. 重要发现\n5. 研究意义\n\n要求：\n- 字数约300-500字\n- 突出核心观点\n- 逻辑清晰',
    isNew: true
  },
  {
    id: 'systematic-review',
    name: '系统性综述',
    description: '符合PRISMA标准的系统性文献综述',
    icon: <SearchIcon size={24} />,
    category: 'academic',
    tags: ['系统', 'PRISMA', '严谨'],
    prompt: '请按照PRISMA指南撰写关于{topic}的系统性综述，包含：\n1. 研究问题和目标\n2. 纳入排除标准\n3. 检索策略\n4. 研究质量评估\n5. 结果综合\n6. 偏候风险评估\n7. 结果解释\n8. 结论和建议\n\n要求：\n- 严格遵循PRISMA流程\n- 包含风险偏候评估\n- 提供证据等级评估',
    isNew: false
  },
  {
    id: 'technical-review',
    name: '技术发展综述',
    description: '特定技术领域的发展历程和趋势分析',
    icon: <CodeIcon size={24} />,
    category: 'technical',
    tags: ['技术', '发展', '趋势'],
    prompt: '请撰写关于{topic}技术发展的综述，包括：\n1. 技术发展历程\n2. 关键技术突破\n3. 当前技术水平\n4. 技术挑战和局限\n5. 未来发展趋势\n6. 应用前景分析\n\n要求：\n- 技术描述准确\n- 包含具体案例\n- 分析技术演进路径',
    isNew: false
  },
  {
    id: 'medical-review',
    name: '医学文献综述',
    description: '医学领域的专业文献综述',
    icon: <HospitalIcon size={24} />,
    category: 'medical',
    tags: ['医学', '临床', '研究'],
    prompt: '请撰写关于{topic}的医学文献综述，包含：\n1. 疾病背景和流行病学\n2. 病理生理机制\n3. 诊断方法进展\n4. 治疗策略对比\n5. 循证医学证据\n6. 临床实践指南\n7. 研究局限和展望\n\n要求：\n- 遵循医学写作规范\n- 强调循证医学\n- 包含临床意义分析',
    isNew: false
  },
  {
    id: 'meta-analysis',
    name: 'Meta分析',
    description: '定量整合多个研究结果的统计分析方法',
    icon: <SearchIcon size={24} />,
    category: 'academic',
    tags: ['Meta', '统计', '定量分析'],
    prompt: '请为{topic}撰写一份Meta分析综述，包括：\n1. 研究背景和意义\n2. 研究问题和假设\n3. 文献检索和筛选\n4. 数据提取方法\n5. 统计分析方法\n6. 异质性分析\n7. 发表偏倚评估\n8. 结果合并和解释\n9. 敏感性分析\n10. 结论和推荐\n\n要求：\n- 详细的统计方法描述\n- 森林图和漏斗图说明\n- 亚组分析结果\n- 证据质量评估',
    isNew: true
  },
  {
    id: 'conceptual-framework',
    name: '概念框架综述',
    description: '构建理论框架和概念模型',
    icon: <DocumentIcon size={24} />,
    category: 'academic',
    tags: ['理论', '框架', '概念'],
    prompt: '请为{topic}构建概念框架综述，包括：\n1. 核心概念界定\n2. 理论基础梳理\n3. 概念间关系分析\n4. 理论模型构建\n5. 实证研究支持\n6. 框架应用场景\n7. 局限和发展方向\n\n要求：\n- 清晰的概念图谱\n- 理论溯源完整\n- 实践应用指导\n- 图表辅助说明',
    isNew: true
  },
  {
    id: 'methodology-comparison',
    name: '方法论对比',
    description: '比较不同研究方法的优缺点',
    icon: <CodeIcon size={24} />,
    category: 'technical',
    tags: ['方法', '对比', '评估'],
    prompt: '请对{topic}相关的研究方法进行对比综述：\n1. 方法分类和特点\n2. 各方法的原理\n3. 适用场景分析\n4. 优势和局限性对比\n5. 实施难度评估\n6. 成本效益分析\n7. 选择建议\n8. 未来发展方向\n\n要求：\n- 对比表格清晰\n- 案例分析具体\n- 实操指导明确',
    isNew: true
  },
  {
    id: 'interdisciplinary-review',
    name: '跨学科综述',
    description: '整合多个学科视角的综合分析',
    icon: <BookIcon size={24} />,
    category: 'academic',
    tags: ['跨学科', '整合', '多视角'],
    prompt: '请撰写关于{topic}的跨学科综述，包括：\n1. 学科背景介绍\n2. 各学科的研究视角\n3. 学科间交叉点\n4. 理论和方法整合\n5. 跨学科研究成果\n6. 协同创新机遇\n7. 挑战和解决方案\n\n要求：\n- 多学科平衡呈现\n- 融合视角创新\n- 实践价值突出',
    isNew: true
  },
  {
    id: 'critical-review',
    name: '批判性综述',
    description: '对现有研究进行批判性评价和反思',
    icon: <EditIcon size={24} />,
    category: 'academic',
    tags: ['批判', '评价', '反思'],
    prompt: '请对{topic}进行批判性综述，包括：\n1. 研究现状梳理\n2. 主要理论观点\n3. 方法论批判\n4. 证据质量评估\n5. 争议焦点分析\n6. 研究空白识别\n7. 改进建议\n8. 未来研究方向\n\n要求：\n- 批判视角客观\n- 论证逻辑严密\n- 建设性意见明确',
    isNew: true
  },
  {
    id: 'historical-review',
    name: '历史发展综述',
    description: '追踪研究领域的历史演进过程',
    icon: <HistoryIcon size={24} />,
    category: 'academic',
    tags: ['历史', '演进', '发展'],
    prompt: '请撰写{topic}的历史发展综述，包括：\n1. 起源和早期发展\n2. 关键历史节点\n3. 代表性人物和贡献\n4. 技术和方法演进\n5. 理论范式转变\n6. 社会影响分析\n7. 未来展望\n\n要求：\n- 时间线清晰\n- 史料翔实\n- 演进逻辑明确',
    isNew: true
  },
  {
    id: 'qualitative-review',
    name: '定性研究综述',
    description: '整合质性研究发现的系统性综述',
    icon: <SearchIcon size={24} />,
    category: 'academic',
    tags: ['定性', '质性', '主题'],
    prompt: '请撰写关于{topic}的定性研究综述：\n1. 研究问题和目标\n2. 质性研究方法\n3. 数据来源和分析\n4. 主题提取结果\n5. 关键发现归纳\n6. 理论建构\n7. 信效度评估\n8. 研究意义\n\n要求：\n- 主题归纳清晰\n- 原始引用充分\n- 理论深度足够',
    isNew: true
  }
];

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    extension: '.md',
    icon: <DocumentIcon size={20} />,
    mimeType: 'text/markdown'
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    icon: <DocumentIcon size={20} />,
    mimeType: 'application/pdf'
  },
  {
    id: 'word',
    name: 'Word',
    extension: '.docx',
    icon: <BookIcon size={20} />,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  {
    id: 'latex',
    name: 'LaTeX',
    extension: '.tex',
    icon: <CodeIcon size={20} />,
    mimeType: 'application/x-latex'
  }
];

interface ReviewGeneratorProps {
  config: ProviderConfig | null;
  providerName: string;
  content: string;
  loading: boolean;
  error: string | null;
  onGenerate: (prompt: string) => Promise<void>;
  onReset: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ReviewGenerator({
  config,
  providerName,
  content,
  loading,
  error,
  onGenerate,
  onReset,
  showToast,
}: ReviewGeneratorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ReviewHistory[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // History search and filter states
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortBy, setHistorySortBy] = useState<'date' | 'wordCount'>('date');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [historyProviderFilter, setHistoryProviderFilter] = useState<string>('all');

  // Load history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        }
      } catch (error) {
        // Silent fail - history is not critical
      }
    };

    loadHistory();
  }, []);

  // Auto-save prompt to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (prompt.trim()) {
        localStorage.setItem(STORAGE_KEYS.DRAFT_PROMPT, prompt);
      }
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [prompt]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEYS.DRAFT_PROMPT);
    if (draft && !prompt) {
      setPrompt(draft);
    }
  }, [prompt]);

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    const formattedPrompt = template.prompt.replace('{topic}', '请输入您的主题');
    setPrompt(formattedPrompt);
    setShowTemplates(false);

    // Focus textarea after template selection
    setTimeout(() => {
      textareaRef.current?.focus();
    }, ANIMATION_DELAY_BASE);
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(template => template.category === selectedCategory);

  // Filter and sort history
  const filteredAndSortedHistory = React.useMemo(() => {
    let filtered = [...history];

    // Apply search filter
    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.prompt.toLowerCase().includes(query) ||
        item.result.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (historyDateFilter !== 'all') {
      const now = new Date();
      const daysAgo = historyDateFilter === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => new Date(item.timestamp) >= cutoffDate);
    }

    // Apply provider filter
    if (historyProviderFilter !== 'all') {
      filtered = filtered.filter(item => item.provider === historyProviderFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (historySortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return b.wordCount - a.wordCount;
      }
    });

    return filtered;
  }, [history, historySearchQuery, historySortBy, historyDateFilter, historyProviderFilter]);

  // Get unique providers for filter dropdown
  const uniqueProviders = React.useMemo(() => {
    const providers = new Set(history.map(item => item.provider));
    return Array.from(providers).sort();
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !config) return;

    // Update generation count
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.GENERATION_COUNT) || '0', 10);
    localStorage.setItem(STORAGE_KEYS.GENERATION_COUNT, String(currentCount + 1));

    // Save to history
    const historyItem: ReviewHistory = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      result: '',
      timestamp: new Date(),
      provider: providerName,
      model: config.model || 'unknown',
      wordCount: 0
    };

    const updatedHistory = [historyItem, ...history.slice(0, HISTORY_MAX_ITEMS - 1)];
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

    // Clear draft
    localStorage.removeItem(STORAGE_KEYS.DRAFT_PROMPT);

    await onGenerate(prompt);
  };

  const handleExport = useCallback((format: ExportFormat) => {
    if (!content) return;

    let exportContent = content;
    const filename = `review_${Date.now()}${format.extension}`;

    // Format content based on export type
    switch (format.id) {
      case 'markdown':
        exportContent = `# 文献综述\n\n${content}`;
        break;
      case 'latex':
        exportContent = `\\documentclass{article}\n\\usepackage[UTF8]{ctex}\n\\title{文献综述}\n\\author{LitReview Pro}\n\\begin{document}\n\\maketitle\n\n${content}\n\\end{document}`;
        break;
      case 'pdf':
        // For PDF, we'd need a server-side conversion or a library
        showToast?.('PDF导出功能正在开发中', 'warning');
        return;
      case 'word':
        // For Word, we'd need a library like docx
        showToast?.('Word导出功能正在开发中', 'warning');
        return;
    }

    // Create and download file
    const blob = new Blob([exportContent], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast?.(`已导出为${format.name}`, 'success');
    setShowExport(false);
  }, [content, showToast]);

  const handleLoadHistory = useCallback((item: ReviewHistory) => {
    setPrompt(item.prompt);
    setShowHistory(false);

    // Update generation count for restored item
    const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.GENERATION_COUNT) || '0', 10);
    localStorage.setItem(STORAGE_KEYS.GENERATION_COUNT, String(currentCount + 1));

    if (item.result) {
      onGenerate(item.prompt);
    }
  }, [onGenerate]);

  const handleDeleteHistory = useCallback((itemId: string) => {
    const updatedHistory = history.filter(item => item.id !== itemId);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
  }, [history]);

  const isConfigured = config && config.api_key;

  if (!isConfigured) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.setupPrompt}>
          <div className={styles.setupIcon}><AlertIcon size={48} /></div>
          <h2 className={styles.setupTitle}>需要配置 API</h2>
          <p className={styles.setupDescription}>
            请先配置 LLM Provider 以使用综述生成功能。前往设置页面添加您的 API 密钥。
          </p>
          <button
            className={styles.setupButton}
            onClick={() => {/* Navigate to config */}}
          >
            前往配置
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleSection}>
          <h1 className={styles.pageTitle}>文献综述生成</h1>
          <p className={styles.pageDescription}>
            使用AI智能生成高质量的学术文献综述
          </p>
        </div>

        <div className={styles.pageActions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={loading}
          >
            <span className={styles.actionButtonIcon}><TemplateIcon size={18} /></span>
            <span className={styles.actionButtonText}>模板</span>
          </button>

          <button
            className={styles.actionButton}
            onClick={() => setShowHistory(!showHistory)}
            disabled={loading}
          >
            <span className={styles.actionButtonIcon}><HistoryIcon size={18} /></span>
            <span className={styles.actionButtonText}>历史</span>
            {history.length > 0 && (
              <span className={styles.actionButtonBadge}>{history.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Provider Info */}
      <div className={styles.providerInfo}>
        <div className={styles.providerBadge}>
          <span className={styles.providerIcon}><BotIcon size={18} /></span>
          <span className={styles.providerName}>{providerName}</span>
        </div>
        <div className={styles.providerDetails}>
          <span className={styles.providerType}>{config.provider_type}</span>
          <span className={styles.providerModel}>{config.model}</span>
        </div>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <div className={styles.templatesSection}>
          <div className={styles.templatesHeader}>
            <h3 className={styles.templatesTitle}>选择模板</h3>
            <button
              className={styles.templatesClose}
              onClick={() => setShowTemplates(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.templatesCategories}>
            {TEMPLATE_CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.categoryButtonActive : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className={styles.templatesGrid}>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => handleTemplateSelect(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>历史记录</h3>
            <button
              className={styles.historyClose}
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>

          {/* Search and Filters */}
          {history.length > 0 && (
            <div className={styles.historyFilters}>
              {/* Search Input */}
              <div className={styles.historySearchBox}>
                <input
                  type="text"
                  placeholder="搜索历史记录..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className={styles.historySearchInput}
                />
              </div>

              {/* Filter Controls */}
              <div className={styles.historyFilterControls}>
                {/* Date Filter */}
                <select
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value as any)}
                  className={styles.historyFilterSelect}
                >
                  <option value="all">全部时间</option>
                  <option value="7days">最近 7 天</option>
                  <option value="30days">最近 30 天</option>
                </select>

                {/* Provider Filter */}
                <select
                  value={historyProviderFilter}
                  onChange={(e) => setHistoryProviderFilter(e.target.value)}
                  className={styles.historyFilterSelect}
                >
                  <option value="all">全部 Provider</option>
                  {uniqueProviders.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>

                {/* Sort By */}
                <select
                  value={historySortBy}
                  onChange={(e) => setHistorySortBy(e.target.value as any)}
                  className={styles.historyFilterSelect}
                >
                  <option value="date">按时间排序</option>
                  <option value="wordCount">按字数排序</option>
                </select>
              </div>

              {/* Results Count */}
              <div className={styles.historyResultsCount}>
                显示 {filteredAndSortedHistory.length} / {history.length} 条记录
              </div>
            </div>
          )}

          {filteredAndSortedHistory.length === 0 ? (
            <div className={styles.historyEmpty}>
              <p>
                {history.length === 0
                  ? '暂无历史记录'
                  : '没有找到匹配的历史记录'}
              </p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {filteredAndSortedHistory.map(item => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onLoad={() => handleLoadHistory(item)}
                  onDelete={() => handleDeleteHistory(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <form className={styles.promptForm} onSubmit={handleSubmit}>
        <div className={styles.promptHeader}>
          <label className={styles.promptLabel} htmlFor="prompt">
            输入您的综述需求
          </label>
          <div className={styles.promptActions}>
            <button
              type="button"
              className={styles.promptActionButton}
              onClick={() => setPrompt('')}
              disabled={loading}
            >
              清空
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请输入您的综述生成需求，例如：请根据以下文献生成一篇关于机器学习在医学影像中的应用综述..."
          rows={8}
          disabled={loading}
          className={styles.promptTextarea}
        />

        {prompt && (
          <div className={styles.promptFooter}>
            <WordCounter text={prompt} />
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !prompt.trim()}
          >
            <span className={styles.submitButtonIcon}>
              {loading ? <LoaderIcon size={18} /> : <RocketIcon size={18} />}
            </span>
            <span className={styles.submitButtonText}>
              {loading ? '生成中...' : '生成综述'}
            </span>
          </button>

          {(content || error) && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={onReset}
              disabled={loading}
            >
              <span className={styles.resetButtonIcon}><RefreshIcon size={18} /></span>
              <span className={styles.resetButtonText}>重新开始</span>
            </button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBox}>
          <div className={styles.errorHeader}>
            <span className={styles.errorIcon}><CloseIcon size={18} /></span>
            <span className={styles.errorTitle}>生成失败</span>
          </div>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Output Section */}
      {(content || loading) && (
        <div className={styles.outputSection}>
          <div className={styles.outputHeader}>
            <div className={styles.outputTitleSection}>
              <h3 className={styles.outputTitle}>
                生成结果
                {loading && <span className={styles.loadingCursor}>▌</span>}
              </h3>
              {content && (
                <p className={styles.outputDescription}>
                  生成完成，您可以编辑、导出或重新生成
                </p>
              )}
            </div>

            <div className={styles.outputActions}>
              {content && (
                <>
                  <button
                    className={styles.outputButton}
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                  >
                    <span className={styles.outputButtonIcon}>
                      {isPreviewMode ? <EditIcon size={18} /> : <EyeIcon size={18} />}
                    </span>
                    <span className={styles.outputButtonText}>
                      {isPreviewMode ? '编辑' : '预览'}
                    </span>
                  </button>

                  <button
                    className={styles.outputButton}
                    onClick={() => setShowExport(true)}
                  >
                    <span className={styles.outputButtonIcon}><ExportIcon size={18} /></span>
                    <span className={styles.outputButtonText}>导出</span>
                  </button>

                  <button
                    className={styles.outputButton}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(content);
                        showToast?.('内容已复制到剪贴板', 'success');
                      } catch (err) {
                        showToast?.('复制失败，请重试', 'error');
                      }
                    }}
                  >
                    <span className={styles.outputButtonIcon}><CopyIcon size={18} /></span>
                    <span className={styles.outputButtonText}>复制</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.outputContent}>
            {content ? (
              isPreviewMode ? (
                <div className={styles.previewContent}>
                  {content.split('\n').map((paragraph, index) => (
                    <p key={index} className={styles.previewParagraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={() => {
                    // Allow editing of generated content
                  }}
                  className={styles.outputTextarea}
                  rows={20}
                />
              )
            ) : (
              <div className={styles.loadingPlaceholder}>
                <div className={styles.loadingSpinner} />
                <p>正在生成综述，请稍候...</p>
              </div>
            )}
          </div>

          {content && (
            <div className={styles.outputFooter}>
              <WordCounter text={content} />
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div className={styles.exportModal}>
          <div className={styles.exportOverlay} onClick={() => setShowExport(false)} />
          <div className={styles.exportContent}>
            <div className={styles.exportHeader}>
              <h3 className={styles.exportTitle}>导出综述</h3>
              <button
                className={styles.exportClose}
                onClick={() => setShowExport(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.exportFormats}>
              {EXPORT_FORMATS.map(format => (
                <button
                  key={format.id}
                  className={styles.exportFormatButton}
                  onClick={() => handleExport(format)}
                >
                  <span className={styles.exportFormatIcon}>{format.icon}</span>
                  <span className={styles.exportFormatName}>{format.name}</span>
                  <span className={styles.exportFormatExtension}>{format.extension}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewGenerator;