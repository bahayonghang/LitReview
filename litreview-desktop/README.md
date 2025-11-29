# LitReview Pro Desktop

跨平台桌面版文献综述生成器，支持多种 LLM 服务商。

## 功能特性

- **流式输出**：实时显示 LLM 生成内容（打字机效果）
- **多模型支持**：
  - OpenAI (GPT-4o, GPT-4, GPT-3.5)
  - Ollama (本地模型)
  - Google Gemini
  - DeepSeek
  - Moonshot
  - 任何 OpenAI 兼容 API
- **本地配置持久化**：API Key 和设置保存在本地
- **跨平台**：Windows / macOS / Linux

## 开发环境

### 前置要求

- Node.js 18+
- Rust 1.70+
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### 安装依赖

```bash
cd litreview-desktop
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

## 配置示例

### OpenAI

- **Provider**: openai
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: `sk-...`
- **Model**: `gpt-4o`

### Ollama (本地模型)

1. 安装并启动 [Ollama](https://ollama.ai/)
2. 拉取模型：`ollama pull llama3.2`
3. 配置：
   - **Provider**: ollama
   - **Base URL**: `http://localhost:11434/v1`
   - **API Key**: (留空)
   - **Model**: `llama3.2`

### Google Gemini

- **Provider**: gemini
- **Base URL**: `https://generativelanguage.googleapis.com`
- **API Key**: 从 [Google AI Studio](https://aistudio.google.com/) 获取
- **Model**: `gemini-1.5-flash`

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Tauri 2.0 + Rust
- **HTTP Client**: reqwest (支持流式响应)
- **存储**: tauri-plugin-store

## 许可证

MIT
