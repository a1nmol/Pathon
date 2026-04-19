"use client";

import { useState, useCallback, useRef } from "react";

export type StreamMessage = {
  role: "user" | "assistant" | "interviewer" | "hiring_manager";
  content: string;
};

export function useStreamingChat(apiRoute: string) {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      userContent: string,
      userRole: StreamMessage["role"],
      payload: Record<string, unknown>,
    ) => {
      if (isStreaming) return;

      const userMessage: StreamMessage = { role: userRole, content: userContent };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");
      setIsStreaming(true);

      abortRef.current = new AbortController();

      try {
        const res = await fetch(apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Something went wrong. Please try again." },
          ]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingContent(accumulated);
        }

        if (accumulated.includes("__ERROR__:")) {
          const errMsg = accumulated.split("__ERROR__:")[1].trim();
          setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Connection error. Please try again." },
          ]);
        }
      } finally {
        setStreamingContent("");
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [apiRoute, isStreaming],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent("");
    setIsStreaming(false);
  }, []);

  return { messages, setMessages, streamingContent, isStreaming, sendMessage, reset };
}
