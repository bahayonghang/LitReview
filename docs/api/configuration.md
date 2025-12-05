# API Configuration

This section covers the configuration options and API reference for LitReview Pro.

## Configuration Overview

LitReview Pro uses a TOML-based configuration system that supports multiple LLM providers. Configuration is stored locally and encrypted for security.

### Configuration File Location

- **Windows**: `%APPDATA%/LitReview/config.toml`
- **macOS**: `~/Library/Application Support/LitReview/config.toml`
- **Linux**: `~/.config/LitReview/config.toml`

## Provider Configuration

### OpenAI

```toml
[[providers]]
name = "OpenAI GPT-4"
provider_type = "openai"
api_key = "your-api-key-here"
model = "gpt-4"
base_url = "https://api.openai.com/v1"
max_tokens = 4096
temperature = 0.7
top_p = 1.0
frequency_penalty = 0.0
presence_penalty = 0.0
timeout = 30
```

**Parameters:**
- `api_key` (required): Your OpenAI API key
- `model` (required): Model name (gpt-3.5-turbo, gpt-4, gpt-4-turbo)
- `base_url` (optional): Custom API endpoint
- `max_tokens` (optional): Maximum tokens in response (default: 4096)
- `temperature` (optional): Randomness (0.0-2.0, default: 0.7)
- `top_p` (optional): Nucleus sampling (0.0-1.0, default: 1.0)
- `frequency_penalty` (optional): Reduce repetition (-2.0-2.0, default: 0.0)
- `presence_penalty` (optional): Encourage new topics (-2.0-2.0, default: 0.0)
- `timeout` (optional): Request timeout in seconds (default: 30)

### Anthropic Claude

```toml
[[providers]]
name = "Claude 3 Sonnet"
provider_type = "claude"
api_key = "your-api-key-here"
model = "claude-3-sonnet-20240229"
max_tokens = 4096
temperature = 0.7
top_p = 1.0
timeout = 30
```

**Parameters:**
- `api_key` (required): Your Anthropic API key
- `model` (required): Model name (claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307)
- `max_tokens` (optional): Maximum tokens in response (default: 4096)
- `temperature` (optional): Randomness (0.0-1.0, default: 0.7)
- `top_p` (optional): Nucleus sampling (0.0-1.0, default: 1.0)
- `timeout` (optional): Request timeout in seconds (default: 30)

### Google Gemini

```toml
[[providers]]
name = "Gemini Pro"
provider_type = "gemini"
api_key = "your-api-key-here"
model = "gemini-pro"
max_output_tokens = 4096
temperature = 0.7
top_p = 0.95
top_k = 40
timeout = 30
```

**Parameters:**
- `api_key` (required): Your Google API key
- `model` (required): Model name (gemini-pro, gemini-pro-vision)
- `max_output_tokens` (optional): Maximum output tokens (default: 4096)
- `temperature` (optional): Randomness (0.0-2.0, default: 0.7)
- `top_p` (optional): Nucleus sampling (0.0-1.0, default: 0.95)
- `top_k` (optional): Top-k sampling (1-40, default: 40)
- `timeout` (optional): Request timeout in seconds (default: 30)

### Ollama (Local Models)

```toml
[[providers]]
name = "Ollama Local"
provider_type = "ollama"
base_url = "http://localhost:11434"
model = "llama2"
max_tokens = 4096
temperature = 0.7
top_p = 1.0
timeout = 60
```

