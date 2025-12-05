import { useState, useMemo } from "react";
import type { LlmConfig } from "../hooks/useLlmStream";

// ============================================================================
// Type Definitions
// ============================================================================

type PolishStyleId = "ieee-acm" | "nature-science" | "chinese-core" | "general-academic" | "custom";
type PolishIntensity = "light" | "medium" | "deep";
type FormatOption = "latex" | "markdown" | "plain";
type TargetLanguage = "english" | "chinese";

interface PolishStyleConfig {
  id: PolishStyleId;
  label: string;
  labelEn: string;
  systemPrompt: string;
  description: string;
}

interface ModificationEntry {
  original: string;
  modified: string;
  reason: string;
}

// ============================================================================
// Preset Style Configurations
// ============================================================================

const STYLE_CONFIGS: PolishStyleConfig[] = [
  {
    id: "ieee-acm",
    label: "IEEE/ACM",
    labelEn: "IEEE/ACM",
    description: "适用于计算机科学顶会 (CVPR, ICCV, NeurIPS, ICML)",
    systemPrompt: `You are a professional academic journal editor specializing in computer science and engineering publications. Your expertise covers top-tier venues including IEEE TPAMI, ACM SIGGRAPH, CVPR, ICCV, NeurIPS, and ICML.

You MUST:
- Improve spelling, grammar, clarity, concision, and overall readability
- Use formal academic tone and precise technical vocabulary
- Maintain logical flow and argument structure
- Preserve the author's original meaning and contribution claims

You will be penalized for:
- Changing the technical meaning or claims
- Removing or altering citations and references
- Making the text informal or conversational
- Adding information not present in the original`,
  },
  {
    id: "nature-science",
    label: "Nature/Science",
    labelEn: "Nature/Science",
    description: "适用于综合性科学期刊",
    systemPrompt: `You are a professional editor for high-impact scientific journals like Nature and Science. Your task is to polish academic writing for clarity and broad accessibility while maintaining scientific rigor.

You MUST:
- Write clearly and accessibly for a broad scientific audience
- Use active voice where appropriate
- Ensure logical flow between sentences and paragraphs
- Maintain scientific accuracy and precision

You will be penalized for:
- Using unnecessary jargon or overly technical language
- Making claims beyond what the original text supports
- Altering the scientific meaning or conclusions`,
  },
  {
    id: "chinese-core",
    label: "中文核心",
    labelEn: "Chinese Core",
    description: "适用于中文核心期刊",
    systemPrompt: `你是一位专业的中文学术期刊编辑，擅长润色学术论文使其符合中文核心期刊的写作规范。

你必须：
- 使用规范的学术中文表达
- 确保语句通顺、逻辑清晰
- 保持学术论文的正式性和严谨性
- 遵循中文学术写作惯例

你将因以下行为受到惩罚：
- 改变原文的学术观点或结论
- 使用口语化或不正式的表达
- 删除或修改引用信息`,
  },
  {
    id: "general-academic",
    label: "通用学术",
    labelEn: "General Academic",
    description: "适用于一般学术写作",
    systemPrompt: `You are a professional academic writing consultant. Your task is to polish academic text to improve its clarity, grammar, and professional tone while preserving the original meaning.

You MUST:
- Correct grammar, spelling, and punctuation errors
- Improve sentence structure and readability
- Maintain formal academic tone
- Preserve the original meaning and arguments

You will be penalized for:
- Changing the meaning of the text
- Adding unsupported claims
- Making the text less formal`,
  },
];

// ============================================================================
// Intensity and Format Configurations
// ============================================================================

const INTENSITY_OPTIONS: { id: PolishIntensity; label: string; labelEn: string; description: string }[] = [
  { id: "light", label: "轻度", labelEn: "Light", description: "仅修正语法和拼写" },
  { id: "medium", label: "中度", labelEn: "Medium", description: "改善流畅性和可读性" },
  { id: "deep", label: "深度", labelEn: "Deep", description: "全面重写提升学术水平" },
];

const FORMAT_OPTIONS: { id: FormatOption; label: string; description: string }[] = [
  { id: "latex", label: "LaTeX", description: "保留 LaTeX 命令" },
  { id: "markdown", label: "Markdown", description: "保留 Markdown 格式" },
  { id: "plain", label: "纯文本", description: "无特殊格式" },
];

const LANGUAGE_OPTIONS: { id: TargetLanguage; label: string; labelEn: string }[] = [
  { id: "english", label: "英文", labelEn: "English" },
  { id: "chinese", label: "中文", labelEn: "Chinese" },
];

// ============================================================================
// Prompt Building Utilities
// ============================================================================

