use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

// ============================================================================
// Data Structures
// ============================================================================

// ============================================================================
// TOML Configuration Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub default: String,
    pub providers: HashMap<String, ProviderConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    #[serde(rename = "type")]
    pub provider_type: String,  // "openai" | "claude" | "gemini"
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_version: Option<String>,  // Claude needs this
}

// Legacy struct for backward compatibility with frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: String,      // provider name (key in providers map)
    pub provider_type: String, // "openai" | "claude" | "gemini"
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmStreamEvent {
    pub stream_id: String,
    pub delta: String,
    pub done: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    delta: Option<OpenAIDelta>,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIDelta {
    content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIStreamResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiContent>,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
    parts: Option<Vec<GeminiPart>>,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiStreamResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

// Claude (Anthropic) streaming structures
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ClaudeStreamEvent {
    #[serde(rename = "type")]
    event_type: String,
    delta: Option<ClaudeDelta>,
    content_block: Option<ClaudeContentBlock>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ClaudeDelta {
    #[serde(rename = "type")]
    delta_type: Option<String>,
    text: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ClaudeContentBlock {
    #[serde(rename = "type")]
    block_type: Option<String>,
    text: Option<String>,
}

// ============================================================================
// Configuration Helpers
// ============================================================================

fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?;
    
    // In development, use the project directory
    // In production, use resource directory
    let config_path = if cfg!(debug_assertions) {
        // Development: use project root
        let mut path = resource_dir.clone();
        // Go up from src-tauri to project root
        path.pop(); // Remove "src-tauri"
        path.push("config.toml");
        path
    } else {
        // Production: use resource directory
        resource_dir.join("config.toml")
    };
    
    Ok(config_path)
}

fn get_default_config() -> AppConfig {
    let mut providers = HashMap::new();
    
    providers.insert(
        "openai".to_string(),
        ProviderConfig {
            provider_type: "openai".to_string(),
            base_url: "https://api.openai.com/v1".to_string(),
            api_key: String::new(),
            model: "gpt-4o".to_string(),
            context_window: Some(128000),
            api_version: None,
        },
    );
    
    providers.insert(
        "claude".to_string(),
        ProviderConfig {
            provider_type: "claude".to_string(),
            base_url: "https://api.anthropic.com".to_string(),
            api_key: String::new(),
            model: "claude-sonnet-4-20250514".to_string(),
            context_window: Some(200000),
            api_version: Some("2023-06-01".to_string()),
        },
    );
    
    providers.insert(
        "gemini".to_string(),
        ProviderConfig {
            provider_type: "gemini".to_string(),
            base_url: "https://generativelanguage.googleapis.com".to_string(),
            api_key: String::new(),
            model: "gemini-1.5-flash".to_string(),
            context_window: Some(1000000),
            api_version: None,
        },
    );
    
    AppConfig {
        default: "openai".to_string(),
        providers,
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Start a streaming LLM request
/// Returns stream_id immediately, emits 'llm-stream' events as data arrives
#[tauri::command]
async fn start_llm_stream(
    app: AppHandle,
    provider_type: String,
    base_url: String,
    api_key: String,
    model: String,
    prompt: String,
    api_version: Option<String>,
) -> Result<String, String> {
    let stream_id = Uuid::new_v4().to_string();
    let stream_id_clone = stream_id.clone();

    // Spawn async task to handle streaming
    tauri::async_runtime::spawn(async move {
        let result = match provider_type.as_str() {
            "openai" => {
                stream_openai_compatible(&app, &stream_id_clone, &base_url, &api_key, &model, &prompt).await
            }
            "claude" => {
                let version = api_version.unwrap_or_else(|| "2023-06-01".to_string());
                stream_claude(&app, &stream_id_clone, &base_url, &api_key, &model, &prompt, &version).await
            }
            "gemini" => {
                stream_gemini(&app, &stream_id_clone, &base_url, &api_key, &model, &prompt).await
            }
            _ => Err(format!("Unsupported provider type: {}", provider_type)),
        };

        if let Err(e) = result {
            let _ = app.emit(
                "llm-stream",
                LlmStreamEvent {
                    stream_id: stream_id_clone,
                    delta: String::new(),
                    done: true,
                    error: Some(e),
                },
            );
        }
    });

    Ok(stream_id)
}

/// Get the path to the TOML config file
#[tauri::command]
async fn get_config_file_path(app: AppHandle) -> Result<String, String> {
    let path = get_config_path(&app)?;
    Ok(path.to_string_lossy().to_string())
}

/// Load the full AppConfig from TOML file
#[tauri::command]
async fn load_toml_config(app: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(&app)?;
    
    if !config_path.exists() {
        // Create default config if not exists
        let default_config = get_default_config();
        let toml_str = toml::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize default config: {}", e))?;
        fs::write(&config_path, toml_str)
            .map_err(|e| format!("Failed to write default config: {}", e))?;
        return Ok(default_config);
    }
    
    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    let config: AppConfig = toml::from_str(&content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    
    Ok(config)
}

/// Save the full AppConfig to TOML file
#[tauri::command]
async fn save_toml_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app)?;
    
    let toml_str = toml::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, toml_str)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}

/// Get the current active LLM config (for backward compatibility)
#[tauri::command]
async fn get_active_config(app: AppHandle) -> Result<Option<LlmConfig>, String> {
    let app_config = load_toml_config(app).await?;
    
    let provider_name = &app_config.default;
    match app_config.providers.get(provider_name) {
        Some(provider) => Ok(Some(LlmConfig {
            provider: provider_name.clone(),
            provider_type: provider.provider_type.clone(),
            base_url: provider.base_url.clone(),
            api_key: provider.api_key.clone(),
            model: provider.model.clone(),
            context_window: provider.context_window,
            api_version: provider.api_version.clone(),
        })),
        None => Ok(None),
    }
}

/// Set the default (active) provider
#[tauri::command]
async fn set_default_provider(app: AppHandle, provider_name: String) -> Result<(), String> {
    let mut config = load_toml_config(app.clone()).await?;
    
    if !config.providers.contains_key(&provider_name) {
        return Err(format!("Provider '{}' not found in config", provider_name));
    }
    
    config.default = provider_name;
    save_toml_config(app, config).await
}

// ============================================================================
// Streaming Implementations
// ============================================================================

/// Stream from OpenAI-compatible API (OpenAI, Ollama, DeepSeek, Moonshot, etc.)
async fn stream_openai_compatible(
    app: &AppHandle,
    stream_id: &str,
    base_url: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": true,
        "temperature": 0.3
    });

    let mut request = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body);

    // Add auth header if api_key is provided (Ollama may not need it)
    if !api_key.is_empty() {
        request = request.header("Authorization", format!("Bearer {}", api_key));
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, error_text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        buffer.push_str(&chunk_str);

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line.starts_with(':') {
                continue;
            }

            if line == "data: [DONE]" {
                let _ = app.emit(
                    "llm-stream",
                    LlmStreamEvent {
                        stream_id: stream_id.to_string(),
                        delta: String::new(),
                        done: true,
                        error: None,
                    },
                );
                return Ok(());
            }

            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(parsed) = serde_json::from_str::<OpenAIStreamResponse>(data) {
                    for choice in parsed.choices {
                        if let Some(delta) = choice.delta {
                            if let Some(content) = delta.content {
                                if !content.is_empty() {
                                    let _ = app.emit(
                                        "llm-stream",
                                        LlmStreamEvent {
                                            stream_id: stream_id.to_string(),
                                            delta: content,
                                            done: false,
                                            error: None,
                                        },
                                    );
                                }
                            }
                        }
                        if choice.finish_reason.is_some() {
                            let _ = app.emit(
                                "llm-stream",
                                LlmStreamEvent {
                                    stream_id: stream_id.to_string(),
                                    delta: String::new(),
                                    done: true,
                                    error: None,
                                },
                            );
                            return Ok(());
                        }
                    }
                }
            }
        }
    }

    // Send done if stream ends without explicit [DONE]
    let _ = app.emit(
        "llm-stream",
        LlmStreamEvent {
            stream_id: stream_id.to_string(),
            delta: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(())
}

/// Stream from Google Gemini API
async fn stream_gemini(
    app: &AppHandle,
    stream_id: &str,
    base_url: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = Client::new();
    let url = format!(
        "{}/v1beta/models/{}:streamGenerateContent?key={}&alt=sse",
        base_url.trim_end_matches('/'),
        model,
        api_key
    );

    let body = serde_json::json!({
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.3
        }
    });

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, error_text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        buffer.push_str(&chunk_str);

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line.starts_with(':') {
                continue;
            }

            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(parsed) = serde_json::from_str::<GeminiStreamResponse>(data) {
                    if let Some(candidates) = parsed.candidates {
                        for candidate in candidates {
                            if let Some(content) = candidate.content {
                                if let Some(parts) = content.parts {
                                    for part in parts {
                                        if let Some(text) = part.text {
                                            if !text.is_empty() {
                                                let _ = app.emit(
                                                    "llm-stream",
                                                    LlmStreamEvent {
                                                        stream_id: stream_id.to_string(),
                                                        delta: text,
                                                        done: false,
                                                        error: None,
                                                    },
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Send done when stream ends
    let _ = app.emit(
        "llm-stream",
        LlmStreamEvent {
            stream_id: stream_id.to_string(),
            delta: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(())
}

/// Stream from Claude (Anthropic) API
async fn stream_claude(
    app: &AppHandle,
    stream_id: &str,
    base_url: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
    api_version: &str,
) -> Result<(), String> {
    let client = Client::new();
    let url = format!("{}/v1/messages", base_url.trim_end_matches('/'));

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}],
        "stream": true
    });

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("x-api-key", api_key)
        .header("anthropic-version", api_version)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", status, error_text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream error: {}", e))?;
        let chunk_str = String::from_utf8_lossy(&chunk);
        buffer.push_str(&chunk_str);

        // Process complete SSE lines
        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line.starts_with(':') {
                continue;
            }

            // Claude SSE format: event: xxx\ndata: {...}
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(parsed) = serde_json::from_str::<ClaudeStreamEvent>(data) {
                    match parsed.event_type.as_str() {
                        "content_block_delta" => {
                            if let Some(delta) = parsed.delta {
                                if let Some(text) = delta.text {
                                    if !text.is_empty() {
                                        let _ = app.emit(
                                            "llm-stream",
                                            LlmStreamEvent {
                                                stream_id: stream_id.to_string(),
                                                delta: text,
                                                done: false,
                                                error: None,
                                            },
                                        );
                                    }
                                }
                            }
                        }
                        "message_stop" => {
                            let _ = app.emit(
                                "llm-stream",
                                LlmStreamEvent {
                                    stream_id: stream_id.to_string(),
                                    delta: String::new(),
                                    done: true,
                                    error: None,
                                },
                            );
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    // Send done when stream ends
    let _ = app.emit(
        "llm-stream",
        LlmStreamEvent {
            stream_id: stream_id.to_string(),
            delta: String::new(),
            done: true,
            error: None,
        },
    );

    Ok(())
}

// ============================================================================
// App Entry Point
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            start_llm_stream,
            get_config_file_path,
            load_toml_config,
            save_toml_config,
            get_active_config,
            set_default_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
