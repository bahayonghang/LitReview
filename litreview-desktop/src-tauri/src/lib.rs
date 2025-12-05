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

/// Configuration for streaming LLM requests
#[derive(Debug, Clone, Serialize, Deserialize)]
struct StreamRequestConfig {
    provider_type: String,
    base_url: String,
    api_key: String,
    model: String,
    prompt: String,
    api_version: Option<String>,
    system_prompt: Option<String>,
}

/// Configuration for provider-specific streaming
#[derive(Debug, Clone)]
struct ProviderStreamConfig<'a> {
    stream_id: &'a str,
    base_url: &'a str,
    api_key: &'a str,
    model: &'a str,
    prompt: &'a str,
    api_version: Option<&'a str>,
    system_prompt: Option<&'a str>,
}

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
    pub provider_type: String, // "openai" | "claude" | "gemini"
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_version: Option<String>, // Claude needs this
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
async fn start_llm_stream(app: AppHandle, config: StreamRequestConfig) -> Result<String, String> {
    println!("[Rust] start_llm_stream called");
    println!("[Rust] provider_type: {}", config.provider_type);
    println!("[Rust] model: {}", config.model);
    println!("[Rust] base_url: {}", config.base_url);
    println!("[Rust] prompt length: {}", config.prompt.len());
    println!(
        "[Rust] system_prompt: {:?}",
        config.system_prompt.as_ref().map(|s| s.len())
    );

    let stream_id = Uuid::new_v4().to_string();
    let stream_id_clone = stream_id.clone();

    // Spawn async task to handle streaming
    tauri::async_runtime::spawn(async move {
        let system = config.system_prompt.clone();
        println!(
            "[Rust] Spawned task, system_prompt len: {:?}",
            system.as_ref().map(|s| s.len())
        );
        let provider_config = ProviderStreamConfig {
            stream_id: &stream_id_clone,
            base_url: &config.base_url,
            api_key: &config.api_key,
            model: &config.model,
            prompt: &config.prompt,
            api_version: config.api_version.as_deref(),
            system_prompt: system.as_deref(),
        };

        let result = match config.provider_type.as_str() {
            "openai" => {
                stream_openai_compatible(
                    &app,
                    provider_config.stream_id,
                    provider_config.base_url,
                    provider_config.api_key,
                    provider_config.model,
                    provider_config.prompt,
                    provider_config.system_prompt,
                )
                .await
            }
            "claude" => stream_claude(&app, provider_config).await,
            "gemini" => {
                stream_gemini(
                    &app,
                    provider_config.stream_id,
                    provider_config.base_url,
                    provider_config.api_key,
                    provider_config.model,
                    provider_config.prompt,
                    provider_config.system_prompt,
                )
                .await
            }
            _ => Err(format!(
                "Unsupported provider type: {}",
                config.provider_type
            )),
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

    let config: AppConfig =
        toml::from_str(&content).map_err(|e| format!("Failed to parse config file: {}", e))?;

    Ok(config)
}

/// Save the full AppConfig to TOML file
#[tauri::command]
async fn save_toml_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app)?;

    let toml_str = toml::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, toml_str).map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

fn handle_gemini_json_response(
    app: &AppHandle,
    stream_id: &str,
    body_text: &str,
) -> Result<(), String> {
    let json: serde_json::Value =
        serde_json::from_str(body_text).map_err(|e| format!("Invalid JSON response: {}", e))?;

    if let Some(error) = json.get("error") {
        let message = error
            .get("message")
            .and_then(|m| m.as_str())
            .or_else(|| error.as_str())
            .unwrap_or("Unknown error");
        return Err(format!("API error: {}", message));
    }

    let mut emitted = false;

    if let Some(candidates) = json.get("candidates").and_then(|c| c.as_array()) {
        for candidate in candidates {
            if let Some(content) = candidate.get("content") {
                if let Some(parts) = content.get("parts").and_then(|p| p.as_array()) {
                    for part in parts {
                        if let Some(text) = part.get("text").and_then(|t| t.as_str()) {
                            emitted = true;
                            let _ = app.emit(
                                "llm-stream",
                                LlmStreamEvent {
                                    stream_id: stream_id.to_string(),
                                    delta: text.to_string(),
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

    if !emitted {
        // Emit raw body text as fallback
        let _ = app.emit(
            "llm-stream",
            LlmStreamEvent {
                stream_id: stream_id.to_string(),
                delta: body_text.to_string(),
                done: false,
                error: None,
            },
        );
    }

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

/// Test LLM connection with a minimal request (non-streaming)
/// Returns Ok(()) if connection succeeds, Err with details if it fails
#[tauri::command]
async fn test_llm_connection(
    provider_type: String,
    base_url: String,
    api_key: String,
    model: String,
    api_version: Option<String>,
) -> Result<(), String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    match provider_type.as_str() {
        "openai" => {
            let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
            let body = serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1,
                "temperature": 0.0
            });

            let mut request = client
                .post(&url)
                .header("Content-Type", "application/json")
                .json(&body);

            if !api_key.is_empty() {
                request = request.header("Authorization", format!("Bearer {}", api_key));
            }

            let response = request
                .send()
                .await
                .map_err(|e| format!("网络错误: {}", e))?;

            if response.status().is_success() {
                Ok(())
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                // Truncate error text to avoid huge messages
                let snippet = if error_text.len() > 200 {
                    format!("{}...", &error_text[..200])
                } else {
                    error_text
                };
                Err(format!("HTTP {}: {}", status, snippet))
            }
        }
        "claude" => {
            let url = format!("{}/v1/messages", base_url.trim_end_matches('/'));
            let version = api_version.unwrap_or_else(|| "2023-06-01".to_string());
            let body = serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 1
            });

            let response = client
                .post(&url)
                .header("Content-Type", "application/json")
                .header("x-api-key", &api_key)
                .header("anthropic-version", &version)
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("网络错误: {}", e))?;

            if response.status().is_success() {
                Ok(())
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                let snippet = if error_text.len() > 200 {
                    format!("{}...", &error_text[..200])
                } else {
                    error_text
                };
                Err(format!("HTTP {}: {}", status, snippet))
            }
        }
        "gemini" => {
            let url = format!(
                "{}/v1beta/models/{}:generateContent?key={}",
                base_url.trim_end_matches('/'),
                model,
                api_key
            );
            let body = serde_json::json!({
                "contents": [{
                    "parts": [{"text": "ping"}]
                }],
                "generationConfig": {
                    "maxOutputTokens": 1
                }
            });

            let response = client
                .post(&url)
                .header("Content-Type", "application/json")
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("网络错误: {}", e))?;

            if response.status().is_success() {
                Ok(())
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                let snippet = if error_text.len() > 200 {
                    format!("{}...", &error_text[..200])
                } else {
                    error_text
                };
                Err(format!("HTTP {}: {}", status, snippet))
            }
        }
        _ => Err(format!("不支持的 provider 类型: {}", provider_type)),
    }
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
    system_prompt: Option<&str>,
) -> Result<(), String> {
    let client = Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    // Build messages array with optional system prompt
    let mut messages = Vec::new();
    if let Some(system) = system_prompt {
        messages.push(serde_json::json!({"role": "system", "content": system}));
    }
    messages.push(serde_json::json!({"role": "user", "content": prompt}));

    let body = serde_json::json!({
        "model": model,
        "messages": messages,
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

    let is_sse = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.contains("text/event-stream"))
        .unwrap_or(false);

    if !is_sse {
        let body_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;
        return handle_openai_json_response(app, stream_id, &body_text);
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

fn handle_openai_json_response(
    app: &AppHandle,
    stream_id: &str,
    body_text: &str,
) -> Result<(), String> {
    let json: serde_json::Value =
        serde_json::from_str(body_text).map_err(|e| format!("Invalid JSON response: {}", e))?;

    if let Some(error) = json.get("error") {
        let message = error
            .get("message")
            .and_then(|m| m.as_str())
            .or_else(|| error.as_str())
            .unwrap_or("Unknown error");
        return Err(format!("API error: {}", message));
    }

    let mut emitted = false;

    if let Some(choices) = json.get("choices").and_then(|c| c.as_array()) {
        for choice in choices {
            if let Some(message_content) = choice
                .get("message")
                .and_then(|message| message.get("content"))
                .and_then(|content| content.as_str())
            {
                emitted = true;
                let _ = app.emit(
                    "llm-stream",
                    LlmStreamEvent {
                        stream_id: stream_id.to_string(),
                        delta: message_content.to_string(),
                        done: false,
                        error: None,
                    },
                );
            } else if let Some(text) = choice.get("text").and_then(|text| text.as_str()) {
                emitted = true;
                let _ = app.emit(
                    "llm-stream",
                    LlmStreamEvent {
                        stream_id: stream_id.to_string(),
                        delta: text.to_string(),
                        done: false,
                        error: None,
                    },
                );
            }
        }
    }

    if !emitted {
        if let Some(result) = json
            .get("result")
            .and_then(|value| value.get("response"))
            .and_then(|value| value.as_str())
        {
            emitted = true;
            let _ = app.emit(
                "llm-stream",
                LlmStreamEvent {
                    stream_id: stream_id.to_string(),
                    delta: result.to_string(),
                    done: false,
                    error: None,
                },
            );
        }
    }

    if !emitted {
        // Emit raw body text to help with debugging unknown response formats
        let _ = app.emit(
            "llm-stream",
            LlmStreamEvent {
                stream_id: stream_id.to_string(),
                delta: body_text.to_string(),
                done: false,
                error: None,
            },
        );
    }

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
    system_prompt: Option<&str>,
) -> Result<(), String> {
    let client = Client::new();
    let url = format!(
        "{}/v1beta/models/{}:streamGenerateContent?key={}&alt=sse",
        base_url.trim_end_matches('/'),
        model,
        api_key
    );

    // Build body with optional system instruction
    let mut body = serde_json::json!({
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.3
        }
    });

    // Add system instruction if provided
    if let Some(system) = system_prompt {
        body["systemInstruction"] = serde_json::json!({
            "parts": [{"text": system}]
        });
    }

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

    let is_sse = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.contains("text/event-stream"))
        .unwrap_or(false);

    if !is_sse {
        let body_text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;
        return handle_gemini_json_response(app, stream_id, &body_text);
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
async fn stream_claude(app: &AppHandle, config: ProviderStreamConfig<'_>) -> Result<(), String> {
    let api_version = config.api_version.unwrap_or("2023-06-01");
    let client = Client::new();
    let url = format!("{}/v1/messages", config.base_url.trim_end_matches('/'));

    // Build body with optional system prompt
    let mut body = serde_json::json!({
        "model": config.model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": config.prompt}],
        "stream": true
    });

    // Add system prompt if provided (Claude uses top-level "system" field)
    if let Some(system) = config.system_prompt {
        body["system"] = serde_json::json!(system);
    }

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("x-api-key", config.api_key)
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
                                                stream_id: config.stream_id.to_string(),
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
                                    stream_id: config.stream_id.to_string(),
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
            stream_id: config.stream_id.to_string(),
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
            set_default_provider,
            test_llm_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
