import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface LlmStreamEvent {
  stream_id: string;
  delta: string;
  done: boolean;
  error?: string;
}

// Provider configuration for TOML file
export interface ProviderConfig {
  provider_type: string;  // "openai" | "claude" | "gemini"
  base_url: string;
  api_key: string;
  model: string;
  context_window?: number;
  api_version?: string;  // Required for Claude
}

// Full app configuration
export interface AppConfig {
  default: string;  // Name of the active provider
  providers: Record<string, ProviderConfig>;
}

// Active LLM configuration (with provider name)
export interface LlmConfig {
  provider: string;       // Provider name (key in providers map)
  provider_type: string;  // "openai" | "claude" | "gemini"
  base_url: string;
  api_key: string;
  model: string;
  context_window?: number;
  api_version?: string;
}

export interface UseLlmStreamReturn {
  content: string;
  loading: boolean;
  error: string | null;
  streamId: string | null;
  startStream: (prompt: string, config: LlmConfig, systemPrompt?: string) => Promise<void>;
  reset: () => void;
}

export function useLlmStream(): UseLlmStreamReturn {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const activeStreamId = useRef<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Setup event listener on mount
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      unlistenRef.current = await listen<LlmStreamEvent>("llm-stream", (event) => {
        if (!mounted) return;
        
        const { stream_id, delta, done, error } = event.payload;
        
        // Only process events for the active stream
        if (stream_id !== activeStreamId.current) return;

        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        if (delta) {
          setContent((prev) => prev + delta);
        }

        if (done) {
          setLoading(false);
        }
      });
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  const startStream = useCallback(async (prompt: string, config: LlmConfig, systemPrompt?: string) => {
    // Reset state
    setContent("");
    setError(null);
    setLoading(true);

    try {
      const newStreamId = await invoke<string>("start_llm_stream", {
        config: {
          provider_type: config.provider_type,
          base_url: config.base_url,
          api_key: config.api_key,
          model: config.model,
          prompt,
          api_version: config.api_version,
          system_prompt: systemPrompt || null,
        },
      });

      activeStreamId.current = newStreamId;
      setStreamId(newStreamId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent("");
    setError(null);
    setLoading(false);
    setStreamId(null);
    activeStreamId.current = null;
  }, []);

  return {
    content,
    loading,
    error,
    streamId,
    startStream,
    reset,
  };
}
