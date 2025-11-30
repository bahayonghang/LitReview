import { useState } from "react";
import { useLlmStream } from "./hooks/useLlmStream";
import { useConfig } from "./hooks/useConfig";
import { SettingsModal } from "./components/SettingsModal";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  
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
  } = useConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !config) return;
    
    await startStream(prompt, config);
  };

  // Check if API key is configured (allow empty for OpenAI compatible like Ollama)
  const isConfigured = config && config.api_key;

  return (
    <main className="container">
      <header className="app-header">
        <h1>LitReview Pro</h1>
        <button 
          className="settings-btn" 
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      {configLoading ? (
        <div className="loading">Loading configuration...</div>
      ) : !isConfigured ? (
        <div className="setup-prompt">
          <p>Please configure your LLM provider to get started.</p>
          <button onClick={() => setSettingsOpen(true)}>Open Settings</button>
        </div>
      ) : (
        <>
          <div className="provider-info">
            <span className="provider-badge">{config.provider}</span>
            <span className="provider-type-badge">{config.provider_type}</span>
            <span className="model-name">{config.model}</span>
          </div>

          <form className="prompt-form" onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
              disabled={loading}
            />
            <div className="form-actions">
              <button type="submit" disabled={loading || !prompt.trim()}>
                {loading ? "Generating..." : "Generate"}
              </button>
              {(content || error) && (
                <button type="button" onClick={reset} disabled={loading}>
                  Clear
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="error-box">
              <strong>Error:</strong> {error}
            </div>
          )}

          {(content || loading) && (
            <div className="output-section">
              <h3>Output {loading && <span className="cursor-blink">▌</span>}</h3>
              <div className="output-content">
                {content || (loading && <span className="placeholder">Waiting for response...</span>)}
              </div>
            </div>
          )}
        </>
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        appConfig={appConfig}
        configPath={configPath}
        saving={saving}
        onSaveAppConfig={saveAppConfig}
        onSetDefault={setDefaultProvider}
        onDeleteProvider={deleteProvider}
      />
    </main>
  );
}

export default App;
