import { useState, useEffect } from "react";
import { LlmConfig } from "../hooks/useLlmStream";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LlmConfig | null;
  onSave: (config: LlmConfig) => Promise<void>;
  saving: boolean;
  defaultConfigs: Record<string, Partial<LlmConfig>>;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "ollama", label: "Ollama (Local)" },
  { value: "gemini", label: "Google Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "moonshot", label: "Moonshot" },
];

export function SettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
  saving,
  defaultConfigs,
}: SettingsModalProps) {
  const [formData, setFormData] = useState<LlmConfig>({
    provider: "openai",
    base_url: "",
    api_key: "",
    model: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: string) => {
    const defaults = defaultConfigs[provider] || {};
    setFormData({
      ...formData,
      provider,
      base_url: defaults.base_url || formData.base_url,
      model: defaults.model || formData.model,
      api_key: defaults.api_key !== undefined ? defaults.api_key : formData.api_key,
    });
    setTestResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      // Import invoke dynamically to test connection
      const { invoke } = await import("@tauri-apps/api/core");
      
      // Start a test stream with a simple prompt
      await invoke("start_llm_stream", {
        provider: formData.provider,
        baseUrl: formData.base_url,
        apiKey: formData.api_key,
        model: formData.model,
        prompt: "Say 'OK' in one word.",
      });
      
      setTestResult("✓ Connection successful! Stream started.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>LLM Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="base_url">Base URL</label>
            <input
              id="base_url"
              type="text"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder={defaultConfigs[formData.provider]?.base_url || "https://api.example.com/v1"}
            />
            {formData.provider === "ollama" && (
              <small className="hint">
                Make sure Ollama is running locally. Default: http://localhost:11434/v1
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="api_key">API Key</label>
            <input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={formData.provider === "ollama" ? "(Optional for Ollama)" : "sk-..."}
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model Name</label>
            <input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder={defaultConfigs[formData.provider]?.model || "model-name"}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {testResult && <div className="success-message">{testResult}</div>}

          <div className="button-group">
            <button type="button" onClick={handleTest} disabled={testing || saving}>
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
