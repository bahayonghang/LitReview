# LitReview Pro Desktop - 技术实施方案

版本: v1.0

作者: Gemini (协助 Geekyhang)

日期: 2025-11-28

## 1. 项目概述 (Overview)

目标是将现有的 Web 版文献综述生成器迁移为跨平台桌面应用（Windows/macOS/Linux）。

核心变更点在于：

1. **运行环境**: 浏览器 -> Tauri (WebView + Rust Core)。
2. **模型层**: 仅支持 Gemini -> 支持 OpenAI 格式兼容的所有厂商 (OpenAI, Anthropic, DeepSeek, Ollama 等)。
3. **数据层**: 内存临时存储 -> 本地持久化配置。

## 2. 系统架构 (Architecture)

采用标准的 Tauri 架构，前后端分离，但在同一个可执行文件中。

```
+---------------------+       JSON-RPC        +----------------------+
|  Frontend (React)   | <-------------------> |   Backend (Rust)     |
+---------------------+   (Tauri Commands)    +----------------------+
| - UI Components     |                       | - HTTP Client (Reqwest)|
| - BibTeX Parser (JS)|                       | - API Key Management |
| - State (Zustand)   |                       | - File System Access |
| - Markdown Renderer |                       | - Model Adapters     |
+---------------------+                       +----------------------+
```

### 2.1 模块职责划分

- **纯前端 (JS/TS)**:
  - **界面交互**: 文件拖拽、配置表单、Toast 提示。
  - **BibTeX 解析**: 现有的 JS 解析器非常健壮，保留在前端执行，减少与 Rust 传输大文本的开销。
  - **参考文献生成**: 现有的“混合生成策略”（前端拼接）保留，确保格式准确。
- **Rust 后端 (Tauri Core)**:
  - **网络请求**: 代理所有的 LLM API 调用，规避 CORS 问题，支持流式响应（Streaming）。
  - **配置持久化**: 使用 `tauri-plugin-store` 保存用户的 API Key、Base URL 和模型偏好。

## 3. 多模型适配方案 (LLM Abstraction Layer)

为了支持“自定义不同类型的大模型服务商”，我们需要在 Rust 侧设计一个适配层。

### 3.1 配置数据结构

前端需要提供一个设置页面，允许用户配置以下 JSON 结构：

```
{
  "provider": "openai" | "gemini" | "anthropic" | "ollama",
  "baseUrl": "[https://api.openai.com/v1](https://api.openai.com/v1)", // 允许修改以支持中转/代理
  "apiKey": "sk-...",
  "modelName": "gpt-4o",
  "contextWindow": 128000
}
```

### 3.2 接口标准化

大多数现代大模型服务商（DeepSeek, Moonshot, Ollama, LocalAI）都兼容 **OpenAI Chat Completion API** 格式。因此，我们主要实现两种协议适配：

1. **OpenAI 兼容协议 (通用)**:
   - Headers: `Authorization: Bearer <KEY>`
   - Body: `messages: [...]`
2. **Google Gemini 原生协议**:
   - URL Param: `?key=<KEY>`
   - Body: `contents: [...]` (LitReview Pro 当前使用的格式)

## 4. 关键代码实现思路

### 4.1 Rust 依赖 (`Cargo.toml`)

不需要引入 Axum，只需要强大的 HTTP 客户端和序列化库。

```
[dependencies]
tauri = { version = "2.0", features = ["protocol-asset"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.11", features = ["json", "stream"] } # 核心网络库
tokio = { version = "1", features = ["full"] }
tauri-plugin-store = "2.0" # 用于保存配置
```

### 4.2 Rust 核心逻辑 (`main.rs`)

使用 Rust 处理网络请求，确保稳定性和性能。

```
// 示例代码：Rust 侧的大模型调用命令
#[tauri::command]
async fn call_llm(
    provider: String,
    base_url: String,
    api_key: String,
    model: String,
    prompt: String
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // 简单的策略模式
    let res = match provider.as_str() {
        "openai" | "ollama" => {
            // OpenAI 兼容格式调用
            client.post(format!("{}/chat/completions", base_url))
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&serde_json::json!({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                }))
                .send()
                .await
        },
        "gemini" => {
            // Google Gemini 格式调用
             client.post(format!("{}/models/{}:generateContent?key={}", base_url, model, api_key))
                .json(&serde_json::json!({
                    "contents": [{"parts": [{"text": prompt}]}]
                }))
                .send()
                .await
        },
        _ => return Err("Unsupported provider".to_string())
    };

    // 处理响应并提取文本...
    // (此处省略错误处理和JSON解析细节)
    Ok("Generated Text...".to_string())
}
```

## 5. 开发路线图 (Roadmap)

1. **环境准备**:
   - 安装 Rust, Node.js, Tauri CLI。
   - 运行 `npm create tauri-app@latest` 初始化项目。
2. **移植前端**:
   - 将当前的 `LitReviewApp.jsx` 复制到 Tauri 的 `src` 目录。
   - 移除 `fetch` 调用，替换为 `invoke('call_llm', { ... })`。
3. **UI 升级**:
   - 添加“设置”模态框 (Settings Modal)。
   - 实现表单：选择服务商 (Dropdown)、输入 Base URL (Input)、输入 Key (Password Input)。
4. **Rust 后端开发**:
   - 实现 `call_llm` 命令。
   - 调试 OpenAI 和 Gemini 两种协议的连通性。
5. **构建与发布**:
   - 运行 `tauri build` 生成 `.exe` (Windows) 或 `.dmg` (macOS)。

## 6. 总结

此方案不需要独立的后端服务（Axum），利用 **React + Tauri (Rust Command)** 即可完美实现。这不仅降低了打包体积（通常小于 10MB），还通过 Rust 提供了极高的执行效率和类型安全保障。