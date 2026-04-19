"use client";

/**
 * ProofCapsuleEditor
 *
 * Writing-first, one section at a time. No form layout. No visible chrome.
 *
 * Sections (in order):
 *   claim               — one sentence, the anchor
 *   context             — the situation
 *   constraints         — the real working conditions
 *   decision_reasoning  — what was decided and why at the time
 *   iterations          — what changed, what failed
 *   reflection          — what is understood now
 *   tags                — optional grouping labels
 *
 * Navigation:
 *   Single-line fields: Enter → advance
 *   Multiline fields:   ⌘/Ctrl + Enter → advance
 *   Section dots at bottom → jump to any visited section
 *
 * Autosave: 1500ms debounce after any change. Inserts on first save,
 * updates on subsequent. Each save appends a revision row.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { saveProofCapsule } from "@/lib/db/proof";
import type { ProofCapsuleRecord } from "@/types/proof";

// ─── Section definitions ──────────────────────────────────────────────────────

type SectionKey =
  | "claim"
  | "context"
  | "constraints"
  | "decision_reasoning"
  | "iterations"
  | "reflection"
  | "tags";

type SectionDef = {
  key: SectionKey;
  prompt: string;
  detail: string;
  placeholder: string;
  multiline: boolean;
  optional?: boolean;
};

const SECTIONS: SectionDef[] = [
  {
    key: "claim",
    prompt: "What does this capsule prove?",
    detail: "One sentence. The claim you can now back with evidence.",
    placeholder: "I can lead a complex project without a manager.",
    multiline: false,
  },
  {
    key: "context",
    prompt: "What was the situation?",
    detail: "Set the scene. Where were you, what was at stake, who else was involved.",
    placeholder: "Write freely. Edit later.",
    multiline: true,
  },
  {
    key: "constraints",
    prompt: "What were you working with — or against?",
    detail: "Time, resources, people, information, politics. The real conditions, not the stated ones.",
    placeholder: "Write freely. Edit later.",
    multiline: true,
  },
  {
    key: "decision_reasoning",
    prompt: "What did you decide, and why?",
    detail: "Not the outcome. The reasoning at the time — what you knew, what you didn't, what you chose.",
    placeholder: "Write freely. Edit later.",
    multiline: true,
  },
  {
    key: "iterations",
    prompt: "What changed along the way?",
    detail: "What you tried that didn't work. What surprised you. Where the plan met reality.",
    placeholder: "Write freely. Edit later.",
    multiline: true,
  },
  {
    key: "reflection",
    prompt: "What do you know now that you didn't know then?",
    detail: "Not what you would have done differently. What you actually learned.",
    placeholder: "Write freely. Edit later.",
    multiline: true,
  },
  {
    key: "tags",
    prompt: "How would you find this later?",
    detail: "A few words. Not résumé keywords.",
    placeholder: "Add one, press Enter",
    multiline: false,
    optional: true,
  },
];

const TOTAL = SECTIONS.length;

// ─── Animation ────────────────────────────────────────────────────────────────

const variants = {
  enter: { opacity: 0, y: 18 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: "easeIn" as const },
  },
};

// ─── Draft state ──────────────────────────────────────────────────────────────

type Draft = {
  id: string | null;
  claim: string;
  context: string;
  constraints: string;
  decision_reasoning: string;
  iterations: string;
  reflection: string;
  tags: string[];
};

function initialDraft(capsule?: ProofCapsuleRecord): Draft {
  if (!capsule) {
    return {
      id: null,
      claim: "",
      context: "",
      constraints: "",
      decision_reasoning: "",
      iterations: "",
      reflection: "",
      tags: [],
    };
  }
  return {
    id: capsule.id,
    claim: capsule.claim,
    context: capsule.context ?? "",
    constraints: capsule.constraints ?? "",
    decision_reasoning: capsule.decision_reasoning ?? "",
    iterations: capsule.iterations ?? "",
    reflection: capsule.reflection ?? "",
    tags: capsule.tags,
  };
}

// ─── TagsField ────────────────────────────────────────────────────────────────

function TagsField({
  tags,
  onChange,
  onAdvance,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  onAdvance: () => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  useEffect(() => {
    const t = setTimeout(
      () => document.querySelector<HTMLElement>("[data-autofocus]")?.focus(),
      50,
    );
    return () => clearTimeout(t);
  }, []);

  function addTag(raw: string) {
    const val = raw.trim().replace(/,$/, "").trim();
    if (!val || tags.includes(val)) return;
    onChange([...tags, val]);
    setInput("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) addTag(input);
      else onAdvance();
    }
    if (e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="mt-10 space-y-4">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              style={{ borderColor: "#252a38", color: "#8a8480" }}
            >
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="leading-none transition-opacity"
                style={{ opacity: 0.4 }}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        data-autofocus
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-xl"
        style={{
          color: "#9ba3b8",
          borderBottom: "1px solid #252a38",
          paddingBottom: "8px",
          caretColor: "#8a8480",
        }}
      />
      <p className="text-xs" style={{ color: "#252a38" }}>
        {tags.length > 0 ? "Enter to add · Enter on empty to finish" : "Enter to add · Enter on empty to skip"}
      </p>
    </div>
  );
}

// ─── TextField ────────────────────────────────────────────────────────────────

function TextField({
  value,
  onChange,
  onAdvance,
  placeholder,
  multiline,
  optional,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdvance: () => void;
  placeholder: string;
  multiline: boolean;
  optional?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (multiline) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onAdvance();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        onAdvance();
      }
    }
  }

  const sharedStyle: React.CSSProperties = {
    color: "#9ba3b8",
    fontFamily: "Inter, system-ui, sans-serif",
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
    lineHeight: "1.9",
    borderBottom: "1px solid #252a38",
    paddingBottom: "8px",
    caretColor: "#c9a86c",
    width: "100%",
    background: "transparent",
    outline: "none",
    resize: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  return (
    <div className="mt-10 space-y-4">
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={value}
          rows={5}
          placeholder={placeholder}
          onKeyDown={handleKey}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          style={sharedStyle}
          className="placeholder:opacity-30"
          onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 2px 0 0 rgba(201,168,108,0.3)"; (e.currentTarget as HTMLTextAreaElement).style.borderBottomColor = "#5a4a38"; }}
          onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none"; (e.currentTarget as HTMLTextAreaElement).style.borderBottomColor = "#252a38"; }}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          placeholder={placeholder}
          onKeyDown={handleKey}
          onChange={(e) => onChange(e.target.value)}
          style={sharedStyle}
          className="placeholder:opacity-30"
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = "0 2px 0 0 rgba(201,168,108,0.3)"; (e.currentTarget as HTMLInputElement).style.borderBottomColor = "#5a4a38"; }}
          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.boxShadow = "none"; (e.currentTarget as HTMLInputElement).style.borderBottomColor = "#252a38"; }}
        />
      )}
      <p className="text-xs" style={{ color: "#252a38" }}>
        {multiline
          ? "⌘ Enter to continue"
          : optional
            ? "Enter to continue · or skip"
            : "Enter to continue"}
      </p>
    </div>
  );
}

// ─── SaveIndicator ────────────────────────────────────────────────────────────

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  return (
    <>
      {/* Autosave indicator */}
      <div style={{
        position: "fixed",
        top: "60px",
        right: "2rem",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        opacity: state === "saving" || state === "saved" ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }}>
        <div style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: state === "saved" ? "#4a6a58" : "#c9a86c",
          transition: "background 0.3s ease",
        }} />
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.55rem",
          letterSpacing: "0.08em",
          color: state === "saved" ? "#4a6a58" : "#8a7a68",
          transition: "color 0.3s ease",
        }}>
          {state === "saving" ? "saving..." : "saved ✓"}
        </span>
      </div>
      {/* Error indicator */}
      {state === "error" && (
        <div
          className="fixed top-6 right-6 text-xs"
          style={{
            color: "#7a4a42",
            letterSpacing: "0.05em",
          }}
        >
          save failed
        </div>
      )}
    </>
  );
}