function buildIntensityInstruction(intensity: PolishIntensity, language: TargetLanguage): string {
  const instructions: Record<PolishIntensity, { en: string; zh: string }> = {
    light: {
      en: "Only fix grammar, spelling, and punctuation errors. Do not change sentence structure or vocabulary choices.",
      zh: "仅修正语法、拼写和标点错误，不要改变句子结构或词汇选择。",
    },
    medium: {
      en: "Improve clarity, concision, and readability while preserving the original meaning and style.",
      zh: "在保持原意和风格的同时，改善清晰度、简洁性和可读性。",
    },
    deep: {
      en: "Perform comprehensive rewriting for academic excellence. Enhance vocabulary, sentence structure, and logical flow significantly.",
      zh: "进行全面的学术水平提升重写，显著增强词汇、句子结构和逻辑流畅性。",
    },
  };
  return language === "english" ? instructions[intensity].en : instructions[intensity].zh;
}

function buildFormatInstruction(format: FormatOption, language: TargetLanguage): string {
  const instructions: Record<FormatOption, { en: string; zh: string }> = {
    latex: {
      en: "Keep all LaTeX commands unchanged, including \\cite{}, \\ref{}, equations ($ ... $, \\[ ... \\]), and environments (\\begin{} ... \\end{}).",
      zh: "保留所有 LaTeX 命令不变，包括 \\cite{}、\\ref{}、公式（$ ... $, \\[ ... \\]）和环境（\\begin{} ... \\end{}）。",
    },
    markdown: {
      en: "Preserve all Markdown formatting including headers (#), lists (- or *), code blocks (```), bold (**), italic (*), and links ([text](url)).",
      zh: "保留所有 Markdown 格式，包括标题（#）、列表（- 或 *）、代码块（```）、粗体（**）、斜体（*）和链接。",
    },
    plain: {
      en: "",
      zh: "",
    },
  };
  return language === "english" ? instructions[format].en : instructions[format].zh;
}

function buildLanguageInstruction(language: TargetLanguage): string {
  return language === "english"
    ? "Output the polished text in English using academic English conventions."
    : "使用规范的中文学术写作惯例输出润色后的文本。";
}

function buildExplanationInstruction(language: TargetLanguage): string {
  return language === "english"
    ? `After the polished text, add a section starting with "---MODIFICATIONS---" followed by a Markdown table listing all modifications:
| Original | Modified | Reason |
|----------|----------|--------|
| original text | modified text | explanation |`
    : `在润色后的文本之后，添加一个以 "---MODIFICATIONS---" 开头的部分，然后是一个 Markdown 表格列出所有修改：
| 原文 | 修改后 | 原因 |
|------|--------|------|
| 原始文本 | 修改后文本 | 解释 |`;
}

function buildUserPrompt(
  text: string,
  intensity: PolishIntensity,
  format: FormatOption,
  language: TargetLanguage
): string {
  const parts: string[] = [];

  // Intensity instruction
  parts.push(`### Polishing Intensity\n${buildIntensityInstruction(intensity, language)}`);

  // Format instruction
  const formatInstr = buildFormatInstruction(format, language);
  if (formatInstr) {
    parts.push(`### Format Preservation\n${formatInstr}`);
  }

  // Language instruction
  parts.push(`### Target Language\n${buildLanguageInstruction(language)}`);

  // Explanation instruction
  parts.push(`### Modification Explanation\n${buildExplanationInstruction(language)}`);

  // Text to polish
  parts.push(`### Text to Polish\n${text}`);

  return parts.join("\n\n");
}

// ============================================================================
// Content Parsing Utilities
// ============================================================================

function parsePolishResult(content: string): { polishedText: string; modifications: ModificationEntry[] } {
  const separator = "---MODIFICATIONS---";
  const separatorIndex = content.indexOf(separator);

  if (separatorIndex === -1) {
    return { polishedText: content.trim(), modifications: [] };
  }

  const polishedText = content.substring(0, separatorIndex).trim();
  const modificationSection = content.substring(separatorIndex + separator.length).trim();

  const modifications: ModificationEntry[] = [];

  // Parse markdown table
  const lines = modificationSection.split("\n").filter((line) => line.trim());
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip header and separator lines
    if (trimmed.startsWith("|") && (trimmed.includes("Original") || trimmed.includes("原文") || trimmed.match(/^\|[\s-:]+\|/))) {
      inTable = true;
      continue;
    }

    if (inTable && trimmed.startsWith("|")) {
      const cells = trimmed
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);

      if (cells.length >= 3) {
        modifications.push({
          original: cells[0],
          modified: cells[1],
          reason: cells[2],
        });
      }
    }
  }

  return { polishedText, modifications };
}

// ============================================================================
// Component Props
// ============================================================================

interface LanguagePolishProps {
  config: LlmConfig | null;
  loading: boolean;
  error: string | null;
  content: string;
  onPolish: (prompt: string, systemPrompt?: string) => Promise<void>;
  onReset: () => void;
}

