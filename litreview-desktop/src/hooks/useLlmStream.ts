import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface LlmStreamEvent {
  stream_id: string;
  delta: string;
  done: boolean;
  error?: string;
}

export interface LlmConfig {
  provider: string;
  base_url: string;
  api_key: string;
  model: string;
  context_window?: number;
}

export interface UseLlmStreamReturn {
  content: string;
  loading: boolean;
  error: string | null;
  streamId: string | null;
  startStream: (prompt: string, config: LlmConfig) => Promise<void>;
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

  const startStream = useCallback(async (prompt: string, config: LlmConfig) => {
    // Reset state
    setContent("");
    setError(null);
    setLoading(true);

    try {
      const newStreamId = await invoke<string>("start_llm_stream", {
        provider: config.provider,
        baseUrl: config.base_url,
        apiKey: config.api_key,
        model: config.model,
        prompt,
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