// ─── SectionDots ──────────────────────────────────────────────────────────────

function SectionDots({
  current,
  visited,
  total,
  onJump,
}: {
  current: number;
  visited: Set<number>;
  total: number;
  onJump: (i: number) => void;
}) {
  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "rgba(6,9,17,0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid #252a38",
      padding: "0.6rem 1.25rem",
    }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isVisited = visited.has(i);
        return (
          <button
            key={i}
            onClick={() => isVisited && onJump(i)}
            aria-label={`Section ${i + 1}`}
            style={{
              width: isActive ? "24px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: isActive ? "#c9a86c" : isVisited ? "#4a6a58" : "#252a38",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              cursor: isVisited ? "pointer" : "default",
              boxShadow: isActive ? "0 0 8px rgba(201,168,108,0.4)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── ProofCapsuleEditor ───────────────────────────────────────────────────────

export function ProofCapsuleEditor({
  userId,
  initialCapsule,
  onComplete,
}: {
  userId: string;
  initialCapsule?: ProofCapsuleRecord;
  onComplete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(initialCapsule));
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(
    () => new Set(initialCapsule ? Array.from({ length: TOTAL }, (_, i) => i) : [0]),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSection = SECTIONS[step]!;

  // ── Autosave ───────────────────────────────────────────────────────────────

  const triggerSave = useCallback(
    (latestDraft: Draft) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveState("saving");
        const result = await saveProofCapsule(userId, latestDraft);
        if (result.ok) {
          // Update id if this was the first save
          if (!latestDraft.id) {
            setDraft((prev) => ({ ...prev, id: result.id }));
          }
          setSaveState("saved");
          savedTimer.current = setTimeout(() => setSaveState("idle"), 1800);
        } else {
          setSaveState("error");
        }
      }, 1500);
    },
    [userId],
  );

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // ── Field update ───────────────────────────────────────────────────────────

  function updateField(key: SectionKey, value: string | string[]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      triggerSave(next);
      return next;
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function advance() {
    if (step < TOTAL - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setVisited((prev) => new Set([...prev, nextStep]));
    } else {
      // Final step — force save immediately then signal completion
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveProofCapsule(userId, draft).then((result) => {
        if (result.ok) onComplete?.(result.id);
      });
    }
  }

  function jumpTo(i: number) {
    setStep(i);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "#0f1219" }}
    >
      <SaveIndicator state={saveState} />

      <div className="w-full max-w-xl px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Prompt */}
            <p style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c9a86c",
              opacity: 0.6,
              marginBottom: "0.75rem",
            }}>
              {currentSection.key.replace(/_/g, " ")}
            </p>
            <h2
              style={{
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontWeight: 300,
                fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                lineHeight: 1.35,
                letterSpacing: "-0.02em",
                color: "#9ba3b8",
              }}
            >
              {currentSection.prompt}
            </h2>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "#5c6478" }}
            >
              {currentSection.detail}
            </p>

            {/* Input */}
            {currentSection.key === "tags" ? (
              <TagsField
                tags={draft.tags}
                onChange={(tags) => updateField("tags", tags)}
                onAdvance={advance}
                placeholder={currentSection.placeholder}
              />
            ) : (
              <TextField
                key={step}
                value={draft[currentSection.key] as string}
                onChange={(v) => updateField(currentSection.key, v)}
                onAdvance={advance}
                placeholder={currentSection.placeholder}
                multiline={currentSection.multiline}
                optional={currentSection.optional}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SectionDots
        current={step}
        visited={visited}
        total={TOTAL}
        onJump={jumpTo}
      />
    </div>
  );
}
