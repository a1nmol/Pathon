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
  aligned:    "#5c6478",
  partial:    "#2a3040",
  misaligned: "#2a3040",
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
        paddingLeft: "var(--sidebar-w, 80px)",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      {paths.length > 0 && (
        <>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              position: "fixed",
              top: "2rem",
              right: "2rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2a3040",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "Inter, system-ui, sans-serif",
              zIndex: 50,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#5c6478")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")}
          >
            {sidebarOpen ? "close" : "paths"}
          </button>

          {/* Sidebar panel */}
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "280px",
              background: "var(--surface)",
              borderLeft: "1px solid var(--border)",
              padding: "5rem 1.75rem 2rem",
              overflowY: "auto",
              transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.35s ease",
              zIndex: 40,
            }}
          >
            <p
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#2a3040",
                marginBottom: "2rem",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              your paths
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {paths.map((path, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: PATH_COLORS[path.alignment] ?? "#2a3040",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.58rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: PATH_COLORS[path.alignment] ?? "#2a3040",
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    >
                      {path.alignment}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#2a3040",
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 300,
                    }}
                  >
                    {path.name}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* ── Main conversation ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          transition: "margin-right 0.35s ease",
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: "680px",
            width: "100%",
            margin: "0 auto",
            padding: "5rem 2rem 14rem",
          }}
        >
          {/* Page heading */}
          <div style={{ marginBottom: "2rem", paddingTop: "1rem" }}>
            <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c6478", marginBottom: "0.5rem" }}>
              MENTOR
            </p>
            <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 300, color: "#8892a4", margin: 0, letterSpacing: "-0.02em" }}>
              A voice that challenges your reasoning.
            </p>
          </div>

          {/* History restored notice */}
          {historyLoaded && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
                padding: "0.5rem 0.75rem",
                background: "rgba(196,168,130,0.04)",
                border: "1px solid rgba(196,168,130,0.12)",
                borderRadius: "4px",
              }}
            >
              <span style={{ color: "#c9a86c", opacity: 0.5, fontSize: "0.7rem" }}>⌁</span>
              <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.65rem", letterSpacing: "0.08em", color: "#5c6478" }}>
                conversation restored from previous session
              </span>
            </div>
          )}

          {/* Mentor header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "5rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid #1e2535",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#c9a86c",
                  margin: "0 0 0.5rem",
                  opacity: 0.7,
                }}
              >
                ⌁ Mentor
              </p>
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.75rem",
                  color: "#2a3040",
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: "320px",
                }}
              >
                Challenges your reasoning. References past choices. Does not agree automatically.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  color: "#2a3040",
                  padding: "0.25rem 0.6rem",
                  border: "1px solid #1e2535",
                }}
              >
                {CAREER_MODES[careerMode].label.toLowerCase()}
              </span>
              <a
                href="/mentor/debate"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "#5c6478",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#c9a86c")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#5c6478")}
              >
                debate ✦ →
              </a>
            </div>
          </div>

          {/* Loading history */}
          {loadingHistory && (
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", padding: "2rem 0" }}>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>
          )}

          {/* Opening prompts */}
          {isEmpty && !loadingHistory && (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#2a3040",
                  marginBottom: "0.5rem",
                }}
              >
                YOUR SHADOW MENTOR
              </p>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", color: "#c9a86c", opacity: 0.35, marginBottom: "1.5rem" }}>✦</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  textAlign: "left",
                }}
              >
                {SCENARIO_PROMPTS.map((prompt, i) => (
                  <button
                    key={prompt}
                    onClick={() => submit(prompt)}
                    disabled={isBlocked}
                    className="scenario-prompt"
                    style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                  >
                    <p
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: "0.9rem",
                        color: "#8a8480",
                        lineHeight: 1.6,
                        fontStyle: "normal",
                        margin: 0,
                        fontWeight: 400,
                      }}
                    >
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Turns */}
          {turns.map((turn, i) => {
            if (turn.role === "user") {
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "2.5rem",
                    marginTop: i === 0 ? "4rem" : "3rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#8892a4",
                      lineHeight: 1.7,
                      margin: 0,
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 400,
                      maxWidth: "88%",
                      textAlign: "right",
                      padding: "0.75rem 1.25rem",
                      background: "rgba(196,168,130,0.06)",
                      border: "1px solid rgba(196,168,130,0.1)",
                    }}
                  >
                    {turn.content}
                  </p>
                </div>
              );
            }
            return (
              <div key={i} style={{ marginBottom: "4rem" }}>
                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c9a86c",
                    fontFamily: "Inter, system-ui, sans-serif",
                    marginBottom: "1rem",
                    opacity: 0.5,
                  }}
                >
                  ⌁
                </div>
                <div style={{ display: "flex", gap: "1.75rem" }}>
                  <div
                    style={{
                      width: "2px",
                      background: "linear-gradient(to bottom, #3a2a1e, #1e2535)",
                      flexShrink: 0,
                      alignSelf: "stretch",
                      minHeight: "3rem",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
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
            <div style={{ marginTop: "2rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#6b5c54", lineHeight: 1.6, fontFamily: "Inter, system-ui, sans-serif" }}>
                {errorMessage}
              </p>
              <button
                onClick={() => { setStatus("idle"); setErrorMessage(null); }}
                style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#5c6478", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Thinking indicator */}
          {status === "waiting" && (
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", padding: "1rem 0" }}>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ──────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "1.5rem 2rem 2.5rem",
            background: "linear-gradient(to top, #0f1219 65%, transparent)",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {/* Live voice preview */}
            {isListening && voiceInterim && (
              <div style={{
                marginBottom: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: "rgba(196,168,130,0.06)",
                border: "1px solid rgba(196,168,130,0.15)",
                borderRadius: "6px",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.85rem",
                color: "#c9a86c",
                opacity: 0.8,
                fontStyle: "italic",
              }}>
                {voiceInterim}
              </div>
            )}
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
                placeholder={isListening ? "Listening…" : isEmpty ? "Say what's on your mind." : isBlocked ? "" : "Continue."}
                rows={1}
                style={{
                  width: "100%",
                  resize: "none",
                  background: "var(--surface)",
                  outline: "none",
                  border: "1px solid #1e2535",
                  borderBottom: `2px solid ${isListening ? "#c9a86c" : isBlocked ? "#1e2535" : "#5a4a38"}`,
                  color: "#9ba3b8",
                  fontSize: "1rem",
                  fontFamily: "Inter, system-ui, sans-serif",
                  lineHeight: 1.7,
                  padding: "0.85rem 3rem 0.85rem 1rem",
                  caretColor: "#c9a86c",
                  opacity: isBlocked ? 0.35 : 1,
                  boxSizing: "border-box",
                  transition: "opacity 0.3s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 0 0 1px rgba(196,168,130,0.25)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none"; }}
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
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: isListening ? "1px solid rgba(196,168,130,0.6)" : "1px solid #2a3040",
                    background: isListening ? "rgba(196,168,130,0.15)" : "transparent",
                    cursor: isBlocked ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    boxShadow: isListening ? "0 0 10px rgba(196,168,130,0.25)" : "none",
                    animation: isListening ? "micPulse 1.5s ease-in-out infinite" : "none",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={isListening ? "#c9a86c" : "#5c6478"} strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.75rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "#2a3040",
                  opacity: isBlocked ? 0 : 1,
                  transition: "opacity 0.3s ease",
                  fontFamily: "Inter, system-ui, sans-serif",
                  letterSpacing: "0.06em",
                }}
              >
                Enter to send · Shift+Enter for new line
              </p>

              {/* Forward navigation + clear history */}
              {hasTurns && status !== "waiting" && status !== "revealing" && (
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <button
                    onClick={handleClearHistory}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#2a3040",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      fontFamily: "Inter, system-ui, sans-serif",
                      textTransform: "uppercase",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6b5c54")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")}
                  >
                    clear
                  </button>
                  <button
                    onClick={() => router.push("/proof")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#2a3040",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      fontFamily: "Inter, system-ui, sans-serif",
                      textTransform: "uppercase",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#5c6478")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")}
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
  );
}

// ─── MentorParagraph ──────────────────────────────────────────────────────────

function MentorParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "1";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <p
      ref={ref}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "1.05rem",
        color: "#9ba3b8",
        lineHeight: 1.85,
        margin: 0,
        letterSpacing: "0.01em",
        transition: `opacity ${PARAGRAPH_FADE_MS}ms ease`,
        opacity: 0,
      }}
    >
      {text}
    </p>
  );
}
