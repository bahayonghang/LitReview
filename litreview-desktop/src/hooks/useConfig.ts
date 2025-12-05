import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LlmConfig, AppConfig, ProviderConfig } from "./useLlmStream";

interface RustProviderConfig {
  type: string;
  base_url: string;
  api_key: string;
  model: string;
  context_window?: number;
  api_version?: string;
}

interface RustAppConfig {
  default: string;
  providers: Record<string, RustProviderConfig>;
}

function toRustConfig(config: AppConfig): RustAppConfig {
  const providers: Record<string, RustProviderConfig> = {};
  for (const [name, provider] of Object.entries(config.providers)) {
    const p = provider as ProviderConfig & { type?: string };
    const providerType = p.provider_type ?? p.type;
    if (!providerType) {
      throw new Error(`Missing provider_type for provider "${name}"`);
    }
    providers[name] = {
      type: providerType,
      base_url: p.base_url,
      api_key: p.api_key,
      model: p.model,
      context_window: p.context_window,
      api_version: p.api_version,
    };
  }
  return { default: config.default, providers };
}

// Provider type templates for creating new providers
export const PROVIDER_TYPE_TEMPLATES: Record<string, Partial<ProviderConfig>> = {
  openai: {
    provider_type: "openai",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4o",
    context_window: 128000,
  },
  claude: {
    provider_type: "claude",
    base_url: "https://api.anthropic.com",
    model: "claude-sonnet-4-20250514",
    context_window: 200000,
    api_version: "2023-06-01",
  },
  gemini: {
    provider_type: "gemini",
    base_url: "https://generativelanguage.googleapis.com",
    model: "gemini-1.5-flash",
    context_window: 1000000,
  },
};

export function useConfig() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [config, setConfig] = useState<LlmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configPath, setConfigPath] = useState<string>("");

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [loadedConfig, path] = await Promise.all([
          invoke<AppConfig>("load_toml_config"),
          invoke<string>("get_config_file_path"),
        ]);

        const normalizedProviders: Record<string, ProviderConfig> = {};
        for (const [name, provider] of Object.entries(
          (loadedConfig as AppConfig).providers,
        )) {
          const p = provider as ProviderConfig & { type?: string };
          const provider_type = p.provider_type ?? p.type ?? "openai";
          normalizedProviders[name] = {
            provider_type,
            base_url: p.base_url,
            api_key: p.api_key,
            model: p.model,
            context_window: p.context_window,
            api_version: p.api_version,
          };
        }

        const normalizedConfig: AppConfig = {
          default: loadedConfig.default,
          providers: normalizedProviders,
        };

        setAppConfig(normalizedConfig);
        setConfigPath(path);

        const activeProvider = normalizedConfig.providers[normalizedConfig.default];
        if (activeProvider) {
          setConfig({
            provider: normalizedConfig.default,
            provider_type: activeProvider.provider_type,
            base_url: activeProvider.base_url,
            api_key: activeProvider.api_key,
            model: activeProvider.model,
            context_window: activeProvider.context_window,
            api_version: activeProvider.api_version,
          });
        }
      } catch (e) {
        console.error("Failed to load config:", e);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save entire app config
  const saveAppConfig = useCallback(async (newAppConfig: AppConfig) => {
    setSaving(true);
    try {
      // Convert to Rust-compatible format (provider_type -> type)
      await invoke("save_toml_config", { config: toRustConfig(newAppConfig) });
      setAppConfig(newAppConfig);
      
      // Update active config
      const activeProvider = newAppConfig.providers[newAppConfig.default];
      if (activeProvider) {
        setConfig({
          provider: newAppConfig.default,
          provider_type: activeProvider.provider_type,
          base_url: activeProvider.base_url,
          api_key: activeProvider.api_key,
          model: activeProvider.model,
          context_window: activeProvider.context_window,
          api_version: activeProvider.api_version,
        });
      }
    } catch (e) {
      console.error("Failed to save config:", e);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  // Switch active provider
  const setDefaultProvider = useCallback(async (providerName: string) => {
    if (!appConfig) return;
    
    setSaving(true);
    try {
      await invoke("set_default_provider", { providerName });
      
      const newAppConfig = { ...appConfig, default: providerName };
      setAppConfig(newAppConfig);
      
      const activeProvider = appConfig.providers[providerName];
      if (activeProvider) {
        setConfig({
          provider: providerName,
          provider_type: activeProvider.provider_type,
          base_url: activeProvider.base_url,
          api_key: activeProvider.api_key,
          model: activeProvider.model,
          context_window: activeProvider.context_window,
          api_version: activeProvider.api_version,
        });
      }
    } catch (e) {
      console.error("Failed to set default provider:", e);
      throw e;
    } finally {
      setSaving(false);
    }
  }, [appConfig]);

  // Add a new provider
  const addProvider = useCallback(async (name: string, provider: ProviderConfig) => {
    if (!appConfig) return;
    
    const newAppConfig: AppConfig = {
      ...appConfig,
      providers: {
        ...appConfig.providers,
        [name]: provider,
      },
    };
    
    await saveAppConfig(newAppConfig);
  }, [appConfig, saveAppConfig]);

  // Update an existing provider
  const updateProvider = useCallback(async (name: string, provider: ProviderConfig) => {
    if (!appConfig) return;
    
    const newAppConfig: AppConfig = {
      ...appConfig,
      providers: {
        ...appConfig.providers,
        [name]: provider,
      },
    };
    
    await saveAppConfig(newAppConfig);
  }, [appConfig, saveAppConfig]);

  // Delete a provider
  const deleteProvider = useCallback(async (name: string) => {
    if (!appConfig) return;
    if (Object.keys(appConfig.providers).length <= 1) {
      throw new Error("Cannot delete the last provider");
    }
    
    const newProviders = { ...appConfig.providers };
    delete newProviders[name];
    
    // If deleting the default, switch to another
    let newDefault = appConfig.default;
    if (newDefault === name) {
      newDefault = Object.keys(newProviders)[0];
    }
    
    const newAppConfig: AppConfig = {
      default: newDefault,
      providers: newProviders,
    };
    
    await saveAppConfig(newAppConfig);
  }, [appConfig, saveAppConfig]);

  // Test connection with real HTTP request
  const testConnection = useCallback(async (provider: ProviderConfig) => {
    await invoke("test_llm_connection", {
      providerType: provider.provider_type,
      baseUrl: provider.base_url,
      apiKey: provider.api_key,
      model: provider.model,
      apiVersion: provider.api_version,
    });
  }, []);

  return {
    config,
    appConfig,
    loading,
    saving,
    configPath,
    saveAppConfig,
    setDefaultProvider,
    addProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    providerTypeTemplates: PROVIDER_TYPE_TEMPLATES,
  };
}
