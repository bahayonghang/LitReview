import { useState } from "react";
import type { ProviderConfig } from "../hooks/useLlmStream";

interface ReviewGeneratorProps {
  config: ProviderConfig | null;
  providerName: string;
  content: string;
  loading: boolean;
  error: string | null;
  onGenerate: (prompt: string) => Promise<void>;
  onReset: () => void;
}

export function ReviewGenerator({
  config,
  providerName,
  content,
  loading,
  error,
  onGenerate,
  onReset,
}: ReviewGeneratorProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !config) return;

    // 更新生成次数统计
    const currentCount = parseInt(localStorage.getItem("litreview_generation_count") || "0", 10);
    localStorage.setItem("litreview_generation_count", String(currentCount + 1));

    await onGenerate(prompt);
  };

  const isConfigured = config && config.api_key;

  if (!isConfigured) {
    return (
      <div className="page-container">
        <div className="setup-prompt">
          <p>请先配置 LLM Provider 以使用综述生成功能。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">综述生成</h2>

      <div className="provider-info">
        <span className="provider-badge">{providerName}</span>
        <span className="provider-type-badge">{config.provider_type}</span>
        <span className="model-name">{config.model}</span>
      </div>

      <form className="prompt-form" onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请输入您的综述生成需求，例如：请根据以下文献生成一篇关于机器学习在医学影像中的应用综述..."
          rows={6}
          disabled={loading}
        />
        <div className="form-actions">
          <button type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "生成中..." : "生成综述"}
          </button>
          {(content || error) && (
            <button type="button" onClick={onReset} disabled={loading}>
              清空
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-box">
          <strong>错误：</strong> {error}
        </div>
      )}

      {(content || loading) && (
        <div className="output-section">
          <h3>生成结果 {loading && <span className="cursor-blink">▌</span>}</h3>
          <div className="output-content">
            {content || (loading && <span className="placeholder">正在生成，请稍候...</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
