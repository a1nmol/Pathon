"use client";

/**
 * MentorInterface
 *
 * Presents mentor guidance as deliberate, professional statements — not chat.
 * Includes a collapsible sidebar showing the user's career paths as context.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { MentorMessage } from "@/types/mentor";
import type { CareerPath } from "@/types/decisions";
import { CAREER_MODES, MODE_STORAGE_KEY, DEFAULT_MODE, type CareerMode } from "@/types/mode";
import {
  loadMentorConversation,
  saveMentorConversation,
  clearMentorConversation,
  type StoredMessage,
} from "@/app/actions/conversations";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// ─── Types ────────────────────────────────────────────────────────────────────

type Turn =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      paragraphs: string[];
      visibleCount: number;
    };

type SessionStatus = "idle" | "waiting" | "revealing" | "done" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const PARAGRAPH_FADE_MS = 500;
const PARAGRAPH_PAUSE_MS = 420;
const PARAGRAPH_DELAY_MS = PARAGRAPH_FADE_MS + PARAGRAPH_PAUSE_MS;

const SCENARIO_PROMPTS = [
  "I'm thinking of leaving my current role. I don't have a plan yet.",
  "I've been offered a promotion but it moves me away from the work I actually do.",
  "I've been applying for three months with no traction. Something is wrong but I don't know what.",
  "Someone I respect told me I'm not ready for the next level. I disagree.",
  "I want to change industries but I have no contacts and no direct experience.",
];

const PATH_COLORS: Record<string, string> = {
  aligned:    "var(--text-2)",
  partial:    "var(--text-3)",
  misaligned: "var(--text-4)",
};

// ─── MentorInterface ──────────────────────────────────────────────────────────

export function MentorInterface({
  userId,
  paths = [],
}: {
  userId: string;
  paths?: CareerPath[];
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasTurns = turns.length > 0;
  const [careerMode, setCareerMode] = useState<CareerMode>(DEFAULT_MODE);

  useEffect(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as CareerMode | null;
    if (stored && stored in CAREER_MODES) setCareerMode(stored);
  }, []);

  // Load past conversation on mount
  useEffect(() => {
    loadMentorConversation().then((messages) => {
      if (messages.length > 0) {
        const restored: Turn[] = messages.map((m) => {
          if (m.role === "user") return { role: "user" as const, content: m.content };
          const paragraphs = m.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
          return { role: "assistant" as const, paragraphs, visibleCount: paragraphs.length };
        });
        setTurns(restored);
        setHistoryLoaded(true);
      }
      setLoadingHistory(false);
    }).catch(() => setLoadingHistory(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    const last = turns[turns.length - 1];
    if (!last || last.role !== "assistant") return;
    if (last.visibleCount >= last.paragraphs.length) {
      setStatus("done");
      return;
    }
    setStatus("revealing");
    const t = setTimeout(() => {
      setTurns((prev) => {
        const updated = [...prev];
        const lastTurn = updated[updated.length - 1];
        if (!lastTurn || lastTurn.role !== "assistant") return prev;
        return [
          ...updated.slice(0, -1),
          { ...lastTurn, visibleCount: lastTurn.visibleCount + 1 },
        ];
      });
    }, PARAGRAPH_DELAY_MS);
    return () => clearTimeout(t);
  }, [turns]);

  const submit = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || status === "waiting" || status === "revealing") return;

      setInput("");
      setErrorMessage(null);
      setStatus("waiting");

      const history: MentorMessage[] = turns.flatMap((t): MentorMessage[] => {
        if (t.role === "user") return [{ role: "user", content: t.content }];
        return [{ role: "assistant", content: t.paragraphs.join("\n\n") }];
      });

      setTurns((prev) => [...prev, { role: "user", content: trimmed }]);

      try {
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message: trimmed, history, mode: careerMode }),
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(body.error ?? "Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
        }

        if (buffer.includes("__ERROR__:")) {
          const errMsg = buffer.split("__ERROR__:")[1]?.trim() ?? "Unknown error";
          throw new Error(errMsg);
        }

        const paragraphs = buffer
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        if (!paragraphs.length) throw new Error("Empty response from mentor.");

        // Build new turns outside the state updater to avoid calling
        // server actions during the render phase (causes Router setState warning).
        const assistantTurn = { role: "assistant" as const, paragraphs, visibleCount: 0 };
        setTurns((prev) => [...prev, assistantTurn]);

        // Persist after state update — fire and forget
        const toStore: StoredMessage[] = [
          ...turns,
          { role: "user", content: trimmed },
          { role: "assistant", content: paragraphs.join("\n\n") },
        ].flatMap((t): StoredMessage[] => {
          if (t.role === "user") return [{ role: "user", content: t.content }];
          return [{ role: "assistant", content: t.paragraphs.join("\n\n") }];
        });
        saveMentorConversation(toStore).catch(() => {/* silent */});
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setErrorMessage(msg);
        setStatus("error");
      }
    },
    [status, turns, userId, careerMode],
  );

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  const isBlocked = status === "waiting" || status === "revealing";
  const isEmpty = turns.length === 0;

  const [voiceInterim, setVoiceInterim] = useState("");
  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        setInput((prev) => (prev ? prev + " " + transcript : transcript).trim());
        setVoiceInterim("");
      } else {
        setVoiceInterim(transcript);
      }
    },
  });

  async function handleClearHistory() {
    await clearMentorConversation();
    setTurns([]);
    setHistoryLoaded(false);
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        paddingLeft: "var(--sidebar-w, 68px)",
        transition: "padding-left 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* ── Paths sidebar (right) ──────────────────────────────────────────── */}
      {paths.length > 0 && (
        <>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              position: "fixed",
              top: "1.5rem",
              right: "1.5rem",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
              padding: "5px 10px",
              zIndex: 50,
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            {sidebarOpen ? "close" : "paths"}
          </button>

          <aside
            style={{
              position: "fixed",
              top: 0, right: 0, bottom: 0,
              width: "260px",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              padding: "5rem 1.5rem 2rem",
              overflowY: "auto",
              transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: 40,
            }}
          >
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              marginBottom: "2rem",
            }}>
              your paths
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {paths.map((path, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: PATH_COLORS[path.alignment] ?? "var(--text-4)",
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.55rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: PATH_COLORS[path.alignment] ?? "var(--text-4)",
                    }}>
                      {path.alignment}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "0.85rem",
                    color: "var(--text-3)",
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 300,
                  }}>
                    {path.name}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            maxWidth: "680px",
            width: "100%",
            margin: "0 auto",
            padding: "4.5rem 2rem 16rem",
          }}
        >
          {/* ── Page header ── */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            paddingBottom: "1.5rem",
            marginBottom: "2.5rem",
            borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--copper)",
                opacity: 0.6,
                margin: "0 0 0.5rem",
              }}>
                AI Mentor
              </p>
              <p style={{
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontStyle: "italic",
                fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
                fontWeight: 300,
                color: "var(--text-2)",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.35,
              }}>
                A voice that challenges your reasoning.
              </p>
            </div>

            {/* Mentor | Debate segmented control */}
            <div style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: 3,
              flexShrink: 0,
              alignSelf: "flex-start",
              gap: 2,
            }}>
              {/* Mentor — active pill */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 6,
                fontFamily: "'DM Mono', monospace",
                fontSize: 10.5,
                letterSpacing: "0.07em",
                background: "var(--surface-2)",
                color: "var(--text-1)",
                border: "1px solid var(--border-2)",
                userSelect: "none",
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--copper)",
                  display: "inline-block",
                  flexShrink: 0,
                }} />
                Mentor
              </div>
              {/* Debate — link pill */}
              <a
                href="/mentor/debate"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.07em",
                  color: "var(--text-2)",
                  textDecoration: "none",
                  transition: "color 0.18s, background 0.18s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--indigo)";
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--indigo-dim)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                Debate
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                  <path d="M2 10L10 2M10 2H5M10 2v5" />
                </svg>
              </a>
            </div>
          </div>

          {/* History restored notice */}
          {historyLoaded && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem",
              padding: "0.45rem 0.85rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
            }}>
              <span style={{ color: "var(--copper)", opacity: 0.5, fontSize: "0.7rem", letterSpacing: 0 }}>⌁</span>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.07em",
                color: "var(--text-4)",
              }}>
                conversation restored from previous session —{" "}
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-3)", fontSize: "inherit",
                    fontFamily: "inherit", letterSpacing: "inherit",
                    padding: 0, textDecoration: "underline",
                    textDecorationColor: "var(--border-2)",
                  }}
                >
                  clear
                </button>
              </span>
            </div>
          )}

          {/* Loading history */}
          {loadingHistory && (
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", padding: "3rem 0" }}>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>
          )}

          {/* ── Empty state: scenario prompts ── */}
          {isEmpty && !loadingHistory && (
            <div style={{ paddingTop: "1rem" }}>
              {/* Divider with label */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.75rem",
              }}>
                <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-4)",
                }}>
                  start a conversation
                </span>
                <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.65rem",
              }}>
                {SCENARIO_PROMPTS.map((prompt, i) => (
                  <button
                    key={prompt}
                    onClick={() => submit(prompt)}
                    disabled={isBlocked}
                    className="scenario-prompt"
                    style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                  >
                    <p style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.85rem",
                      color: "var(--text-3)",
                      lineHeight: 1.6,
                      margin: 0,
                      fontWeight: 400,
                    }}>
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Conversation turns ── */}
          {turns.map((turn, i) => {
            const stepsFromEnd = turns.length - 1 - i;
            const turnOpacity = stepsFromEnd === 0 ? 1 : stepsFromEnd === 1 ? 0.72 : 0.48;

            if (turn.role === "user") {
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "2rem",
                    marginTop: i === 0 ? "2rem" : "1.5rem",
                    opacity: turnOpacity,
                    transition: "opacity 0.4s ease",
                  }}
                >
                  <div style={{
                    maxWidth: "75%",
                    padding: "0.7rem 1.1rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border-2)",
                    borderRadius: "10px 10px 3px 10px",
                    fontSize: "0.95rem",
                    color: "var(--text-2)",
                    lineHeight: 1.7,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 400,
                  }}>
                    {turn.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  marginBottom: "3.5rem",
                  opacity: turnOpacity,
                  transition: "opacity 0.4s ease",
                }}
              >
                {/* Mentor marker */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.1rem",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(201,168,108,0.12)",
                    border: "1px solid rgba(201,168,108,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 8, color: "var(--copper)", lineHeight: 1 }}>✦</span>
                  </div>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.55rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--copper)",
                    opacity: 0.6,
                  }}>
                    Mentor
                  </span>
                </div>

                {/* Response paragraphs with left accent bar */}
                <div style={{ display: "flex", gap: "1.5rem", paddingLeft: "0.25rem" }}>
                  <div style={{
                    width: 2,
                    background: "linear-gradient(to bottom, rgba(201,168,108,0.3), transparent)",
                    flexShrink: 0,
                    alignSelf: "stretch",
                    minHeight: "2.5rem",
                    borderRadius: 2,
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", flex: 1 }}>
                    {turn.paragraphs.slice(0, turn.visibleCount).map((para, pi) => (
                      <MentorParagraph key={pi} text={para} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Error */}
          {status === "error" && errorMessage && (
            <div style={{
              marginTop: "1.5rem",
              padding: "0.85rem 1rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderLeft: "2px solid var(--red)",
              borderRadius: "0 6px 6px 0",
            }}>
              <p style={{
                fontSize: "0.85rem",
                color: "var(--text-3)",
                lineHeight: 1.6,
                fontFamily: "Inter, system-ui, sans-serif",
                margin: "0 0 0.5rem",
              }}>
                {errorMessage}
              </p>
              <button
                onClick={() => { setStatus("idle"); setErrorMessage(null); }}
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-4)",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.06em",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textDecorationColor: "var(--border)",
                }}
              >
                dismiss
              </button>
            </div>
          )}

          {/* Thinking indicator */}
          {status === "waiting" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1.25rem 0",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "rgba(201,168,108,0.08)",
                border: "1px solid rgba(201,168,108,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 7, color: "var(--copper)", opacity: 0.6 }}>✦</span>
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Fixed input bar ─────────────────────────────────────────────── */}
        {/* Outer wrapper inherits sidebar offset so max-width centering is correct */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            paddingLeft: "var(--sidebar-w, 68px)",
            transition: "padding-left 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            zIndex: 10,
          }}
        >
          {/* Scrim — uses design-token bg color, no hardcoded hex */}
          <div style={{
            background: "linear-gradient(to top, var(--bg) 65%, transparent)",
            paddingTop: "2.5rem",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            paddingBottom: "2.25rem",
          }}>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>

              {/* Voice interim preview */}
              {isListening && voiceInterim && (
                <div style={{
                  marginBottom: "0.5rem",
                  padding: "0.5rem 0.85rem",
                  background: "rgba(201,168,108,0.05)",
                  border: "1px solid rgba(201,168,108,0.15)",
                  borderRadius: "8px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--copper)",
                  opacity: 0.85,
                  fontStyle: "italic",
                }}>
                  {voiceInterim}
                </div>
              )}

              {/* Textarea + mic */}
              <div style={{ position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isBlocked}
                  placeholder={
                    isListening ? "Listening…"
                    : isEmpty ? "Say what's on your mind."
                    : isBlocked ? ""
                    : "Continue the conversation."
                  }
                  rows={1}
                  style={{
                    width: "100%",
                    resize: "none",
                    background: "var(--surface)",
                    outline: "none",
                    border: `1px solid ${isListening ? "rgba(201,168,108,0.5)" : "var(--border-2)"}`,
                    borderRadius: 10,
                    color: "var(--text-1)",
                    fontSize: "0.95rem",
                    fontFamily: "Inter, system-ui, sans-serif",
                    lineHeight: 1.7,
                    padding: "0.9rem 3.25rem 0.9rem 1.1rem",
                    caretColor: "var(--copper)",
                    opacity: isBlocked ? 0.4 : 1,
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s, opacity 0.25s",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(201,168,108,0.35)";
                    (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 0 0 3px rgba(201,168,108,0.07)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLTextAreaElement).style.borderColor = isListening ? "rgba(201,168,108,0.5)" : "var(--border-2)";
                    (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none";
                  }}
                />

                {/* Mic button */}
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isBlocked}
                    title={isListening ? "Stop listening" : "Speak your message"}
                    style={{
                      position: "absolute",
                      right: "0.7rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      border: isListening
                        ? "1px solid rgba(201,168,108,0.5)"
                        : "1px solid var(--border-2)",
                      background: isListening ? "rgba(201,168,108,0.1)" : "transparent",
                      cursor: isBlocked ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={isListening ? "var(--copper)" : "var(--text-3)"}
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Bottom row: hint + actions */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.6rem",
              }}>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.06em",
                  color: "var(--text-4)",
                  opacity: isBlocked ? 0 : 1,
                  transition: "opacity 0.25s",
                  margin: 0,
                }}>
                  ↵ send · ⇧↵ new line
                </p>

                {hasTurns && !isBlocked && (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button
                      onClick={handleClearHistory}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-4)",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        transition: "color 0.18s",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)")}
                    >
                      clear
                    </button>
                    <button
                      onClick={() => router.push("/proof")}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-3)",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        transition: "color 0.18s",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)")}
                    >
                      reflection →
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MentorParagraph ──────────────────────────────────────────────────────────

function MentorParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(7px)";
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <p
      ref={ref}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "1rem",
        color: "var(--text-2)",
        lineHeight: 1.9,
        margin: 0,
        letterSpacing: "0.01em",
        transition: `opacity ${PARAGRAPH_FADE_MS}ms ease, transform ${PARAGRAPH_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        opacity: 0,
        transform: "translateY(7px)",
      }}
    >
      {text}
    </p>
  );
}
