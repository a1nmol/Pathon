"use client";

import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/db/client";
import type { CareerIdentityInsert } from "@/types";

// ─── Step configuration ───────────────────────────────────────────────────────

type StepType = "enum" | "text" | "tags";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type StepDef = {
  key: keyof Omit<CareerIdentityInsert, "user_id">;
  question: string;
  type: StepType;
  options?: Option[];
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  maxTags?: number;
};

const STEPS: StepDef[] = [
  {
    key: "career_stage",
    question: "Where are you in your career right now?",
    type: "enum",
    options: [
      { value: "early", label: "Just starting out", description: "Building fundamentals" },
      { value: "mid", label: "Building momentum", description: "Developing judgment and ownership" },
      { value: "senior", label: "Experienced and delivering", description: "Shaping standards, leading work" },
      { value: "lead", label: "Leading others", description: "Cross-team scope, people development" },
      { value: "executive", label: "Operating at scale", description: "Org-level accountability" },
      { value: "founder", label: "Building something from scratch", description: "Wearing many hats" },
    ],
  },
  {
    key: "current_role",
    question: "What's your current role?",
    type: "text",
    placeholder: "Designer, engineer, PM, founder...",
    optional: true,
  },
  {
    key: "thinking_style",
    question: "When you face a new problem, what do you naturally do first?",
    type: "enum",
    options: [
      { value: "analytical", label: "Break it apart", description: "Root cause before anything else" },
      { value: "creative", label: "Explore the space", description: "Generate many possibilities first" },
      { value: "strategic", label: "Step back", description: "Where does this fit in the bigger picture?" },
      { value: "pragmatic", label: "Find what works and move", description: "Good and shipped beats perfect" },
      { value: "systems_thinker", label: "Map the relationships", description: "Feedback loops, emergent behavior" },
    ],
  },
  {
    key: "decision_approach",
    question: "How do you tend to make decisions?",
    type: "enum",
    options: [
      { value: "data_driven", label: "Look at the data", description: "Evidence and structured comparison" },
      { value: "intuition_led", label: "Trust the pattern", description: "Experience speaks before the spreadsheet" },
      { value: "consensus_seeking", label: "Talk it through first", description: "Validate with others before committing" },
      { value: "structured_process", label: "Work a framework", description: "Pro/con, decision matrix, etc." },
    ],
  },
  {
    key: "problem_framing",
    question: "Describe your approach in your own words.",
    type: "text",
    placeholder: "How you actually think through a hard problem...",
    optional: true,
    multiline: true,
  },
  {
    key: "primary_learning_mode",
    question: "How does new knowledge actually stick for you?",
    type: "enum",
    options: [
      { value: "building", label: "Building something with it" },
      { value: "reading", label: "Reading and researching" },
      { value: "discussing", label: "Talking it through" },
      { value: "observing", label: "Watching, then doing" },
      { value: "teaching", label: "Explaining it to someone else" },
    ],
  },
  {
    key: "knowledge_domains",
    question: "What are the areas you know deeply?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
  },
  {
    key: "currently_exploring",
    question: "What are you actively learning right now?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
  },
  {
    key: "work_rhythm",
    question: "How do you do your best work?",
    type: "enum",
    options: [
      { value: "deep_focus", label: "Long, uninterrupted blocks", description: "Context-switching is costly" },
      { value: "collaborative", label: "Alongside others", description: "Energized by real-time co-creation" },
      { value: "sprint_rest", label: "Intense bursts, then recovery", description: "Fully on, then fully off" },
      { value: "steady_pace", label: "Consistent daily output", description: "No extremes — sustainable rhythm" },
    ],
  },
  {
    key: "energy_source",
    question: "Do you draw energy from people, or from time alone?",
    type: "enum",
    options: [
      { value: "introvert", label: "From time alone", description: "People are meaningful but costly" },
      { value: "extrovert", label: "From being with others", description: "Energy rises in a room" },
      { value: "ambivert", label: "Depends on context", description: "Neither extreme fits" },
    ],
  },
  {
    key: "collaboration_style",
    question: "What team configuration brings out your best?",
    type: "enum",
    options: [
      { value: "independent", label: "Working solo", description: "Collaboration is occasional, time-boxed" },
      { value: "pair", label: "One trusted partner", description: "Deep, tight collaboration" },
      { value: "small_team", label: "3–6 people", description: "High trust, fast coordination" },
      { value: "large_team", label: "Bigger orgs", description: "Comfortable with multiple stakeholders" },
    ],
  },
  {
    key: "core_values",
    question: "What are your professional values?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
    maxTags: 5,
  },
  {
    key: "motivated_by",
    question: "What actually drives you?",
    type: "text",
    placeholder: "What makes work feel worth doing...",
    optional: true,
    multiline: true,
  },
  {
    key: "strengths",
    question: "What do you reliably do well?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
  },
  {
    key: "growth_areas",
    question: "Where are you intentionally developing?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
  },
  {
    key: "industries",
    question: "What industries have you worked in, or are you drawn to?",
    type: "tags",
    placeholder: "Add one, press Enter",
    optional: true,
  },
  {
    key: "career_direction",
    question: "Where are you trying to go?",
    type: "text",
    placeholder: "What you're moving toward...",
    optional: true,
    multiline: true,
  },
  {
    key: "communication_style",
    question: "How do you naturally communicate?",
    type: "enum",
    options: [
      { value: "direct", label: "Bottom line first", description: "Minimal hedging" },
      { value: "diplomatic", label: "Relationship alongside content", description: "I attend to both" },
      { value: "detailed", label: "Thorough", description: "Completeness over brevity" },
      { value: "high_level", label: "Headlines and decisions", description: "Not the implementation detail" },
    ],
  },
  {
    key: "feedback_preference",
    question: "How do you want feedback delivered?",
    type: "enum",
    options: [
      { value: "blunt", label: "Unvarnished truth", description: "Immediately, no softening" },
      { value: "balanced", label: "Positive named alongside the problem" },
      { value: "encouraging", label: "Keep it safe", description: "The relationship matters" },
    ],
  },
  {
    key: "ai_context",
    question: "Anything the AI should know about you that didn't come up?",
    type: "text",
    placeholder: "Known blind spots, quirks, preferences...",
    optional: true,
    multiline: true,
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const stepVariants = {
  enter: { opacity: 0, y: 20 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -14,
    transition: { duration: 0.22, ease: "easeIn" as const },
  },
};

const statusVariants = {
  enter: { opacity: 0, scale: 0.97 },
  center: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ─── Shared: auto-focus helper ────────────────────────────────────────────────
// Called inside text/tag inputs on mount. The 260ms delay gives AnimatePresence
// mode="wait" time to finish the previous step's exit (220ms) before focusing.

function useAutoFocus() {
  useEffect(() => {
    // 50ms gives React time to settle after mount. The component only mounts
    // after AnimatePresence finishes the previous step's exit, so no extra
    // delay is needed to account for the outgoing animation.
    const t = setTimeout(() => {
      document.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);
}

// ─── TextInput ────────────────────────────────────────────────────────────────
// Manages its own draft value; calls onAdvance(value | null) on Enter.

interface TextInputProps {
  onAdvance: (value: string | null) => void;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
}

function TextInput({ onAdvance, placeholder, optional, multiline }: TextInputProps) {
  const [value, setValue] = useState("");

  useAutoFocus();

  function commit() {
    onAdvance(value.trim() || null);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (multiline) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    }
  }

  const sharedClass =
    "w-full bg-transparent outline-none resize-none border-b border-current/20 pb-2 text-lg placeholder:text-current/25 focus:border-current/50 transition-colors duration-200";

  return (
    <div className="mt-10 space-y-4">
      {multiline ? (
        <textarea
          data-autofocus
          value={value}
          rows={3}
          placeholder={placeholder}
          onKeyDown={handleKey}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          className={sharedClass}
        />
      ) : (
        <input
          data-autofocus
          type="text"
          value={value}
          placeholder={placeholder}
          onKeyDown={handleKey}
          onChange={(e) => setValue(e.target.value)}
          className={sharedClass}
        />
      )}
      <p className="text-sm text-current/25 select-none">
        {multiline
          ? "⌘ Enter to continue"
          : optional
            ? "Enter to continue · or skip"
            : "Enter to continue"}
      </p>
    </div>
  );
}

// ─── TagsInput ────────────────────────────────────────────────────────────────
// Manages its own tag list; calls onAdvance(tags[]) when Enter is pressed on
// an empty field.

interface TagsInputProps {
  onAdvance: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

function TagsInput({ onAdvance, placeholder, maxTags }: TagsInputProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useAutoFocus();

  const atMax = maxTags !== undefined && tags.length >= maxTags;

  function addTag(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim();
    if (!value || tags.includes(value) || atMax) return;
    setTags((prev) => [...prev, value]);
    setInput("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      } else {
        onAdvance(tags);
      }
    }
    if (e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="mt-10 space-y-4">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1 text-sm"
            >
              {tag}
              <button
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="leading-none opacity-30 hover:opacity-80 transition-opacity"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {!atMax && (
        <input
          data-autofocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none border-b border-current/20 pb-2 text-lg placeholder:text-current/25 focus:border-current/50 transition-colors duration-200"
        />
      )}

      <p className="text-sm text-current/25 select-none">
        {atMax
          ? "Enter to continue"
          : tags.length > 0
            ? "Enter to add · Enter again to continue"
            : "Enter to add · Enter on empty to continue"}
      </p>
    </div>
  );
}

// ─── IdentityFlow ─────────────────────────────────────────────────────────────

type FlowStatus = "idle" | "saving" | "done" | "error";

export function IdentityFlow({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Partial<CareerIdentityInsert>>({
    user_id: userId,
    knowledge_domains: [],
    currently_exploring: [],
    core_values: [],
    strengths: [],
    growth_areas: [],
    industries: [],
  });
  const [status, setStatus] = useState<FlowStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oriented, setOriented] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const advance = useCallback(
    (value: string | string[] | null | undefined) => {
      const next: Partial<CareerIdentityInsert> = {
        ...responses,
        ...(value !== undefined ? { [current.key]: value } : {}),
      };
      setResponses(next);

      if (isLast) {
        persistIdentity(next);
      } else {
        setStep((s) => s + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [responses, current.key, isLast],
  );

  async function persistIdentity(partial: Partial<CareerIdentityInsert>) {
    setStatus("saving");

    const payload: CareerIdentityInsert = {
      user_id: userId,
      career_stage: partial.career_stage!,
      current_role: partial.current_role ?? null,
      thinking_style: partial.thinking_style!,
      decision_approach: partial.decision_approach!,
      problem_framing: partial.problem_framing ?? null,
      primary_learning_mode: partial.primary_learning_mode!,
      knowledge_domains: partial.knowledge_domains ?? [],
      currently_exploring: partial.currently_exploring ?? [],
      work_rhythm: partial.work_rhythm!,
      energy_source: partial.energy_source!,
      collaboration_style: partial.collaboration_style!,
      core_values: partial.core_values ?? [],
      motivated_by: partial.motivated_by ?? null,
      strengths: partial.strengths ?? [],
      growth_areas: partial.growth_areas ?? [],
      industries: partial.industries ?? [],
      career_direction: partial.career_direction ?? null,
      communication_style: partial.communication_style!,
      feedback_preference: partial.feedback_preference!,
      ai_context: partial.ai_context ?? null,
    };

    const supabase = createClient();
    const { error } = await (supabase
      .from("career_identity") as unknown as { upsert: (v: unknown, o: unknown) => Promise<{ error: { message: string } | null }> })
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("done");
      onComplete?.();
    }
  }

  // ── Orientation screen ───────────────────────────────────────────────────────
  if (!oriented && status === "idle") {
    return <IdentityOrientation onReady={() => setOriented(true)} />;
  }

  // ── Non-idle states ──────────────────────────────────────────────────────────

  if (status !== "idle") {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            variants={statusVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ textAlign: "center" }}
          >
            {status === "saving" && (
              <div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "1rem" }}>
                  {[0,1,2].map(i => (
                    <span key={i} className="thinking-dot" style={{ background: "#c9a86c", animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.8rem", color: "#5c6478", letterSpacing: "0.06em" }}>Saving your identity…</p>
              </div>
            )}
            {status === "done" && (
              <div>
                <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "1.5rem", fontWeight: 300, color: "#c9a86c", margin: "0 0 0.5rem" }}>Identity captured.</p>
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.8rem", color: "#5c6478" }}>Building your career analysis…</p>
              </div>
            )}
            {status === "error" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
                <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", color: "#8a4a42" }}>Something went wrong.</p>
                {errorMsg && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#6a3a32", maxWidth: "380px" }}>{errorMsg}</p>
                )}
                <button
                  onClick={() => persistIdentity(responses)}
                  style={{ background: "none", border: "1px solid #252a38", color: "#8a6a62", fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.72rem", padding: "0.5rem 1rem", cursor: "pointer", letterSpacing: "0.06em" }}
                >
                  Try again →
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Active flow ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg mx-auto px-6 py-20" style={{ position: "relative" }}>

      {/* Progress bar — copper accent */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "var(--border)",
          zIndex: 50,
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(to right, #8a6a42, #c9a86c)",
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: "width 0.5s ease",
            boxShadow: "0 0 8px rgba(201,168,108,0.3)",
          }}
        />
      </div>

      {/* Step counter — top right */}
      <p
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "2rem",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6rem",
          letterSpacing: "0.08em",
          color: "#2a3040",
          margin: 0,
          zIndex: 50,
        }}
      >
        {step + 1} / {STEPS.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Stage marker */}
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c9a86c",
              marginBottom: "1.25rem",
              opacity: 0.7,
            }}
          >
            ◆ Identity
          </p>

          <h2
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)",
              lineHeight: 1.35,
              letterSpacing: "-0.02em",
              color: "#e8e3dc",
              margin: "0 0 2.5rem",
            }}
          >
            {current.question}
          </h2>

          {/* Enum: tap an option → advances immediately */}
          {current.type === "enum" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {current.options!.map((opt, optIdx) => (
                <motion.button
                  key={opt.value}
                  onClick={() => advance(opt.value)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: optIdx * 0.04, duration: 0.3 }}
                  style={{
                    background: "none",
                    border: "1px solid #252a38",
                    borderLeft: "2px solid #252a38",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "1rem 1.25rem",
                    transition: "border-color 0.15s ease, background 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderLeftColor = "#c9a86c";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#252a38";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,108,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderLeftColor = "#252a38";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#252a38";
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.95rem",
                      color: "#f0eff4",
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span
                      style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: "0.75rem",
                        color: "#5c6478",
                        lineHeight: 1.5,
                      }}
                    >
                      {opt.description}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Text: Enter (or ⌘ Enter for multiline) → advances with value or null */}
          {current.type === "text" && (
            <TextInput
              onAdvance={(v) => advance(v)}
              placeholder={current.placeholder}
              optional={current.optional}
              multiline={current.multiline}
            />
          )}

          {/* Tags: Enter adds a tag; Enter on empty → advances with tag array */}
          {current.type === "tags" && (
            <TagsInput
              onAdvance={(tags) => advance(tags)}
              placeholder={current.placeholder}
              maxTags={current.maxTags}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── IdentityOrientation ──────────────────────────────────────────────────────
// Full-screen ceremony shown before the first question.
// Auto-advances after 4.5s; click to skip early.

function IdentityOrientation({ onReady }: { onReady: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 80);
    const t2 = setTimeout(() => onReady(), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onReady]);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.22,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const symbolVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 0.6,
      scale: 1,
      transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const hintVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 1.0, delay: 1.2, ease: "easeOut" as const },
    },
  };

  return (
    <div
      onClick={onReady}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        cursor: "default",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {mounted && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Ceremonial ✦ mark */}
          <motion.div
            variants={symbolVariants}
            style={{
              textAlign: "center",
              color: "#c9a86c",
              fontSize: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            ✦
          </motion.div>

          {/* Primary headline */}
          <motion.h1
            variants={itemVariants}
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#e8e3dc",
              fontWeight: 300,
              lineHeight: 1.3,
              maxWidth: "520px",
              margin: "0 0 0.5rem",
              letterSpacing: "-0.03em",
            }}
          >
            Twenty questions.
          </motion.h1>

          {/* Body copy */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "clamp(0.85rem, 2vw, 1rem)",
              color: "#5c6478",
              lineHeight: 1.75,
              maxWidth: "400px",
              margin: "1.25rem 0 0",
            }}
          >
            Each one teaches the system how you think,<br />
            work, and decide.
          </motion.p>

          {/* Supporting note */}
          <motion.p
            variants={itemVariants}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.78rem",
              color: "#2a3040",
              lineHeight: 1.6,
              maxWidth: "360px",
              margin: "1.5rem 0 0",
              fontStyle: "italic",
            }}
          >
            There are no wrong answers — only honest ones.
          </motion.p>

          {/* Click hint — delayed separately */}
          <motion.p
            variants={hintVariants}
            initial="hidden"
            animate="show"
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#2a3040",
              marginTop: "3.5rem",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            click anywhere to begin
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
