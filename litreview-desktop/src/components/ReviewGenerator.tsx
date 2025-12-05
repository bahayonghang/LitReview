/**
 * Enhanced Review Generator Component
 * Advanced features: templates, real-time preview, export, etc.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ProviderConfig } from '../hooks/useLlmStream';
import styles from './ReviewGenerator.module.css';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'academic' | 'general' | 'technical' | 'medical';
  tags: string[];
  isNew?: boolean;
}

interface ReviewHistory {
  id: string;
  prompt: string;
  result: string;
  timestamp: Date;
  provider: string;
  model: string;
  wordCount: number;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: string;
  mimeType: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'standard-academic',
    name: '标准学术综述',
    description: '适用于学术期刊的标准文献综述格式',
    icon: '📚',
    category: 'academic',
    tags: ['学术', '期刊', '标准格式'],
    prompt: '请撰写一篇关于{topic}的学术文献综述，包含以下部分：\n1. 引言\n2. 文献检索策略\n3. 主要研究发现\n4. 研究方法分析\n5. 未来研究方向\n6. 结论\n\n要求：\n- 字数约2000-3000字\n- 引用至少20篇相关文献\n- 使用学术写作风格\n- 包含批判性分析',
    isNew: false
  },
  {
    id: 'quick-summary',
    name: '快速文献摘要',
    description: '快速生成文献的核心内容摘要',
    icon: '⚡',
    category: 'general',
    tags: ['快速', '摘要', '核心内容'],
    prompt: '请为以下文献{topic}生成一份简明摘要，包括：\n1. 研究背景\n2. 主要贡献\n3. 关键方法\n4. 重要发现\n5. 研究意义\n\n要求：\n- 字数约300-500字\n- 突出核心观点\n- 逻辑清晰',
    isNew: true
  },
  {
    id: 'systematic-review',
    name: '系统性综述',
    description: '符合PRISMA标准的系统性文献综述',
    icon: '🔍',
    category: 'academic',
    tags: ['系统', 'PRISMA', '严谨'],
    prompt: '请按照PRISMA指南撰写关于{topic}的系统性综述，包含：\n1. 研究问题和目标\n2. 纳入排除标准\n3. 检索策略\n4. 研究质量评估\n5. 结果综合\n6. 偏倚风险评估\n7. 结果解释\n8. 结论和建议\n\n要求：\n- 严格遵循PRISMA流程\n- 包含风险偏倚评估\n- 提供证据等级评估',
    isNew: false
  },
  {
    id: 'technical-review',
    name: '技术发展综述',
    description: '特定技术领域的发展历程和趋势分析',
    icon: '💻',
    category: 'technical',
    tags: ['技术', '发展', '趋势'],
    prompt: '请撰写关于{topic}技术发展的综述，包括：\n1. 技术发展历程\n2. 关键技术突破\n3. 当前技术水平\n4. 技术挑战和局限\n5. 未来发展趋势\n6. 应用前景分析\n\n要求：\n- 技术描述准确\n- 包含具体案例\n- 分析技术演进路径',
    isNew: false
  },
  {
    id: 'medical-review',
    name: '医学文献综述',
    description: '医学领域的专业文献综述',
    icon: '🏥',
    category: 'medical',
    tags: ['医学', '临床', '研究'],
    prompt: '请撰写关于{topic}的医学文献综述，包含：\n1. 疾病背景和流行病学\n2. 病理生理机制\n3. 诊断方法进展\n4. 治疗策略对比\n5. 循证医学证据\n6. 临床实践指南\n7. 研究局限和展望\n\n要求：\n- 遵循医学写作规范\n- 强调循证医学\n- 包含临床意义分析',
    isNew: false
  }
];

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    extension: '.md',
    icon: '📝',
    mimeType: 'text/markdown'
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    icon: '📄',
    mimeType: 'application/pdf'
  },
  {
    id: 'word',
    name: 'Word',
    extension: '.docx',
    icon: '📘',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  {
    id: 'latex',
    name: 'LaTeX',
    extension: '.tex',
    icon: '📐',
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
}

const TemplateCard: React.FC<{
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ template, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`
        ${styles.templateCard}
        ${isSelected ? styles.templateCardSelected : ''}
        ${isHovered ? styles.templateCardHovered : ''}
      `}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

const HistoryItem: React.FC<{
  item: ReviewHistory;
  onLoad: () => void;
  onDelete: () => void;
}> = ({ item, onLoad, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.historyItem} ${isHovered ? styles.historyItemHovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.historyContent}>
        <div className={styles.historyHeader}>
          <h4 className={styles.historyTitle}>
            {item.prompt.substring(0, 50)}...
          </h4>
          <div className={styles.historyActions}>
            {isHovered && (
              <>
                <button
                  className={styles.historyAction}
                  onClick={onLoad}
                  aria-label="加载历史记录"
                >
                  📂
                </button>
                <button
                  className={styles.historyAction}
                  onClick={onDelete}
                  aria-label="删除历史记录"
                >
                  🗑️
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
};

const WordCounter: React.FC<{ text: string }> = ({ text }) => {
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;

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
          {Math.max(1, Math.ceil(wordCount / 200))} 分钟
        </span>
      </div>
    </div>
  );
};

export function ReviewGenerator({
  config,
  providerName,
  content,
  loading,
  error,
  onGenerate,
  onReset,
}: ReviewGeneratorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ReviewHistory[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('litreview_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadHistory();
  }, []);

  // Auto-save prompt to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (prompt.trim()) {
        localStorage.setItem('litreview_draft_prompt', prompt);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [prompt]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('litreview_draft_prompt');
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
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !config) return;

    // Update generation count
    const currentCount = parseInt(localStorage.getItem('litreview_generation_count') || '0', 10);
    localStorage.setItem('litreview_generation_count', String(currentCount + 1));

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

    const updatedHistory = [historyItem, ...history.slice(0, 49)]; // Keep last 50 items
    setHistory(updatedHistory);
    localStorage.setItem('litreview_history', JSON.stringify(updatedHistory));

    // Clear draft
    localStorage.removeItem('litreview_draft_prompt');

    await onGenerate(prompt);
  };

  const handleExport = useCallback((format: ExportFormat) => {
    if (!content) return;

    let exportContent = content;
    let filename = `review_${Date.now()}${format.extension}`;

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
        alert('PDF导出功能正在开发中');
        return;
      case 'word':
        // For Word, we'd need a library like docx
        alert('Word导出功能正在开发中');
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

    setShowExport(false);
  }, [content]);

  const handleLoadHistory = useCallback((item: ReviewHistory) => {
    setPrompt(item.prompt);
    setShowHistory(false);

    // Update generation count for restored item
    const currentCount = parseInt(localStorage.getItem('litreview_generation_count') || '0', 10);
    localStorage.setItem('litreview_generation_count', String(currentCount + 1));

    if (item.result) {
      onGenerate(item.prompt);
    }
  }, [onGenerate]);

  const handleDeleteHistory = useCallback((itemId: string) => {
    const updatedHistory = history.filter(item => item.id !== itemId);
    setHistory(updatedHistory);
    localStorage.setItem('litreview_history', JSON.stringify(updatedHistory));
  }, [history]);

  const isConfigured = config && config.api_key;

  if (!isConfigured) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.setupPrompt}>
          <div className={styles.setupIcon}>⚠️</div>
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
            <span className={styles.actionButtonIcon}>📋</span>
            <span className={styles.actionButtonText}>模板</span>
          </button>

          <button
            className={styles.actionButton}
            onClick={() => setShowHistory(!showHistory)}
            disabled={loading}
          >
            <span className={styles.actionButtonIcon}>📚</span>
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
          <span className={styles.providerIcon}>🤖</span>
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
            <button
              className={styles.categoryButton}
              onClick={() => {/* Filter by category */}}
            >
              全部
            </button>
            <button
              className={styles.categoryButton}
              onClick={() => {/* Filter by category */}}
            >
              学术
            </button>
            <button
              className={styles.categoryButton}
              onClick={() => {/* Filter by category */}}
            >
              技术
            </button>
            <button
              className={styles.categoryButton}
              onClick={() => {/* Filter by category */}}
            >
              医学
            </button>
          </div>

          <div className={styles.templatesGrid}>
            {TEMPLATES.map(template => (
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

          {history.length === 0 ? (
            <div className={styles.historyEmpty}>
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map(item => (
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
              {loading ? '⏳' : '🚀'}
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
              <span className={styles.resetButtonIcon}>🔄</span>
              <span className={styles.resetButtonText}>重新开始</span>
            </button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBox}>
          <div className={styles.errorHeader}>
            <span className={styles.errorIcon}>❌</span>
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
                      {isPreviewMode ? '✏️' : '👁️'}
                    </span>
                    <span className={styles.outputButtonText}>
                      {isPreviewMode ? '编辑' : '预览'}
                    </span>
                  </button>

                  <button
                    className={styles.outputButton}
                    onClick={() => setShowExport(true)}
                  >
                    <span className={styles.outputButtonIcon}>📤</span>
                    <span className={styles.outputButtonText}>导出</span>
                  </button>

                  <button
                    className={styles.outputButton}
                    onClick={() => {
                      navigator.clipboard.writeText(content);
                      // Show toast notification
                    }}
                  >
                    <span className={styles.outputButtonIcon}>📋</span>
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