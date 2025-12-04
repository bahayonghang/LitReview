import { useState } from "react";
import type { ProviderConfig } from "../hooks/useLlmStream";

type PolishStyle = "ieee" | "academic" | "formal" | "concise";

interface StyleOption {
  id: PolishStyle;
  label: string;
  prompt: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "ieee",
    label: "IEEE",
    prompt: "请按照 IEEE 学术论文的写作规范对以下文本进行润色，保持专业性和准确性，使用规范的学术表达：",
  },
  {
    id: "academic",
    label: "学术",
    prompt: "请按照学术写作规范对以下文本进行润色，使其更加正式、严谨、逻辑清晰：",
  },
  {
    id: "formal",
    label: "正式",
    prompt: "请将以下文本润色为正式的书面语风格，使其更加得体、专业：",
  },
  {
    id: "concise",
    label: "简洁",
    prompt: "请精简以下文本，去除冗余表达，使其更加简洁明了，同时保持原意：",
  },
];

interface LanguagePolishProps {
  config: ProviderConfig | null;
  loading: boolean;
  error: string | null;
  content: string;
  onPolish: (prompt: string) => Promise<void>;
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
  const [originalText, setOriginalText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<PolishStyle>("ieee");
  const [copySuccess, setCopySuccess] = useState(false);

  const isConfigured = config && config.api_key;

  const handlePolish = async () => {
    if (!originalText.trim() || !config) return;

    const styleOption = STYLE_OPTIONS.find((s) => s.id === selectedStyle);
    const fullPrompt = `${styleOption?.prompt}\n\n${originalText}`;

    await onPolish(fullPrompt);
  };

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
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

      {/* Style Selection */}
      <div className="style-selector">
        <span className="style-label">润色风格：</span>
        <div className="style-options">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              className={`style-btn ${selectedStyle === style.id ? "active" : ""}`}
              onClick={() => setSelectedStyle(style.id)}
              disabled={loading}
            >
              {style.label}
            </button>
          ))}
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
            {content || (loading ? (
              <span className="placeholder">正在润色，请稍候...</span>
            ) : (
              <span className="placeholder">润色结果将显示在这里</span>
            ))}
          </div>
          <div className="panel-actions">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!content || loading}
            >
              {copySuccess ? "已复制 ✓" : "复制结果"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <strong>错误：</strong> {error}
        </div>
      )}
    </div>
  );
}
