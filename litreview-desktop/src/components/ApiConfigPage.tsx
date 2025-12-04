import { useState, useEffect } from "react";
import { AppConfig, ProviderConfig } from "../hooks/useLlmStream";
import { PROVIDER_TYPE_TEMPLATES } from "../hooks/useConfig";
import type { ThemeMode } from "../hooks/useTheme";
import { GlassSelect } from "./GlassSelect";

interface ApiConfigPageProps {
  appConfig: AppConfig | null;
  configPath: string;
  saving: boolean;
  onSaveAppConfig: (config: AppConfig) => Promise<void>;
  onSetDefault: (providerName: string) => Promise<void>;
  onDeleteProvider: (name: string) => Promise<void>;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI Compatible" },
  { value: "claude", label: "Claude Compatible" },
  { value: "gemini", label: "Gemini Compatible" },
];

export function ApiConfigPage({
  appConfig,
  configPath,
  saving,
  onSaveAppConfig,
  onSetDefault,
  onDeleteProvider,
  themeMode,
  onThemeChange,
}: ApiConfigPageProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isNewProvider, setIsNewProvider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Initialize selected provider
  useEffect(() => {
    if (appConfig) {
      const defaultName = appConfig.default;
      setSelectedProvider(defaultName);
      setEditingProvider(appConfig.providers[defaultName] || null);
      setEditingName(defaultName);
      setIsNewProvider(false);
      setError(null);
      setTestResult(null);
    }
  }, [appConfig]);

  if (!appConfig) {
    return (
      <div className="page-container">
        <div className="loading">加载配置中...</div>
      </div>
    );
  }

  const providerNames = Object.keys(appConfig.providers);

  const handleSelectProvider = (name: string) => {
    const provider = appConfig.providers[name];
    const template = PROVIDER_TYPE_TEMPLATES[provider.provider_type] || {};
    
    setSelectedProvider(name);
    setEditingProvider({
      provider_type: provider.provider_type,
      base_url: template.base_url || provider.base_url,
      api_key: provider.api_key,
      model: template.model || provider.model,
      context_window: template.context_window,
      api_version: template.api_version,
    });
    setEditingName(name);
    setIsNewProvider(false);
    setError(null);
    setTestResult(null);
  };

  const handleAddNew = () => {
    const template = PROVIDER_TYPE_TEMPLATES.openai;
    setSelectedProvider(null);
    setEditingProvider({
      provider_type: template.provider_type || "openai",
      base_url: template.base_url || "",
      api_key: "",
      model: template.model || "",
      context_window: template.context_window,
      api_version: template.api_version,
    });
    setEditingName("");
    setIsNewProvider(true);
    setError(null);
    setTestResult(null);
  };

  const handleProviderTypeChange = (providerType: string) => {
    if (!editingProvider) return;
    
    const template = PROVIDER_TYPE_TEMPLATES[providerType] || {};
    setEditingProvider({
      ...editingProvider,
      provider_type: providerType,
      base_url: template.base_url || editingProvider.base_url,
      model: template.model || editingProvider.model,
      context_window: template.context_window,
      api_version: template.api_version,
    });
  };

  const handleSave = async () => {
    if (!editingProvider || !editingName.trim()) {
      setError("Provider name is required");
      return;
    }

    setError(null);
    
    try {
      const newProviders = { ...appConfig.providers };
      
      if (!isNewProvider && selectedProvider && selectedProvider !== editingName) {
        delete newProviders[selectedProvider];
      }
      
      newProviders[editingName] = editingProvider;
      
      let newDefault = appConfig.default;
      if (!isNewProvider && selectedProvider === appConfig.default && selectedProvider !== editingName) {
        newDefault = editingName;
      }
      
      const newConfig: AppConfig = {
        default: newDefault,
        providers: newProviders,
      };
      
      await onSaveAppConfig(newConfig);
      
      setSelectedProvider(editingName);
      setIsNewProvider(false);
      setTestResult("✓ 保存成功！");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;
    
    if (providerNames.length <= 1) {
      setError("无法删除最后一个 Provider");
      return;
    }
    
    if (!confirm(`确定删除 "${selectedProvider}"？`)) return;
    
    try {
      await onDeleteProvider(selectedProvider);
      const remaining = providerNames.filter(n => n !== selectedProvider);
      if (remaining.length > 0) {
        handleSelectProvider(remaining[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSetDefault = async () => {
    if (!selectedProvider || selectedProvider === appConfig.default) return;
    
    try {
      await onSetDefault(selectedProvider);
      setTestResult("✓ 已设为默认！");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleTest = async () => {
    if (!editingProvider) return;
    
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      
      await invoke("start_llm_stream", {
        providerType: editingProvider.provider_type,
        baseUrl: editingProvider.base_url,
        apiKey: editingProvider.api_key,
        model: editingProvider.model,
        prompt: "Say 'OK' in one word.",
        apiVersion: editingProvider.api_version,
      });
      
      setTestResult("✓ 连接成功！");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">API 配置</h2>

      <div className="config-layout">
        {/* Left: Provider List */}
        <div className="provider-list">
          <div className="provider-list-header">
            <span>Providers</span>
            <button 
              type="button" 
              className="add-btn"
              onClick={handleAddNew}
              title="添加新 Provider"
            >
              +
            </button>
          </div>
          
          {providerNames.map((name) => (
            <div
              key={name}
              className={`provider-item ${selectedProvider === name ? "selected" : ""}`}
              onClick={() => handleSelectProvider(name)}
            >
              <span className="provider-name">{name}</span>
              <span className="provider-type">{appConfig.providers[name].provider_type}</span>
              {name === appConfig.default && (
                <span className="default-badge" title="默认">★</span>
              )}
            </div>
          ))}
          
          {isNewProvider && (
            <div className="provider-item selected new-provider">
              <span className="provider-name">新 Provider</span>
            </div>
          )}
        </div>
        
        {/* Right: Edit Form */}
        <div className="provider-form">
          {editingProvider ? (
            <>
              <div className="form-group">
                <label htmlFor="provider-name">Provider 名称</label>
                <input
                  id="provider-name"
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="例如：openai, my-claude"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="provider-type">API 类型</label>
                <GlassSelect
                  id="provider-type"
                  value={editingProvider.provider_type}
                  options={PROVIDER_TYPES}
                  onChange={handleProviderTypeChange}
                />
                <small className="hint">
                  OpenAI Compatible 支持 DeepSeek, Moonshot, Ollama 等
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="base_url">Base URL</label>
                <input
                  id="base_url"
                  type="text"
                  value={editingProvider.base_url}
                  onChange={(e) => setEditingProvider({ ...editingProvider, base_url: e.target.value })}
                  placeholder={PROVIDER_TYPE_TEMPLATES[editingProvider.provider_type]?.base_url || ""}
                />
              </div>

              <div className="form-group">
                <label htmlFor="api_key">API Key</label>
                <input
                  id="api_key"
                  type="password"
                  value={editingProvider.api_key}
                  onChange={(e) => setEditingProvider({ ...editingProvider, api_key: e.target.value })}
                  placeholder="sk-..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">模型</label>
                <input
                  id="model"
                  type="text"
                  value={editingProvider.model}
                  onChange={(e) => setEditingProvider({ ...editingProvider, model: e.target.value })}
                  placeholder={PROVIDER_TYPE_TEMPLATES[editingProvider.provider_type]?.model || ""}
                />
              </div>

              {editingProvider.provider_type === "claude" && (
                <div className="form-group">
                  <label htmlFor="api_version">API 版本</label>
                  <input
                    id="api_version"
                    type="text"
                    value={editingProvider.api_version || ""}
                    onChange={(e) => setEditingProvider({ ...editingProvider, api_version: e.target.value })}
                    placeholder="2023-06-01"
                  />
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {testResult && <div className="success-message">{testResult}</div>}

              <div className="button-group">
                <button type="button" onClick={handleTest} disabled={testing || saving}>
                  {testing ? "测试中..." : "测试连接"}
                </button>
                {!isNewProvider && selectedProvider !== appConfig.default && (
                  <button type="button" onClick={handleSetDefault} disabled={saving}>
                    设为默认
                  </button>
                )}
                {!isNewProvider && providerNames.length > 1 && (
                  <button type="button" onClick={handleDelete} disabled={saving} className="danger-btn">
                    删除
                  </button>
                )}
                <button type="button" onClick={handleSave} disabled={saving} className="primary-btn">
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </>
          ) : (
            <div className="no-selection">
              选择一个 Provider 或添加新的
            </div>
          )}
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="theme-section">
        <span className="theme-label">外观主题</span>
        <div className="theme-switcher">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-btn ${themeMode === option.value ? "active" : ""}`}
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="config-path">
        <small>配置文件：{configPath}</small>
      </div>
    </div>
  );
}
