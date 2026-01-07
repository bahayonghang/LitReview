import { useState, useEffect, lazy, Suspense } from "react";
import { useLlmStream } from "./hooks/useLlmStream";
import { useConfig } from "./hooks/useConfig";
import { useTheme } from "./hooks/useTheme";
import { useToast, ToastContainer } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/Skeleton";
import { KeyboardShortcutsModal, KeyboardShortcutsButton } from "./components/KeyboardShortcutsModal";
import { Sidebar } from "./components/Sidebar";
import type { TabType } from "./types/tabs";
import { HomePage } from "./components/HomePage";

// Lazy load heavy components
const ReviewGenerator = lazy(() => import("./components/ReviewGenerator").then(m => ({ default: m.ReviewGenerator })));
const LanguagePolish = lazy(() => import("./components/LanguagePolish").then(m => ({ default: m.LanguagePolish })));
const ApiConfigPage = lazy(() => import("./components/ApiConfigPage").then(m => ({ default: m.ApiConfigPage })));

import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  const { mode: themeMode, setTheme } = useTheme();
  const { toasts, showSuccess, showToast, closeToast } = useToast();
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
    if (!config) return;
    await startStream(prompt, config, systemPrompt);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to open keyboard shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    if (configLoading) {
      return <PageSkeleton />;
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
          <Suspense fallback={<PageSkeleton />}>
            <ReviewGenerator
              config={config}
              providerName={providerName}
              content={content}
              loading={loading}
              error={error}
              onGenerate={handleGenerate}
              onReset={reset}
              showToast={(message, type) => {
                if (type === 'error') showToast?.(message, 'error');
                else if (type === 'warning') showToast?.(message, 'warning');
                else showSuccess?.(message);
              }}
            />
          </Suspense>
        );
      case "polish":
        return (
          <Suspense fallback={<PageSkeleton />}>
            <LanguagePolish
              config={config}
              loading={loading}
              error={error}
              content={content}
              onPolish={handlePolish}
              onReset={reset}
              showToast={(message, type) => {
                if (type === 'error') showToast?.(message, 'error');
                else showSuccess?.(message);
              }}
            />
          </Suspense>
        );
      case "config":
        return (
          <Suspense fallback={<PageSkeleton />}>
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
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
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
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <main className="app-content">
            {renderContent()}
          </main>
        </div>

        <ToastContainer
          toasts={toasts}
          onClose={closeToast}
        />

        <KeyboardShortcutsButton onClick={() => setShowKeyboardHelp(true)} />

        <KeyboardShortcutsModal
          isOpen={showKeyboardHelp}
          onClose={() => setShowKeyboardHelp(false)}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
