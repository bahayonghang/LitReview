import { useState } from "react";
import { useLlmStream } from "./hooks/useLlmStream";
import { useConfig } from "./hooks/useConfig";
import { useTheme } from "./hooks/useTheme";
import { Sidebar, TabType } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { ReviewGenerator } from "./components/ReviewGenerator";
import { LanguagePolish } from "./components/LanguagePolish";
import { ApiConfigPage } from "./components/ApiConfigPage";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  
  const { mode: themeMode, setTheme } = useTheme();
  const { content, loading, error, startStream, reset } = useLlmStream();
  const { 
    config, 
    appConfig,
    loading: configLoading, 
    saving, 
    configPath,
    saveAppConfig,
    setDefaultProvider,
    deleteProvider,
    testConnection,
  } = useConfig();

  // Get current provider name
  const providerName = appConfig?.default || "";

  const handleGenerate = async (prompt: string) => {
    if (!config) return;
    await startStream(prompt, config);
  };

  const handlePolish = async (prompt: string, systemPrompt?: string) => {
    console.log("[App] handlePolish called");
    console.log("[App] prompt length:", prompt?.length);
    console.log("[App] systemPrompt length:", systemPrompt?.length);
    console.log("[App] config:", config);
    
    if (!config) {
      console.log("[App] Early return - no config");
      return;
    }
    
    console.log("[App] Calling startStream...");
    await startStream(prompt, config, systemPrompt);
    console.log("[App] startStream completed");
  };

  const renderContent = () => {
    if (configLoading) {
      return <div className="loading">加载配置中...</div>;
    }

    switch (activeTab) {
      case "home":
        return (
          <HomePage
            config={config}
            providerName={providerName}
            onNavigate={setActiveTab}
          />
        );
      case "review":
        return (
          <ReviewGenerator
            config={config}
            providerName={providerName}
            content={content}
            loading={loading}
            error={error}
            onGenerate={handleGenerate}
            onReset={reset}
          />
        );
      case "polish":
        return (
          <LanguagePolish
            config={config}
            loading={loading}
            error={error}
            content={content}
            onPolish={handlePolish}
            onReset={reset}
          />
        );
      case "config":
        return (
          <ApiConfigPage
            appConfig={appConfig}
            configPath={configPath}
            saving={saving}
            onSaveAppConfig={saveAppConfig}
            onSetDefault={setDefaultProvider}
            onDeleteProvider={deleteProvider}
            onTestConnection={testConnection}
            themeMode={themeMode}
            onThemeChange={setTheme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>LitReview Pro</h1>
        <div className="header-right">
          {config && (
            <span className="header-provider">
              {providerName} / {config.model}
            </span>
          )}
        </div>
      </header>

      <div className="app-layout">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="app-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