**Parameters:**
- `base_url` (required): Ollama server URL (default: http://localhost:11434)
- `model` (required): Local model name
- `max_tokens` (optional): Maximum tokens in response (default: 4096)
- `temperature` (optional): Randomness (0.0-2.0, default: 0.7)
- `top_p` (optional): Nucleus sampling (0.0-1.0, default: 1.0)
- `timeout` (optional): Request timeout in seconds (default: 60)

### Custom API Provider

```toml
[[providers]]
name = "Custom Provider"
provider_type = "custom"
api_key = "your-api-key-here"
base_url = "https://your-api-endpoint.com/v1"
model = "your-model-name"
max_tokens = 4096
temperature = 0.7
top_p = 1.0
timeout = 30
headers = { "Authorization" = "Bearer your-token" }
```

**Additional Parameters:**
- `headers` (optional): Custom HTTP headers as TOML table

## Global Configuration

```toml
[settings]
default_provider = "OpenAI GPT-4"
auto_save = true
save_interval = 30
max_history = 100
theme = "auto"
language = "en"
```

**Settings:**
- `default_provider`: Name of default provider from providers list
- `auto_save`: Enable automatic saving (true/false)
- `save_interval`: Auto-save interval in seconds
- `max_history`: Maximum history items to keep
- `theme`: UI theme (light, dark, auto)
- `language`: Interface language (en, zh-CN)

## API Key Management

### Security Features

1. **Local Storage**: API keys are stored locally on your device
2. **Encryption**: Keys are encrypted at rest
3. **No Cloud Sync**: Keys are never synced to cloud services
4. **Memory Protection**: Keys are cleared from memory after use

### Getting API Keys

#### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API keys section
4. Click "Create new secret key"
5. Copy and save your key

#### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API keys
4. Generate a new key
5. Copy and save your key

#### Google Gemini
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create an account or sign in
3. Generate an API key
4. Copy and save your key

## Environment Variables

You can also configure providers using environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="your-openai-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"

# Anthropic
export ANTHROPIC_API_KEY="your-claude-key"

# Google
export GOOGLE_API_KEY="your-gemini-key"

# Ollama
export OLLAMA_BASE_URL="http://localhost:11434"
```

## WebSocket API

LitReview Pro uses WebSocket for real-time communication between frontend and backend.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:1420/api/stream');
```

### Message Format

**Request:**
```json
{
  "id": "unique-request-id",
  "provider": "OpenAI GPT-4",
  "prompt": "Generate literature review on...",
  "options": {
    "temperature": 0.7,
    "max_tokens": 4096
  }
}
```

**Response:**
```json
{
  "id": "unique-request-id",
  "type": "chunk",
  "content": "Generated text chunk...",
  "done": false
}
```

**Complete:**
```json
{
  "id": "unique-request-id",
  "type": "complete",
  "total_tokens": 1234,
  "duration": 15.2
}
```

**Error:**
```json
{
  "id": "unique-request-id",
  "type": "error",
  "error": "API request failed",
  "code": "provider_error"
}
```

## REST API Endpoints

### Test Connection

```http
POST /api/test-connection
Content-Type: application/json

{
  "provider": "OpenAI GPT-4",
  "prompt": "Hello, world!"
}
```

**Response:**
```json
{
  "success": true,
  "latency": 1234,
  "model": "gpt-4"
}
```

### Generate Content

```http
POST /api/generate
Content-Type: application/json

{
  "provider": "OpenAI GPT-4",
  "prompt": "Generate literature review on...",
  "stream": false
}
```

**Response:**
```json
{
  "content": "Generated content...",
  "tokens": 1234,
  "duration": 15.2
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `invalid_config` | Invalid configuration format |
| `provider_not_found` | Specified provider not found |
| `api_key_invalid` | Invalid API key |
| `network_error` | Network connection error |
| `timeout` | Request timeout |
| `rate_limit` | API rate limit exceeded |
| `insufficient_quota` | API quota insufficient |
| `model_unavailable` | Model not available |
| `content_filter` | Content blocked by filter |

## Configuration Examples

### Multiple Providers

```toml
[[providers]]
name = "OpenAI GPT-4"
provider_type = "openai"
api_key = "sk-..."
model = "gpt-4"

[[providers]]
name = "Claude 3 Sonnet"
provider_type = "claude"
api_key = "sk-ant-..."
model = "claude-3-sonnet-20240229"

[[providers]]
name = "Ollama Local"
provider_type = "ollama"
base_url = "http://localhost:11434"
model = "llama2"
```

### Development Configuration

```toml
[settings]
default_provider = "Ollama Local"
auto_save = false
save_interval = 60
max_history = 50
theme = "dark"
language = "en"

[[providers]]
name = "Local Ollama"
provider_type = "ollama"
base_url = "http://localhost:11434"
model = "llama2"
temperature = 0.5
```

## Troubleshooting

### Common Issues

**API Key Not Working**
- Verify the key is correct and active
- Check if you have sufficient quota
- Ensure the key has necessary permissions

**Connection Timeout**
- Check your internet connection
- Verify the API endpoint URL
- Increase timeout value in configuration

**Rate Limiting**
- Reduce request frequency
- Use different API keys
- Upgrade your API plan

**Model Not Available**
- Check model availability for your provider
- Use a different model
- Update provider configuration

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export RUST_LOG=debug

# Or in configuration
[debug]
log_level = "debug"
save_logs = true
log_file = "/path/to/litreview.log"
```

---

For more advanced usage, see the [Streaming API](/api/streaming) and [Provider Examples](/api/providers) documentation.