export function LanguagePolish({
  config,
  loading,
  error,
  content,
  onPolish,
  onReset,
}: LanguagePolishProps) {
  // Core state
  const [originalText, setOriginalText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<PolishStyleId>("ieee-acm");
  const [intensity, setIntensity] = useState<PolishIntensity>("medium");
  const [format, setFormat] = useState<FormatOption>("latex");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("english");
  const [copySuccess, setCopySuccess] = useState(false);

  const isConfigured = config && config.api_key;

  // Parse content into polished text and modifications
  const { polishedText, modifications } = useMemo(() => {
    if (!content) return { polishedText: "", modifications: [] };
    return parsePolishResult(content);
  }, [content]);

  const handlePolish = async () => {
    console.log("[Polish] handlePolish called");
    console.log("[Polish] config:", config);
    console.log("[Polish] originalText:", originalText.substring(0, 100));
    
    if (!originalText.trim() || !config) {
      console.log("[Polish] Early return - missing text or config");
      return;
    }

    const styleConfig = STYLE_CONFIGS.find((s) => s.id === selectedStyle);
    if (!styleConfig) {
      console.log("[Polish] Early return - style config not found");
      return;
    }

    const systemPrompt = styleConfig.systemPrompt;
    const userPrompt = buildUserPrompt(originalText, intensity, format, targetLanguage);

    console.log("[Polish] Calling onPolish with:");
    console.log("[Polish] - systemPrompt length:", systemPrompt.length);
    console.log("[Polish] - userPrompt length:", userPrompt.length);
    console.log("[Polish] - userPrompt preview:", userPrompt.substring(0, 200));

    await onPolish(userPrompt, systemPrompt);
    console.log("[Polish] onPolish completed");
  };

  const handleCopy = async () => {
    if (!polishedText) return;
    try {
      await navigator.clipboard.writeText(polishedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClear = () => {
    setOriginalText("");
    onReset();
  };

  if (!isConfigured) {
    return (
      <div className="page-container">
        <div className="setup-prompt">
          <p>请先配置 LLM Provider 以使用语言润色功能。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">语言润色</h2>

      {/* Options Panel */}
      <div className="polish-options">
        {/* Style Selection */}
        <div className="option-group">
          <span className="option-label">润色风格</span>
          <div className="option-buttons">
            {STYLE_CONFIGS.map((style) => (
              <button
                key={style.id}
                className={`option-btn ${selectedStyle === style.id ? "active" : ""}`}
                onClick={() => setSelectedStyle(style.id)}
                disabled={loading}
                title={style.description}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Selection */}
        <div className="option-group">
          <span className="option-label">润色强度</span>
          <div className="option-buttons">
            {INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${intensity === opt.id ? "active" : ""}`}
                onClick={() => setIntensity(opt.id)}
                disabled={loading}
                title={opt.description}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="option-group">
          <span className="option-label">格式保留</span>
          <div className="option-buttons">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${format === opt.id ? "active" : ""}`}
                onClick={() => setFormat(opt.id)}
                disabled={loading}
                title={opt.description}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Language Selection */}
        <div className="option-group">
          <span className="option-label">目标语言</span>
          <div className="option-buttons">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`option-btn ${targetLanguage === opt.id ? "active" : ""}`}
                onClick={() => setTargetLanguage(opt.id)}
                disabled={loading}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison View */}
      <div className="polish-comparison">
        {/* Left: Original Text */}
        <div className="polish-panel">
          <div className="panel-header">
            <h3>原文</h3>
          </div>
          <textarea
            className="polish-textarea"
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="请输入需要润色的文本..."
            disabled={loading}
          />
          <div className="panel-actions">
            <button
              onClick={handlePolish}
              disabled={loading || !originalText.trim()}
              className="primary-btn"
            >
              {loading ? "润色中..." : "开始润色"}
            </button>
            <button type="button" onClick={handleClear} disabled={loading}>
              清空
            </button>
          </div>
        </div>

        {/* Right: Polished Result */}
        <div className="polish-panel">
          <div className="panel-header">
            <h3>润色结果 {loading && <span className="cursor-blink">▌</span>}</h3>
          </div>
          <div className="polish-result">
            {polishedText || (loading ? (
              <span className="placeholder">正在润色，请稍候...</span>
            ) : (
              <span className="placeholder">润色结果将显示在这里</span>
            ))}
          </div>
          <div className="panel-actions">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!polishedText || loading}
            >
              {copySuccess ? "已复制 ✓" : "复制结果"}
            </button>
          </div>
        </div>
      </div>

      {/* Modification Explanation Table */}
      {modifications.length > 0 && (
        <div className="modifications-section">
          <h3 className="section-title">修改说明</h3>
          <div className="modifications-table-wrapper">
            <table className="modifications-table">
              <thead>
                <tr>
                  <th>原文</th>
                  <th>修改后</th>
                  <th>原因</th>
                </tr>
              </thead>
              <tbody>
                {modifications.map((mod, index) => (
                  <tr key={index}>
                    <td className="cell-original">{mod.original}</td>
                    <td className="cell-modified">{mod.modified}</td>
                    <td className="cell-reason">{mod.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <strong>错误：</strong> {error}
        </div>
      )}
    </div>
  );
}
