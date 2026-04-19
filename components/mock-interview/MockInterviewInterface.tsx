"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { startInterview, endInterview, getPastSessions } from "@/app/actions/mock-interview";
import type {
  InterviewType,
  MockInterviewFeedback,
  MockInterviewMessage,
  MockInterviewSession,
} from "@/types/mock-interview";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_TYPES: {
  type: InterviewType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: "behavioral",
    label: "Behavioral",
    description: "STAR-method stories, leadership, conflict, and past experiences",
    icon: "◈",
  },
  {
    type: "technical",
    label: "Technical / Coding",
    description: "Algorithms, data structures, problem-solving depth",
    icon: "⟨⟩",
  },
  {
    type: "system_design",
    label: "System Design",
    description: "Architecture, scalability, trade-offs, and distributed systems",
    icon: "⬡",
  },
  {
    type: "product",
    label: "Product Sense",
    description: "User empathy, metrics, prioritization, and product judgment",
    icon: "◎",
  },
];

// ---------------------------------------------------------------------------
// 3D tilt card
// ---------------------------------------------------------------------------

function TiltCard({
  children,
  isSelected,
  onClick,
}: {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateX.set(-dy * 10);
    rotateY.set(dx * 10);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
      style={{
        perspective: "800px",
        rotateX: springX,
        rotateY: springY,
        cursor: "pointer",
        background: isSelected
          ? "linear-gradient(135deg, rgba(201,168,108,0.12) 0%, rgba(201,168,108,0.04) 100%)"
          : "rgba(19,21,28,0.6)",
        border: isSelected
          ? "1px solid rgba(201,168,108,0.7)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "1.5rem",
        backdropFilter: "blur(20px)",
        boxShadow: isSelected
          ? "0 0 32px rgba(201,168,108,0.2), inset 0 1px 0 rgba(201,168,108,0.15)"
          : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        transform: `scale(${isSelected ? 1.02 : 1})`,
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.3s",
        opacity: isSelected ? 1 : 0.7,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Score ring — animated SVG arc
// ---------------------------------------------------------------------------

function ScoreRing({
  score,
  label,
  delay = 0,
}: {
  score: number;
  label: string;
  delay?: number;
}) {
  const [animated, setAnimated] = useState(false);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!animated) return;
    let start = 0;
    const end = score;
    const duration = 1500;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animated, score]);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = animated ? score / 10 : 0;
  const dashOffset = circumference * (1 - progress);

  const color = score >= 8 ? "var(--green)" : score >= 6 ? "var(--copper)" : "#e05c5c";
  const glowColor = score >= 8 ? "rgba(90,138,106,0.4)" : score >= 6 ? "rgba(201,168,108,0.4)" : "rgba(224,92,92,0.4)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay / 1000, duration: 0.5, type: "spring", stiffness: 200 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(19,21,28,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "1.5rem 1.25rem",
        flex: "1 1 140px",
        boxShadow: `0 0 24px ${glowColor}`,
      }}
    >
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.25rem", fontWeight: 400, color }}>
            {displayed}
          </span>
        </div>
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)", textAlign: "center" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Waveform — streaming indicator
// ---------------------------------------------------------------------------

function SpeakingWaveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "20px", padding: "0 4px" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: "3px",
            borderRadius: "2px",
            background: "var(--indigo)",
            animation: `waveBar 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { height: 4px; opacity: 0.4; }
          to { height: 18px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback step
// ---------------------------------------------------------------------------

function FeedbackStep({
  feedback,
  roleContext,
  interviewType,
  onRestart,
}: {
  feedback: MockInterviewFeedback;
  roleContext: string;
  interviewType: InterviewType;
  onRestart: () => void;
}) {
  const typeLabel = INTERVIEW_TYPES.find((t) => t.type === interviewType)?.label ?? interviewType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "3rem" }}
    >
      {/* Header with animated checkmark */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(90,138,106,0.3), rgba(90,138,106,0.1))",
            border: "1px solid rgba(90,138,106,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(90,138,106,0.3)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 12l5 5L20 7"
              stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.5rem", margin: "0 0 0.4rem" }}>
            Interview Complete — {typeLabel}{roleContext ? ` · ${roleContext}` : ""}
          </p>
          <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.025em", margin: 0 }}>
            Your performance feedback.
          </h2>
        </div>
      </div>

      {/* Score cards */}
      <div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "1.25rem" }}>Scores</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <ScoreRing score={feedback.score.overall} label="Overall" delay={0} />
          <ScoreRing score={feedback.score.communication} label="Communication" delay={150} />
          <ScoreRing score={feedback.score.specificity} label="Specificity" delay={300} />
          <ScoreRing score={feedback.score.structure} label="Structure" delay={450} />
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          background: "rgba(19,21,28,0.6)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)", borderLeft: "3px solid var(--copper)",
          borderRadius: "0 12px 12px 0", padding: "1.5rem 1.75rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--copper)", marginBottom: "0.75rem", margin: "0 0 0.75rem" }}>Verdict</p>
        <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: "var(--text-2)", lineHeight: 1.8, margin: 0 }}>
          {feedback.summary}
        </p>
      </motion.div>

      {/* Strengths + Improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem" }}>
        {/* Strengths */}
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green)", marginBottom: "1rem" }}>Strengths</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {feedback.strengths.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3, duration: 0.4, type: "spring" }}
                style={{
                  display: "flex", gap: "0.75rem", alignItems: "flex-start",
                  padding: "0.75rem 1rem",
                  background: "rgba(90,138,106,0.06)", border: "1px solid rgba(90,138,106,0.15)",
                  borderRadius: "8px", borderLeft: "2px solid var(--green)",
                }}
              >
                <span style={{ color: "var(--green)", fontSize: "0.7rem", marginTop: "1px", flexShrink: 0 }}>✓</span>
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{s}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--copper)", marginBottom: "1rem" }}>Areas to Improve</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {feedback.improvements.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3, duration: 0.4, type: "spring" }}
                style={{
                  display: "flex", gap: "0.75rem", alignItems: "flex-start",
                  padding: "0.75rem 1rem",
                  background: "rgba(201,168,108,0.06)", border: "1px solid rgba(201,168,108,0.15)",
                  borderRadius: "8px", borderLeft: "2px solid var(--copper)",
                }}
              >
                <span style={{ color: "var(--copper)", fontSize: "0.7rem", marginTop: "1px", flexShrink: 0 }}>→</span>
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Standout moments */}
      {feedback.standout_moments && feedback.standout_moments.length > 0 && (
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "1rem" }}>Standout Moments</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {feedback.standout_moments.map((moment, i) => (
              <p key={i} style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-4)", lineHeight: 1.65, margin: 0, paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                {moment}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Restart */}
      <div>
        <motion.button
          onClick={onRestart}
          whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(201,168,108,0.35)" }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: "linear-gradient(135deg, rgba(201,168,108,0.9), rgba(180,140,80,0.9))",
            border: "none", borderRadius: "12px", padding: "0.85rem 2.25rem",
            fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 600,
            color: "#0a0d14", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(201,168,108,0.25)",
            letterSpacing: "0.02em",
          }}
        >
          Start new interview →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------

function ChatBubble({
  role,
  content,
  streaming = false,
}: {
  role: "interviewer" | "candidate";
  content: string;
  streaming?: boolean;
}) {
  const isInterviewer = role === "interviewer";

  return (
    <motion.div
      initial={{ opacity: 0, x: isInterviewer ? -24 : 24, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.35, type: "spring", stiffness: 200, damping: 22 }}
      style={{
        display: "flex",
        justifyContent: isInterviewer ? "flex-start" : "flex-end",
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "1rem 1.25rem",
          background: isInterviewer
            ? "rgba(124,133,245,0.08)"
            : "rgba(201,168,108,0.1)",
          backdropFilter: "blur(20px)",
          border: isInterviewer
            ? "1px solid rgba(124,133,245,0.2)"
            : "1px solid rgba(201,168,108,0.25)",
          borderLeft: isInterviewer ? "3px solid rgba(124,133,245,0.5)" : undefined,
          borderRight: isInterviewer ? undefined : "3px solid rgba(201,168,108,0.5)",
          borderRadius: isInterviewer ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
          boxShadow: isInterviewer
            ? "0 4px 20px rgba(124,133,245,0.08)"
            : "0 4px 20px rgba(201,168,108,0.08)",
        }}
      >
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: isInterviewer ? "rgba(124,133,245,0.7)" : "rgba(201,168,108,0.7)", margin: "0 0 0.5rem" }}>
          {isInterviewer ? "Interviewer" : "You"}
        </p>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
          {content}
          {streaming && (
            <span style={{ display: "inline-block", width: "2px", height: "0.9em", background: "var(--copper)", marginLeft: "3px", verticalAlign: "middle", animation: "cursorBlink 0.8s step-end infinite" }} />
          )}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Active interview step
// ---------------------------------------------------------------------------

function ActiveStep({
  sessionId,
  roleContext,
  interviewType,
  onEnd,
}: {
  sessionId: string;
  roleContext: string;
  interviewType: InterviewType;
  onEnd: (feedback: MockInterviewFeedback) => void;
}) {
  const [input, setInput] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [isEnding, startEndTransition] = useTransition();
  const [endError, setEndError] = useState<string | null>(null);
  const [localTranscript, setLocalTranscript] = useState<MockInterviewMessage[]>([]);
  const [voiceInterim, setVoiceInterim] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const { messages, streamingContent, isStreaming, sendMessage } = useStreamingChat("/api/mock-interview");

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
  const typeLabel = INTERVIEW_TYPES.find((t) => t.type === interviewType)?.label ?? interviewType;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    sendMessage("", "user", { sessionId, userMessage: "", transcript: [], roleContext, interviewType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mapped: MockInterviewMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "candidate" : "interviewer",
      content: m.content,
      timestamp: new Date().toISOString(),
    }));
    setLocalTranscript(mapped);
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    setTurnCount((c) => c + 1);
    sendMessage(trimmed, "user", {
      sessionId, userMessage: trimmed,
      transcript: localTranscript, roleContext, interviewType,
    });
  }, [input, isStreaming, sendMessage, sessionId, localTranscript, roleContext, interviewType]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEnd = () => {
    if (isEnding || isStreaming) return;
    setEndError(null);
    startEndTransition(async () => {
      try {
        const feedback = await endInterview(sessionId);
        onEnd(feedback);
      } catch (err) {
        setEndError(err instanceof Error ? err.message : "Failed to generate feedback");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "700px", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,14,18,0.8)", backdropFilter: "blur(30px)" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.5rem",
        background: "linear-gradient(135deg, rgba(19,21,28,0.95) 0%, rgba(25,27,39,0.95) 100%)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Interviewer identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(124,133,245,0.4), rgba(90,99,210,0.2))",
                border: "1px solid rgba(124,133,245,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isStreaming ? "0 0 20px rgba(124,133,245,0.3)" : "none",
                transition: "box-shadow 0.3s",
              }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "var(--indigo)" }}>AI</span>
              </div>
              {/* Live indicator */}
              {isStreaming && (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderRadius: "50%", background: "var(--green)", border: "2px solid var(--bg)", animation: "micPulse 1s ease-in-out infinite" }} />
              )}
            </div>
            <div>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)", margin: 0 }}>AI Interviewer</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 6px var(--green)", animation: "pulse 2s infinite" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "var(--green)", letterSpacing: "0.08em" }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.06)" }} />

          {/* Role + type */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {roleContext && (
              <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "var(--text-3)" }}>{roleContext}</span>
            )}
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.08em", color: "var(--indigo)", background: "rgba(124,133,245,0.1)", border: "1px solid rgba(124,133,245,0.2)", borderRadius: "6px", padding: "0.15rem 0.5rem" }}>
              {typeLabel}
            </span>
            {turnCount > 0 && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)" }}>
                Turn {turnCount}
              </span>
            )}
          </div>
        </div>

        {/* End button */}
        <motion.button
          onClick={handleEnd}
          disabled={isEnding || isStreaming || messages.length < 3}
          whileHover={!isEnding && !isStreaming && messages.length >= 3 ? { scale: 1.03 } : {}}
          whileTap={!isEnding && !isStreaming && messages.length >= 3 ? { scale: 0.97 } : {}}
          style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "0.5rem 1.1rem",
            fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.72rem", fontWeight: 500,
            color: isEnding || messages.length < 3 ? "var(--text-4)" : "var(--text-3)",
            cursor: isEnding || isStreaming || messages.length < 3 ? "not-allowed" : "pointer",
            opacity: isEnding || messages.length < 3 ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {isEnding ? "Generating feedback…" : "End & Get Feedback"}
        </motion.button>
      </div>

      {/* Error */}
      {endError && (
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "#e05c5c", background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "8px", padding: "0.6rem 1rem", margin: "0.5rem 0", flexShrink: 0 }}>
          {endError}
        </div>
      )}

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "1.5rem 1rem",
        background: "rgba(13,14,18,0.5)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.04)", borderTop: "none",
        scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent",
      }}>
        {messages.length === 0 && !isStreaming && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
            >
              <SpeakingWaveform />
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-4)" }}>Starting interview…</p>
            </motion.div>
          </div>
        )}

        {messages.map((m, i) => {
          const role = m.role === "user" || m.role === "hiring_manager" ? "candidate" : "interviewer";
          return <ChatBubble key={i} role={role} content={m.content} />;
        })}

        {isStreaming && streamingContent && (
          <ChatBubble role="interviewer" content={streamingContent} streaming />
        )}

        {isStreaming && !streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}
          >
            <div style={{
              padding: "0.75rem 1rem",
              background: "rgba(124,133,245,0.08)", border: "1px solid rgba(124,133,245,0.2)",
              borderLeft: "3px solid rgba(124,133,245,0.5)", borderRadius: "4px 16px 16px 16px",
            }}>
              <SpeakingWaveform />
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        background: "rgba(19,21,28,0.9)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)", borderTop: "none",
        borderRadius: "0 0 16px 16px", padding: "1rem 1.25rem",
        flexShrink: 0,
      }}>
        {/* Voice interim preview */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: "0.5rem", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: "rgba(201,168,108,0.06)", border: "1px solid rgba(201,168,108,0.15)", borderRadius: "8px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--copper)", flexShrink: 0, animation: "micPulse 1s ease-in-out infinite" }} />
                <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--copper)", fontStyle: "italic", opacity: 0.9 }}>
                  {voiceInterim || "Listening…"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {input.trim() && !isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: "0.5rem" }}
          >
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--copper)", opacity: 0.8 }}>
              ● Composing…
            </span>
          </motion.div>
        )}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening — speak your answer…" : "Type your answer… (Enter to send, Shift+Enter for newline)"}
            disabled={isStreaming}
            rows={3}
            style={{
              flex: 1, background: isListening ? "rgba(201,168,108,0.04)" : "rgba(255,255,255,0.03)",
              border: isListening ? "1px solid rgba(201,168,108,0.2)" : "none",
              borderRadius: "8px",
              color: "var(--text-2)", fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.875rem", lineHeight: 1.65, padding: "0.75rem",
              resize: "none", outline: "none",
              opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s",
              boxShadow: isListening ? "0 0 16px rgba(201,168,108,0.1)" : "none",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* Mic button */}
            {voiceSupported && (
              <motion.button
                onClick={toggleVoice}
                disabled={isStreaming}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isListening ? "Stop listening" : "Speak your answer"}
                style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  border: isListening ? "1px solid rgba(201,168,108,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  background: isListening ? "rgba(201,168,108,0.15)" : "rgba(255,255,255,0.04)",
                  cursor: isStreaming ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.2s",
                  boxShadow: isListening ? "0 0 20px rgba(201,168,108,0.3)" : "none",
                  animation: isListening ? "micPulse 1.5s ease-in-out infinite" : "none",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={isListening ? "var(--copper)" : "var(--text-4)"} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </motion.button>
            )}
            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              whileHover={input.trim() && !isStreaming ? { scale: 1.04 } : {}}
              whileTap={input.trim() && !isStreaming ? { scale: 0.95 } : {}}
              style={{
                background: input.trim() && !isStreaming
                  ? "linear-gradient(135deg, rgba(201,168,108,0.95), rgba(175,135,65,0.95))"
                  : "rgba(255,255,255,0.04)",
                border: "none", borderRadius: "12px", padding: "0.75rem 1.25rem",
                fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600,
                color: input.trim() && !isStreaming ? "#0a0d14" : "var(--text-4)",
                cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                flexShrink: 0, transition: "all 0.2s",
                boxShadow: input.trim() && !isStreaming ? "0 4px 16px rgba(201,168,108,0.3)" : "none",
              }}
            >
              Send
            </motion.button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cursorBlink { 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Past sessions panel
// ---------------------------------------------------------------------------

function PastSessionsPanel() {
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getPastSessions().then((s) => { setSessions(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (sessions.length === 0) return null;

  const typeLabel = (t: InterviewType) => INTERVIEW_TYPES.find((x) => x.type === t)?.label ?? t;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      style={{ marginTop: "3rem" }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "1rem" }}>
        Past Sessions
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {sessions.slice(0, 5).map((s) => {
          const score = s.feedback?.score?.overall ?? null;
          const color = score == null ? "var(--text-4)" : score >= 8 ? "var(--green)" : score >= 6 ? "var(--copper)" : "#e05c5c";
          const isOpen = expanded === s.id;
          const date = new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

          return (
            <div key={s.id}>
              <motion.div
                onClick={() => setExpanded(isOpen ? null : s.id)}
                whileHover={{ x: 3 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.9rem 1.1rem",
                  background: "rgba(19,21,28,0.6)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "0 12px 12px 0",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color }}>
                    {score != null ? `${score}/10` : "–"}
                  </span>
                  <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-2)" }}>
                    {typeLabel(s.interview_type)}{s.role_title ? ` · ${s.role_title}` : ""}
                  </span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--text-4)" }}>{date}</span>
              </motion.div>

              <AnimatePresence>
                {isOpen && s.feedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      padding: "1rem 1.25rem",
                      background: "rgba(19,21,28,0.4)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderTop: "none",
                      borderRadius: "0 0 12px 12px",
                      display: "flex", flexDirection: "column", gap: "0.75rem",
                    }}>
                      <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontStyle: "italic", fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>
                        {s.feedback.summary}
                      </p>
                      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                        {[
                          { label: "Communication", val: s.feedback.score.communication },
                          { label: "Specificity", val: s.feedback.score.specificity },
                          { label: "Structure", val: s.feedback.score.structure },
                        ].map(({ label, val }) => (
                          <span key={label} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--text-4)" }}>
                            {label}: <span style={{ color: "var(--text-2)" }}>{val}/10</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Interview type SVG icons
// ---------------------------------------------------------------------------

function IconBehavioral() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 3V8a2 2 0 012-2z"/>
      <path d="M20 10h6a2 2 0 012 2v7a2 2 0 01-2 2h-2"/>
      <line x1="8" y1="11" x2="14" y2="11"/><line x1="8" y1="14" x2="16" y2="14"/>
    </svg>
  );
}
function IconTechnical() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="26" height="22" rx="2"/>
      <path d="M3 10h26"/>
      <path d="M10 16l-3 3 3 3"/><path d="M22 16l3 3-3 3"/>
      <line x1="15" y1="14" x2="17" y2="22"/>
    </svg>
  );
}
function IconSystemDesign() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="6" rx="1.5"/>
      <rect x="12" y="13" width="8" height="6" rx="1.5"/>
      <rect x="22" y="2" width="8" height="6" rx="1.5"/>
      <rect x="2" y="24" width="8" height="6" rx="1.5"/>
      <rect x="22" y="24" width="8" height="6" rx="1.5"/>
      <path d="M6 8v9M26 8v9M16 19v5M6 17h10M26 17h-10M6 27h10M26 27h-10"/>
    </svg>
  );
}
function IconProduct() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="16" r="12"/>
      <path d="M16 8a8 8 0 010 16"/>
      <path d="M12 12h8M12 16h5M12 20h6"/>
      <circle cx="22" cy="10" r="2.5" fill="currentColor" stroke="none" opacity="0.4"/>
    </svg>
  );
}

const TYPE_ICONS: Record<InterviewType, React.ReactElement> = {
  behavioral: <IconBehavioral />,
  technical: <IconTechnical />,
  system_design: <IconSystemDesign />,
  product: <IconProduct />,
};

// Animated waveform SVG for hero section
function WaveformHero({ active }: { active: boolean }) {
  const bars = [0.3, 0.6, 0.9, 0.5, 1, 0.7, 0.4, 0.8, 0.6, 1, 0.5, 0.7, 0.3, 0.9, 0.6, 0.8, 0.4, 1, 0.6, 0.3];
  return (
    <svg width="200" height="60" viewBox="0 0 200 60">
      {bars.map((h, i) => {
        const barH = h * 40;
        const y = (60 - barH) / 2;
        return (
          <rect
            key={i}
            x={i * 10 + 2}
            y={y}
            width="5"
            height={barH}
            rx="2.5"
            fill={active ? "rgba(201,168,108,0.7)" : "rgba(201,168,108,0.2)"}
            style={{
              animation: active ? `waveBar${i % 5} ${0.6 + (i % 4) * 0.15}s ease-in-out infinite alternate` : "none",
              transformOrigin: "center",
            }}
          />
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Setup step
// ---------------------------------------------------------------------------

function SetupStep({ onStart }: { onStart: (roleContext: string, interviewType: InterviewType) => void }) {
  const [roleContext, setRoleContext] = useState("");
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [isStarting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const handleStart = () => {
    if (!selectedType || isStarting) return;
    setError(null);
    startTransition(async () => {
      try {
        await onStart(roleContext, selectedType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start interview");
      }
    });
  };

  const selectedInfo = INTERVIEW_TYPES.find((t) => t.type === selectedType);

  return (
    <div style={{ position: "relative" }}>
      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "60%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,108,0.06) 0%, transparent 70%)", animation: "orb 18s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "65%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,133,245,0.04) 0%, transparent 70%)", animation: "orb 24s ease-in-out infinite reverse" }} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginBottom: "3.5rem",
            padding: "2.5rem",
            background: "linear-gradient(135deg, rgba(201,168,108,0.06) 0%, rgba(19,21,28,0.8) 60%)",
            border: "1px solid rgba(201,168,108,0.12)",
            borderRadius: "24px",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Decorative corner lines */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "60px", height: "60px", borderTop: "1px solid rgba(201,168,108,0.3)", borderLeft: "1px solid rgba(201,168,108,0.3)", borderRadius: "24px 0 0 0" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "60px", height: "60px", borderBottom: "1px solid rgba(201,168,108,0.2)", borderRight: "1px solid rgba(201,168,108,0.2)", borderRadius: "0 0 24px 0" }} />

          <div style={{ flex: 1 }}>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--copper)", margin: "0 0 0.75rem", opacity: 0.8 }}
            >
              ● Interview Prep
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em", margin: "0 0 0.75rem", lineHeight: 1.2 }}
            >
              No easy questions.<br />Just real pressure.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.875rem", color: "var(--text-4)", lineHeight: 1.7, margin: 0 }}
            >
              An AI interviewer that won't go easy on you. Answer by typing — or use your mic.
            </motion.p>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              style={{ display: "flex", gap: "0.6rem", marginTop: "1.25rem", flexWrap: "wrap" }}
            >
              {["Voice input", "AI scoring", "Instant feedback", "4 formats"].map((chip) => (
                <span key={chip} style={{
                  fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--copper)", padding: "0.3rem 0.7rem",
                  border: "1px solid rgba(201,168,108,0.2)", borderRadius: "20px",
                  background: "rgba(201,168,108,0.05)",
                }}>
                  {chip}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Waveform visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
          >
            <WaveformHero active={hovered} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-4)", textTransform: "uppercase" }}>
              hover to activate
            </span>
          </motion.div>
        </motion.div>

        {/* ── Form area ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

          {/* Left column: role + type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Role input */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.75rem" }}>
                Target role <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </p>
              <input
                type="text"
                value={roleContext}
                onChange={(e) => setRoleContext(e.target.value)}
                placeholder="e.g. Senior Engineer at Google"
                style={{
                  width: "100%", background: "rgba(19,21,28,0.8)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px",
                  color: "var(--text-2)", fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.875rem", padding: "0.875rem 1.1rem",
                  outline: "none", boxSizing: "border-box", transition: "all 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,108,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,108,0.06)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </motion.div>

            {/* Selected type preview */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {selectedInfo ? (
                <motion.div
                  key={selectedInfo.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "1.25rem",
                    background: "linear-gradient(135deg, rgba(201,168,108,0.08) 0%, rgba(19,21,28,0.6) 100%)",
                    border: "1px solid rgba(201,168,108,0.25)",
                    borderRadius: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ color: "var(--copper)", flexShrink: 0 }}>{TYPE_ICONS[selectedInfo.type]}</div>
                    <div>
                      <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "var(--text-1)", margin: "0 0 0.4rem" }}>{selectedInfo.label}</p>
                      <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>{selectedInfo.description}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ padding: "1.25rem", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "16px", textAlign: "center" }}>
                  <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "var(--text-4)", margin: 0 }}>← Pick an interview type</p>
                </div>
              )}
            </motion.div>

            {/* Start button */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              {error && (
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.8rem", color: "#e05c5c", marginBottom: "0.75rem", padding: "0.6rem 0.9rem", background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.15)", borderRadius: "8px" }}>{error}</p>
              )}
              <motion.button
                onClick={handleStart}
                disabled={!selectedType || isStarting}
                whileHover={selectedType && !isStarting ? { scale: 1.02, boxShadow: "0 0 48px rgba(201,168,108,0.4)" } : {}}
                whileTap={selectedType && !isStarting ? { scale: 0.97 } : {}}
                style={{
                  width: "100%",
                  background: selectedType && !isStarting
                    ? "linear-gradient(135deg, rgba(201,168,108,0.95) 0%, rgba(175,135,65,0.95) 100%)"
                    : "rgba(255,255,255,0.04)",
                  border: selectedType && !isStarting ? "none" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px", padding: "1.1rem 2rem",
                  fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.95rem", fontWeight: 700,
                  color: selectedType && !isStarting ? "#0a0d14" : "var(--text-4)",
                  cursor: selectedType && !isStarting ? "pointer" : "not-allowed",
                  transition: "all 0.25s",
                  letterSpacing: "0.02em",
                  boxShadow: selectedType && !isStarting ? "0 8px 32px rgba(201,168,108,0.25)" : "none",
                }}
              >
                {isStarting ? "Entering the room…" : selectedType ? `Start ${selectedInfo?.label} Interview →` : "Select a type to begin"}
              </motion.button>
            </motion.div>
          </div>

          {/* Right column: interview type cards (vertical stack) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.25rem" }}>
              Interview format
            </p>
            {INTERVIEW_TYPES.map((t, idx) => {
              const isSelected = selectedType === t.type;
              return (
                <motion.button
                  key={t.type}
                  onClick={() => setSelectedType(t.type)}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.06 }}
                  whileHover={{ x: 4, background: "rgba(201,168,108,0.06)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.1rem",
                    background: isSelected ? "rgba(201,168,108,0.08)" : "rgba(19,21,28,0.6)",
                    border: isSelected ? "1px solid rgba(201,168,108,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? "0 0 24px rgba(201,168,108,0.12)" : "none",
                  }}
                >
                  <div style={{ color: isSelected ? "var(--copper)" : "var(--text-4)", flexShrink: 0, transition: "color 0.2s" }}>
                    {TYPE_ICONS[t.type]}
                  </div>
                  <div>
                    <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: isSelected ? "var(--text-1)" : "var(--text-3)", margin: "0 0 0.2rem", transition: "color 0.2s" }}>
                      {t.label}
                    </p>
                    <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.72rem", color: "var(--text-4)", lineHeight: 1.5, margin: 0 }}>
                      {t.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "var(--copper)", flexShrink: 0 }} />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <PastSessionsPanel />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

type Step = "setup" | "active" | "feedback";

export function MockInterviewInterface() {
  const [step, setStep] = useState<Step>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roleContext, setRoleContext] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [feedback, setFeedback] = useState<MockInterviewFeedback | null>(null);

  const handleStart = async (rc: string, type: InterviewType) => {
    const result = await startInterview(rc, type);
    setSessionId(result.sessionId);
    setRoleContext(rc);
    setInterviewType(type);
    setStep("active");
  };

  const handleEnd = (fb: MockInterviewFeedback) => {
    setFeedback(fb);
    setStep("feedback");
  };

  const handleRestart = () => {
    setSessionId(null);
    setFeedback(null);
    setRoleContext("");
    setInterviewType("behavioral");
    setStep("setup");
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "calc(56px + 3rem) 3rem 8rem" }}>
        <AnimatePresence mode="wait">
          {step === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <SetupStep onStart={handleStart} />
            </motion.div>
          )}
          {step === "active" && sessionId && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <ActiveStep sessionId={sessionId} roleContext={roleContext} interviewType={interviewType} onEnd={handleEnd} />
            </motion.div>
          )}
          {step === "feedback" && feedback && (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <FeedbackStep feedback={feedback} roleContext={roleContext} interviewType={interviewType} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
