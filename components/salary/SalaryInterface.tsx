"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { getSalaryEstimate } from "@/app/actions/salary";
import type { SalarySession } from "@/types/salary";

type Step = "setup" | "range" | "negotiation";

// ── Format salary ─────────────────────────────────────────────────────────────
function fmt(n: number | null) {
  if (!n) return "$—";
  return "$" + n.toLocaleString();
}

// ── Count-up number hook ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

// ── Animated salary range bar ─────────────────────────────────────────────────
function SalaryRangeDisplay({ low, mid, high }: { low: number; mid: number; high: number }) {
  const displayLow = useCountUp(low, 1000, 200);
  const displayMid = useCountUp(mid, 1200, 300);
  const displayHigh = useCountUp(high, 1000, 400);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Animated gradient bar */}
      <div style={{ position: "relative" }}>
        <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            style={{
              height: "100%", transformOrigin: "left",
              background: "linear-gradient(90deg, #6b7bff 0%, var(--copper) 50%, #4caf82 100%)",
              borderRadius: "4px",
              filter: "drop-shadow(0 0 6px rgba(201,168,108,0.4))",
            }}
          />
        </div>
        {/* Mid dot */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
          style={{
            position: "absolute", left: `${((mid - low) / (high - low)) * 100}%`,
            top: "50%", transform: "translate(-50%, -50%)",
            width: 16, height: 16, borderRadius: "50%",
            background: "var(--copper)", border: "2px solid var(--bg)",
            boxShadow: "0 0 16px rgba(201,168,108,0.6), 0 0 32px rgba(201,168,108,0.3)",
            zIndex: 1,
          }}
        />
      </div>

      {/* Three amount cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "1rem" }}>
        {/* Low */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            background: "rgba(107,123,255,0.08)", border: "1px solid rgba(107,123,255,0.2)",
            borderRadius: "14px", padding: "1.25rem 1rem", textAlign: "left",
            backdropFilter: "blur(12px)",
          }}
        >
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(107,123,255,0.7)", margin: "0 0 0.5rem" }}>Floor</p>
          <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.3rem", color: "#6b7bff", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
            ${displayLow.toLocaleString()}
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)", margin: 0 }}>/yr</p>
        </motion.div>

        {/* Mid — centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5, type: "spring" }}
          style={{
            background: "linear-gradient(135deg, rgba(201,168,108,0.12) 0%, rgba(201,168,108,0.06) 100%)",
            border: "1px solid rgba(201,168,108,0.35)",
            borderRadius: "16px", padding: "1.5rem 1.25rem", textAlign: "center",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 32px rgba(201,168,108,0.15), inset 0 1px 0 rgba(201,168,108,0.15)",
          }}
        >
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(201,168,108,0.7)", margin: "0 0 0.5rem" }}>Market Mid</p>
          <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.9rem", color: "var(--copper)", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
            ${displayMid.toLocaleString()}
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)", margin: 0 }}>/yr</p>
        </motion.div>

        {/* High */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            background: "rgba(76,175,130,0.08)", border: "1px solid rgba(76,175,130,0.2)",
            borderRadius: "14px", padding: "1.25rem 1rem", textAlign: "right",
            backdropFilter: "blur(12px)",
          }}
        >
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(76,175,130,0.7)", margin: "0 0 0.5rem" }}>Ceiling</p>
          <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.3rem", color: "#4caf82", margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>
            ${displayHigh.toLocaleString()}
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)", margin: 0 }}>/yr</p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Setup form ────────────────────────────────────────────────────────────────
function SetupForm({ onSubmit, loading }: { onSubmit: (data: { role: string; location: string; years: number; size: string }) => void; loading: boolean }) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [years, setYears] = useState("3");
  const [size, setSize] = useState("mid");

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
    padding: "0.875rem 1.1rem", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
    color: "var(--text-1)", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em",
    color: "var(--text-4)", textTransform: "uppercase", marginBottom: "0.5rem", display: "block",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(201,168,108,0.5)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,108,0.08)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ role, location, years: parseInt(years) || 0, size }); }}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div>
        <label style={labelStyle}>Role title *</label>
        <input
          style={inputStyle} value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Senior Software Engineer"
          required onFocus={handleFocus} onBlur={handleBlur}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Location</label>
          <input style={inputStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" onFocus={handleFocus} onBlur={handleBlur} />
        </div>
        <div>
          <label style={labelStyle}>Years of experience</label>
          <input style={inputStyle} type="number" min="0" max="40" value={years} onChange={(e) => setYears(e.target.value)} placeholder="3" onFocus={handleFocus} onBlur={handleBlur} />
        </div>
      </div>

      {/* Company size toggle */}
      <div>
        <label style={labelStyle}>Company size</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[["startup", "Startup"], ["mid", "Mid-size"], ["enterprise", "Enterprise"]].map(([val, lbl]) => (
            <motion.button
              key={val}
              type="button"
              onClick={() => setSize(val)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: "0.625rem 0.75rem", borderRadius: "10px",
                border: `1px solid ${size === val ? "rgba(201,168,108,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: size === val ? "rgba(201,168,108,0.12)" : "rgba(255,255,255,0.02)",
                color: size === val ? "var(--copper)" : "var(--text-4)",
                fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: size === val ? 500 : 400,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: size === val ? "0 0 16px rgba(201,168,108,0.15)" : "none",
              }}
            >
              {lbl}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading || !role}
        whileHover={!loading && role ? { scale: 1.02, boxShadow: "0 0 40px rgba(201,168,108,0.35)" } : {}}
        whileTap={!loading && role ? { scale: 0.97 } : {}}
        style={{
          background: loading || !role
            ? "rgba(255,255,255,0.04)"
            : "linear-gradient(135deg, rgba(201,168,108,0.95), rgba(175,135,65,0.95))",
          border: "none", borderRadius: "14px", padding: "1rem 2rem",
          fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 600,
          color: loading || !role ? "var(--text-4)" : "#1a1410",
          cursor: loading || !role ? "not-allowed" : "pointer",
          boxShadow: !loading && role ? "0 4px 24px rgba(201,168,108,0.25)" : "none",
          transition: "all 0.2s", marginTop: "0.25rem",
          opacity: !role ? 0.5 : 1,
        }}
      >
        {loading ? "Researching market data…" : "Get market range →"}
      </motion.button>
    </form>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-4)" }}
        />
      ))}
    </div>
  );
}

// ── Negotiation chat ──────────────────────────────────────────────────────────
function NegotiationChat({ session }: { session: SalarySession }) {
  const { messages, streamingContent, isStreaming, sendMessage } = useStreamingChat("/api/salary-negotiation");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);

  function handleSend() {
    if (!input.trim() || isStreaming) return;
    const txt = input.trim();
    setInput("");
    sendMessage(txt, "user", {
      sessionId: session.id, userMessage: txt, transcript: messages,
      roleTitle: session.role_title,
      rangeData: { low: session.range_low, mid: session.range_mid, high: session.range_high },
      companySize: session.company_size,
    });
  }

  const allMessages = [...messages, ...(streamingContent ? [{ role: "hiring_manager" as const, content: streamingContent }] : [])];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(19,21,28,0.9)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* HM avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "var(--text-3)" }}>HM</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-2)", margin: 0 }}>
              Negotiating <span style={{ color: "var(--text-1)" }}>{session.role_title}</span>
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--copper)", margin: 0, letterSpacing: "0.06em" }}>
              Target: {fmt(session.range_mid)}
            </p>
          </div>
        </div>
      </div>

      {/* Tip card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: "0.75rem 1.5rem",
          background: "rgba(201,168,108,0.05)", borderBottom: "1px solid rgba(201,168,108,0.12)",
          display: "flex", alignItems: "flex-start", gap: "0.6rem",
        }}
      >
        <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>💡</span>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "var(--copper)", lineHeight: 1.55, margin: 0 }}>
          Lead with your value and accomplishments. Counter at 10–15% above the mid-point. Let them make the first offer if possible.
        </p>
      </motion.div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        background: "rgba(13,14,18,0.3)",
        // subtle noise texture via background pattern
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}>
        {allMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.84rem", color: "var(--text-4)", fontStyle: "italic" }}>
              Start the conversation — try opening with your excitement about the role.
            </p>
          </div>
        )}

        {allMessages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isUser ? 20 : -20, y: 6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 22 }}
              style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "0.75rem" }}
            >
              {!isUser && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 2,
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "var(--text-4)" }}>HM</span>
                </div>
              )}
              <div style={{
                maxWidth: "75%", padding: "0.75rem 1.1rem",
                borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                background: isUser ? "rgba(201,168,108,0.15)" : "rgba(255,255,255,0.04)",
                border: isUser ? "1px solid rgba(201,168,108,0.25)" : "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
              }}>
                {!isUser && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 4px" }}>
                    Hiring Manager
                  </p>
                )}
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.84rem", color: "var(--text-1)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {msg.content}
                  {isStreaming && i === allMessages.length - 1 && !isUser && (
                    <span style={{ display: "inline-block", width: "6px", height: "13px", background: "var(--copper)", borderRadius: "1px", marginLeft: "2px", animation: "blink 1s step-end infinite" }} />
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator when no streaming content yet */}
        {isStreaming && !streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "var(--text-4)" }}>HM</span>
            </div>
            <div style={{ padding: "0.75rem 1.1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 16px 16px 16px" }}>
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(19,21,28,0.9)", backdropFilter: "blur(20px)",
        display: "flex", gap: "0.75rem", alignItems: "flex-end",
      }}>
        <div style={{
          flex: 1, background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px",
          padding: "0.75rem 1rem", display: "flex", alignItems: "flex-end",
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your response…"
            rows={2}
            style={{
              flex: 1, background: "none", border: "none",
              fontFamily: "'Inter', sans-serif", fontSize: "0.875rem",
              color: "var(--text-1)", resize: "none", outline: "none", lineHeight: 1.6,
            }}
          />
        </div>
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          whileHover={input.trim() && !isStreaming ? { scale: 1.05 } : {}}
          whileTap={input.trim() && !isStreaming ? { scale: 0.93 } : {}}
          style={{
            background: input.trim() && !isStreaming ? "var(--copper)" : "rgba(255,255,255,0.04)",
            border: "none", borderRadius: "12px", padding: "0.75rem 1.25rem",
            fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600,
            color: input.trim() && !isStreaming ? "#1a1410" : "var(--text-4)",
            cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
            flexShrink: 0, transition: "all 0.2s",
            boxShadow: input.trim() && !isStreaming ? "0 4px 16px rgba(201,168,108,0.3)" : "none",
          }}
        >
          Send
        </motion.button>
      </div>
    </div>
  );
}

// ── Main SalaryInterface ──────────────────────────────────────────────────────
export function SalaryInterface() {
  const [step, setStep] = useState<Step>("setup");
  const [session, setSession] = useState<SalarySession | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSetup(data: { role: string; location: string; years: number; size: string }) {
    startTransition(async () => {
      const s = await getSalaryEstimate(data.role, data.location || undefined, data.years || undefined, data.size);
      setSession(s);
      setStep("range");
    });
  }

  return (
    <div style={{ maxWidth: "820px" }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "2.5rem" }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--copper)", margin: "0 0 0.5rem" }}>
          Salary Intelligence
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 300, color: "var(--text-1)", margin: "0 0 0.4rem", letterSpacing: "-0.03em", fontStyle: "italic" }}>
          Salary Intelligence
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", color: "var(--text-4)", margin: 0, lineHeight: 1.6 }}>
          Know your market value. Practice the negotiation.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Setup */}
        {step === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <div style={{
              background: "rgba(19,21,28,0.7)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px",
              padding: "2.25rem",
              boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <SetupForm onSubmit={handleSetup} loading={isPending} />
            </div>
          </motion.div>
        )}

        {/* Range display — the wow moment */}
        {step === "range" && session && (
          <motion.div
            key="range"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div style={{
              background: "rgba(19,21,28,0.7)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px",
              padding: "2.25rem",
              boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--copper)", margin: "0 0 0.35rem" }}>
                {session.role_title}{session.location ? ` · ${session.location}` : ""}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "var(--text-4)", margin: "0 0 2rem" }}>
                Market compensation data
              </p>

              <SalaryRangeDisplay
                low={session.range_low ?? 80000}
                mid={session.range_mid ?? 110000}
                high={session.range_high ?? 145000}
              />

              {session.rationale && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "0.95rem", color: "var(--text-3)", lineHeight: 1.8, margin: "1.75rem 0 0", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}
                >
                  {session.rationale}
                </motion.p>
              )}
              {session.data_caveats && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-4)", lineHeight: 1.6, margin: "0.75rem 0 0", fontStyle: "italic" }}>
                  {session.data_caveats}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(201,168,108,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("negotiation")}
                style={{
                  background: "linear-gradient(135deg, rgba(201,168,108,0.95), rgba(175,135,65,0.95))",
                  border: "none", borderRadius: "14px", padding: "0.9rem 2rem",
                  fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 600,
                  color: "#1a1410", cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(201,168,108,0.25)",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}
              >
                Practice Negotiation →
              </motion.button>
              <button
                onClick={() => { setStep("setup"); setSession(null); }}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px", padding: "0.9rem 1.5rem",
                  fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", color: "var(--text-4)", cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                Try different role
              </button>
            </div>
          </motion.div>
        )}

        {/* Negotiation */}
        {step === "negotiation" && session && (
          <motion.div
            key="negotiation"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              background: "rgba(19,21,28,0.7)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px",
              overflow: "hidden", height: "600px", display: "flex", flexDirection: "column",
            }}
          >
            <NegotiationChat session={session} />
            <div style={{ padding: "0.5rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "flex-end", background: "rgba(13,14,18,0.3)" }}>
              <button
                onClick={() => setStep("range")}
                style={{ background: "none", border: "none", fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-4)", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.15)" }}
              >
                ← back to range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
