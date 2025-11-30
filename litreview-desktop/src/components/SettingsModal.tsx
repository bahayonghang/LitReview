import { useState, useEffect } from "react";
import { AppConfig, ProviderConfig } from "../hooks/useLlmStream";
import { PROVIDER_TYPE_TEMPLATES } from "../hooks/useConfig";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appConfig: AppConfig | null;
  configPath: string;
  saving: boolean;
  onSaveAppConfig: (config: AppConfig) => Promise<void>;
  onSetDefault: (providerName: string) => Promise<void>;
  onDeleteProvider: (name: string) => Promise<void>;
}

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI Compatible" },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Google Gemini" },
];

export function SettingsModal({
  isOpen,
  onClose,
  appConfig,
  configPath,
  saving,
  onSaveAppConfig,
  onSetDefault,
  onDeleteProvider,
}: SettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isNewProvider, setIsNewProvider] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Initialize selected provider when modal opens
  useEffect(() => {
    if (isOpen && appConfig) {
      const defaultName = appConfig.default;
      setSelectedProvider(defaultName);
      setEditingProvider(appConfig.providers[defaultName] || null);
      setEditingName(defaultName);
      setIsNewProvider(false);
      setError(null);
      setTestResult(null);
    }
  }, [isOpen, appConfig]);

  if (!isOpen || !appConfig) return null;

  const providerNames = Object.keys(appConfig.providers);

  const handleSelectProvider = (name: string) => {
    setSelectedProvider(name);
    setEditingProvider({ ...appConfig.providers[name] });
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
      
      // If renaming, delete old key
      if (!isNewProvider && selectedProvider && selectedProvider !== editingName) {
        delete newProviders[selectedProvider];
      }
      
      newProviders[editingName] = editingProvider;
      
      // Update default if necessary
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
      setTestResult("✓ Saved successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider) return;
    
    if (providerNames.length <= 1) {
      setError("Cannot delete the last provider");
      return;
    }
    
    if (!confirm(`Delete provider "${selectedProvider}"?`)) return;
    
    try {
      await onDeleteProvider(selectedProvider);
      // Select first remaining provider
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
      setTestResult("✓ Set as default!");
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
      
      setTestResult("✓ Connection successful!");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>API Configuration</h2>
        
        <div className="settings-layout">
          {/* Left: Provider List */}
          <div className="provider-list">
            <div className="provider-list-header">
              <span>Providers</span>
              <button 
                type="button" 
                className="add-btn"
                onClick={handleAddNew}
                title="Add new provider"
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
                  <span className="default-badge" title="Default">★</span>
                )}
              </div>
            ))}
            
            {isNewProvider && (
              <div className="provider-item selected new-provider">
                <span className="provider-name">New Provider</span>
              </div>
            )}
          </div>
          
          {/* Right: Edit Form */}
          <div className="provider-form">
            {editingProvider ? (
              <>
                <div className="form-group">
                  <label htmlFor="provider-name">Provider Name</label>
                  <input
                    id="provider-name"
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="e.g., openai, my-claude"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="provider-type">API Type</label>
                  <select
                    id="provider-type"
                    value={editingProvider.provider_type}
                    onChange={(e) => handleProviderTypeChange(e.target.value)}
                  >
                    {PROVIDER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <small className="hint">
                    OpenAI Compatible works with DeepSeek, Moonshot, Ollama, etc.
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
                  <label htmlFor="model">Model</label>
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
                    <label htmlFor="api_version">API Version</label>
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
                    {testing ? "Testing..." : "Test"}
                  </button>
                  {!isNewProvider && selectedProvider !== appConfig.default && (
                    <button type="button" onClick={handleSetDefault} disabled={saving}>
                      Set Default
                    </button>
                  )}
                  {!isNewProvider && providerNames.length > 1 && (
                    <button type="button" onClick={handleDelete} disabled={saving} className="danger-btn">
                      Delete
                    </button>
                  )}
                  <button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            ) : (
              <div className="no-selection">
                Select a provider or add a new one
              </div>
            )}
          </div>
        </div>
        
        <div className="config-path">
          <small>Config file: {configPath}</small>
        </div>
        
        <div className="modal-footer">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
