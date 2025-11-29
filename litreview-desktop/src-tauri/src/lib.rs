use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;
use uuid::Uuid;

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: String,      // "openai" | "gemini" | "ollama"
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub context_window: Option<u32>,
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

// ============================================================================
// Tauri Commands
// ============================================================================

/// Start a streaming LLM request
/// Returns stream_id immediately, emits 'llm-stream' events as data arrives
#[tauri::command]
async fn start_llm_stream(
    app: AppHandle,
    provider: String,
    base_url: String,
    api_key: String,
    model: String,
    prompt: String,
) -> Result<String, String> {
    let stream_id = Uuid::new_v4().to_string();
    let stream_id_clone = stream_id.clone();

    // Spawn async task to handle streaming
    tauri::async_runtime::spawn(async move {
        let result = match provider.as_str() {
            "openai" | "ollama" | "deepseek" | "moonshot" => {
                stream_openai_compatible(&app, &stream_id_clone, &base_url, &api_key, &model, &prompt).await
            }
            "gemini" => {
                stream_gemini(&app, &stream_id_clone, &base_url, &api_key, &model, &prompt).await
            }
            _ => Err(format!("Unsupported provider: {}", provider)),
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

/// Save LLM configuration to local store
#[tauri::command]
async fn save_config(app: AppHandle, config: LlmConfig) -> Result<(), String> {
    let store = app
        .store("config.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;
    
    store
        .set("llm_config", serde_json::to_value(&config).map_err(|e| e.to_string())?);
    
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;
    
    Ok(())
}

/// Load LLM configuration from local store
#[tauri::command]
async fn load_config(app: AppHandle) -> Result<Option<LlmConfig>, String> {
    let store = app
        .store("config.json")
        .map_err(|e| format!("Failed to open store: {}", e))?;
    
    match store.get("llm_config") {
        Some(value) => {
            let config: LlmConfig = serde_json::from_value(value.clone())
                .map_err(|e| format!("Failed to parse config: {}", e))?;
            Ok(Some(config))
        }
        None => Ok(None),
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
            save_config,
            load_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
