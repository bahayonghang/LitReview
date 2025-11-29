import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LlmConfig } from "./useLlmStream";

const DEFAULT_CONFIGS: Record<string, Partial<LlmConfig>> = {
  openai: {
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
  ollama: {
    base_url: "http://localhost:11434/v1",
    model: "llama3.2",
    api_key: "",
  },
  gemini: {
    base_url: "https://generativelanguage.googleapis.com",
    model: "gemini-1.5-flash",
  },
  deepseek: {
    base_url: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  moonshot: {
    base_url: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
  },
};

export function useConfig() {
  const [config, setConfig] = useState<LlmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await invoke<LlmConfig | null>("load_config");
        if (savedConfig) {
          setConfig(savedConfig);
        } else {
          // Set default config
          setConfig({
            provider: "openai",
            base_url: DEFAULT_CONFIGS.openai.base_url!,
            api_key: "",
            model: DEFAULT_CONFIGS.openai.model!,
          });
        }
      } catch (e) {
        console.error("Failed to load config:", e);
        // Set default config on error
        setConfig({
          provider: "openai",
          base_url: DEFAULT_CONFIGS.openai.base_url!,
          api_key: "",
          model: DEFAULT_CONFIGS.openai.model!,
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const saveConfig = useCallback(async (newConfig: LlmConfig) => {
    setSaving(true);
    try {
      await invoke("save_config", { config: newConfig });
      setConfig(newConfig);
    } catch (e) {
      console.error("Failed to save config:", e);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateProvider = useCallback((provider: string) => {
    if (!config) return;
    
    const defaults = DEFAULT_CONFIGS[provider] || {};
    setConfig({
      ...config,
      provider,
      base_url: defaults.base_url || config.base_url,
      model: defaults.model || config.model,
      api_key: defaults.api_key !== undefined ? defaults.api_key : config.api_key,
    });
  }, [config]);

  return {
    config,
    loading,
    saving,
    saveConfig,
    updateProvider,
    setConfig,
    defaultConfigs: DEFAULT_CONFIGS,
  };
}
