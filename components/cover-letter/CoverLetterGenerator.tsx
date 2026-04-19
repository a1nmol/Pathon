"use client";

/**
 * CoverLetterGenerator — two-column split layout redesign
 * Keeps all logic (generateCover action) intact.
 */

import { useState, useTransition, useId, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { generateCover } from "@/app/actions/ats";
import type { CoverLetterResult } from "@/types/ats";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, enabled = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!enabled || !text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, enabled]);
  return { displayed, done };
}

// ── PDF download ────────────────────────────────────────────────────────────
function downloadCoverLetterPDF(body: string, company: string, role: string, subject: string) {
  const paras = body.split("\n\n").filter(Boolean)
    .map((p, i) => `<p style="margin:0 0 1.3em;line-height:1.85;font-size:${i===0?"15.5px":"14.5px"};font-style:${i===0?"italic":"normal"}">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter — ${company}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Georgia,'Times New Roman',serif;color:#1a1208;background:#faf7f0;padding:64px 80px;max-width:840px;margin:0 auto}
    .hdr{border-bottom:1px solid rgba(201,168,108,0.35);padding-bottom:20px;margin-bottom:32px}
    .eye{font-family:'Courier New',monospace;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:#8a7a5a;margin-bottom:10px}
    .subj{font-family:'Courier New',monospace;font-size:12px;color:#5a4a2a;font-style:italic}
    @media print{body{background:#fff;padding:48px 64px}@page{margin:0}}
  </style></head><body>
  <div class="hdr"><div class="eye">${company} — ${role}</div><div class="subj">Subject: ${subject}</div></div>
  ${paras}
  </body></html>`;

  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

// ── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text, label, small }: { text: string; label: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        background: copied
          ? "rgba(90,138,106,0.15)"
          : "rgba(201,168,108,0.1)",
        border: `1px solid ${copied ? "rgba(90,138,106,0.4)" : "rgba(201,168,108,0.3)"}`,
        borderRadius: "100px",
        color: copied ? "#5a8a6a" : "#c9a86c",
        fontSize: small ? "10px" : "11px",
        letterSpacing: "0.06em",
        fontFamily: "'DM Mono', monospace",
        padding: small ? "4px 12px" : "6px 16px",
        cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s, color 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            ✓ copied
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Loading state ────────────────────────────────────────────────────────────
function LoadingState() {
  const MESSAGES = [
    "Crafting your letter…",
    "Reading your resume…",
    "Matching your voice…",
    "Almost there…",
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      style={{
        padding: "2rem",
        background: "rgba(19,21,28,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        backdropFilter: "blur(24px)",
        marginTop: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={msgIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              color: "rgba(201,168,108,0.8)",
              letterSpacing: "0.04em",
            }}
          >
            {MESSAGES[msgIdx]}
          </motion.span>
        </AnimatePresence>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "13px",
          color: "rgba(201,168,108,0.8)",
          opacity: cursor ? 1 : 0,
          transition: "opacity 0.1s",
        }}>|</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {[88, 72, 94, 60, 80, 45, 86, 66, 50].map((width, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.12, 0.32, 0.12] }}
            transition={{
              duration: 1.8,
              delay: i * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              height: "11px",
              width: `${width}%`,
              background: "rgba(255,255,255,0.08)",
              borderRadius: "3px",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Glass input field ───────────────────────────────────────────────────────
function GlassInput({
  label,
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: focused ? "rgba(201,168,108,0.6)" : "rgba(255,255,255,0.2)",
          marginBottom: "6px",
          transition: "color 0.25s",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1.5px solid ${focused ? "var(--copper)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 0,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          lineHeight: 1.5,
          padding: "0.5rem 0",
          outline: "none",
          boxSizing: "border-box",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.25s, opacity 0.2s",
          boxShadow: focused ? `0 1px 0 var(--copper)` : "none",
        }}
      />
    </div>
  );
}

// ── Paragraph reveal component ──────────────────────────────────────────────
function AnimatedParagraph({ text, index, isFirst }: { text: string; index: number; isFirst: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.15,
        duration: 0.55,
        ease: EASE_OUT,
      }}
      style={{
        fontFamily: isFirst ? "'Poppins', system-ui, sans-serif" : "'Inter', sans-serif",
        fontStyle: isFirst ? "italic" : "normal",
        fontWeight: isFirst ? 300 : 400,
        fontSize: isFirst ? "1.05rem" : "14px",
        color: isFirst ? "#1a1208" : "#2a2218",
        lineHeight: isFirst ? 1.7 : 1.85,
        margin: index === 0 ? "0 0 1.4rem" : "0 0 1.25rem",
        letterSpacing: isFirst ? "-0.01em" : "0",
      }}
    >
      {text}
    </motion.p>
  );
}

// ── ResultView (right panel) ─────────────────────────────────────────────────
function ResultView({
  result,
  company,
  role,
}: {
  result: CoverLetterResult;
  company: string;
  role: string;
}) {
  const fullText = `Subject: ${result.subject_line}\n\n${result.body}`;
  const paragraphs = result.body.split("\n\n").filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* ── Floating action bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.6rem",
          padding: "0.75rem 1rem",
          background: "rgba(13,15,24,0.8)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          backdropFilter: "blur(12px)",
        }}
      >
        <CopyButton text={result.subject_line} label="copy subject" small />
        <CopyButton text={fullText} label="copy letter" small />
        <motion.button
          onClick={() => downloadCoverLetterPDF(result.body, company, role, result.subject_line)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            background: "rgba(201,168,108,0.1)",
            border: "1px solid rgba(201,168,108,0.28)",
            borderRadius: "100px",
            color: "rgba(201,168,108,0.8)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            fontFamily: "'DM Mono', monospace",
            padding: "5px 13px",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "5px",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8M5 7l3 3 3-3"/><path d="M2 12h12"/>
          </svg>
          PDF
        </motion.button>
      </motion.div>

      {/* ── Paper — two-column document layout ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1, ease: EASE_OUT }}
        className="cl-paper-grid"
        style={{
          background: "linear-gradient(160deg, #faf7f0 0%, #f5f0e6 100%)",
          borderRadius: "20px",
          boxShadow: "0 40px 120px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,108,0.12)",
          position: "relative",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          minHeight: "600px",
        }}
      >
        {/* Paper texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
          opacity: 0.7,
        }} />

        {/* ── Left sidebar — document metadata ─────────────── */}
        <motion.div
          className="cl-paper-sidebar"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: EASE_OUT }}
          style={{
            borderRight: "1px solid rgba(26,18,8,0.07)",
            padding: "3rem 2rem 3rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            background: "rgba(241,235,220,0.5)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Copper rule */}
          <div style={{ width: "36px", height: "2px", background: "rgba(201,168,108,0.55)" }} />

          {/* Application to */}
          <div>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: "8px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(26,18,8,0.3)", margin: "0 0 0.6rem",
            }}>Application For</p>
            <p style={{
              fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700,
              fontSize: "17px", color: "#1a1208", margin: "0 0 3px",
              letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>{company}</p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: "12px",
              color: "rgba(26,18,8,0.45)", margin: 0, lineHeight: 1.4,
            }}>{role}</p>
          </div>

          {/* Subject */}
          <div>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: "8px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(26,18,8,0.3)", margin: "0 0 0.5rem",
            }}>Subject</p>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: "11px",
              color: "rgba(160,120,60,0.9)", letterSpacing: "0.02em",
              lineHeight: 1.55, margin: 0,
            }}>{result.subject_line}</p>
          </div>

          {/* Tone */}
          {result.tone_notes && (
            <div>
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: "8px",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "rgba(26,18,8,0.3)", margin: "0 0 0.5rem",
              }}>Tone</p>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: "11.5px",
                color: "rgba(26,18,8,0.4)", lineHeight: 1.65, margin: 0,
                fontStyle: "italic",
              }}>{result.tone_notes}</p>
            </div>
          )}

          {/* Cover letter label at bottom */}
          <div style={{ marginTop: "auto" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace", fontSize: "8px",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(26,18,8,0.18)", margin: 0,
            }}>Cover Letter</p>
          </div>
        </motion.div>

        {/* ── Right — letter body ───────────────────────────── */}
        <motion.div
          className="cl-paper-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
          style={{
            padding: "3rem 3rem 3rem 2.5rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {paragraphs.map((para, i) => (
            <AnimatedParagraph key={i} text={para} index={i} isFirst={i === 0} />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── CL Visualizer — floating content blocks ─────────────────────────────────
const CL_BLOCKS = [
  { label: "Experience", icon: "◈", color: "rgba(201,168,108,0.8)", dim: "rgba(201,168,108,0.12)", border: "rgba(201,168,108,0.25)", field: "profile" },
  { label: "Skills",     icon: "◇", color: "rgba(90,138,106,0.8)",  dim: "rgba(90,138,106,0.1)",   border: "rgba(90,138,106,0.22)",  field: "profile" },
  { label: "Role",       icon: "◉", color: "rgba(124,133,245,0.8)", dim: "rgba(124,133,245,0.1)",  border: "rgba(124,133,245,0.22)", field: "role" },
  { label: "Tone",       icon: "◌", color: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)",  field: "none" },
];

// Gentle floating orbits (each block has a different phase)
const ORBITS = [
  { x: -80, y: -60 },
  { x: 80,  y: -50 },
  { x: -60, y: 60  },
  { x: 70,  y: 55  },
];

function CLVisualizer({
  hasCompany,
  hasRole,
  hasJd,
  generating,
}: {
  hasCompany: boolean;
  hasRole: boolean;
  hasJd: boolean;
  generating: boolean;
}) {
  const active = [true, true, hasRole || hasCompany, hasJd];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "2rem",
      }}
    >
      {/* Blocks */}
      <div style={{ position: "relative", width: 280, height: 260 }}>
        {/* Center merge target */}
        <motion.div
          animate={{
            opacity: generating ? 1 : 0.08,
            scale: generating ? 1 : 0.85,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 72,
            background: "rgba(201,168,108,0.12)",
            border: "1.5px dashed rgba(201,168,108,0.35)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="rgba(201,168,108,0.6)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
            <path d="M12 2v4h4" />
          </svg>
        </motion.div>

        {CL_BLOCKS.map((block, i) => {
          const orbit = ORBITS[i];
          const isActive = active[i];

          return (
            <motion.div
              key={block.label}
              animate={
                generating
                  ? { x: 0, y: 0, scale: 0.7, opacity: 0 }
                  : {
                      x: [orbit.x, orbit.x + (i % 2 === 0 ? 5 : -5), orbit.x],
                      y: [orbit.y, orbit.y + (i < 2 ? -4 : 4), orbit.y],
                      scale: isActive ? 1 : 0.9,
                      opacity: isActive ? 1 : 0.4,
                    }
              }
              transition={
                generating
                  ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                  : {
                      x: { duration: 6 + i * 0.8, repeat: Infinity, ease: "easeInOut" },
                      y: { duration: 7 + i * 0.6, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.5 },
                    }
              }
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -44,
                marginTop: -28,
                width: 88,
                height: 56,
                background: block.dim,
                border: `1px solid ${isActive ? block.border : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                boxShadow: isActive
                  ? `0 0 16px ${block.dim}, 0 4px 12px rgba(0,0,0,0.2)`
                  : "none",
                transition: "border-color 0.4s, box-shadow 0.4s",
              }}
            >
              <span style={{ fontSize: 14, color: isActive ? block.color : "rgba(255,255,255,0.2)", lineHeight: 1 }}>
                {block.icon}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive ? block.color : "rgba(255,255,255,0.2)",
                  lineHeight: 1,
                  transition: "color 0.4s",
                }}
              >
                {block.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Helper text */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.15)",
            margin: "0 0 0.4rem",
          }}
        >
          {generating ? "Composing…" : "Awaiting generation"}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "rgba(255,255,255,0.22)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {generating
            ? "Merging your context into a letter"
            : "Blocks activate as you fill in details"}
        </p>
      </div>
    </div>
  );
}

// ── CoverLetterGenerator (main export) ─────────────────────────────────────
export function CoverLetterGenerator() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [jdFocused, setJdFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  const companyId = useId();
  const roleId = useId();
  const jdId = useId();

  const isReady =
    company.trim().length > 0 &&
    role.trim().length > 0 &&
    jd.trim().length >= 30 &&
    !isPending;

  function handleGenerate() {
    if (!isReady) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await generateCover(company.trim(), role.trim(), jd);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  // Magnetic button effect
  function handleBtnMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.current = (e.clientX - cx) * 0.18;
    mouseY.current = (e.clientY - cy) * 0.18;
    btnRef.current.style.transform = `translate(${mouseX.current}px, ${mouseY.current}px) scale(1.04)`;
  }
  function handleBtnMouseLeave() {
    if (btnRef.current) btnRef.current.style.transform = "translate(0,0) scale(1)";
    setBtnHovered(false);
  }

  return (
    <>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
      <div style={{
        position: "fixed",
        inset: 0,
        paddingLeft: "var(--sidebar-w, 68px)",
        /* layout shift is handled via CSS var transition in globals.css */
        paddingTop: "56px",
        display: "grid",
        gridTemplateColumns: "700px 1fr",
        overflow: "hidden",
      }}>
        {/* ── Left column — form panel ────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(160deg, rgba(13,15,24,0.98) 0%, rgba(9,11,18,0.98) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          overflowY: "auto",
          padding: "3rem 2rem",
        }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(201,168,108,0.6)",
              margin: "0 0 0.75rem",
            }}>
              Cover Letter
            </p>
            <h1 style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.92)",
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}>
              Write once. Apply everywhere.
            </h1>
          </div>

          {/* Inputs */}
          <GlassInput
            label="Company"
            id={companyId}
            value={company}
            onChange={setCompany}
            placeholder="Stripe, Notion, Acme…"
            disabled={isPending}
          />
          <GlassInput
            label="Role Title"
            id={roleId}
            value={role}
            onChange={setRole}
            placeholder="Senior Product Designer"
            disabled={isPending}
          />

          {/* JD Textarea */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor={jdId}
              style={{
                display: "block",
                fontFamily: "'DM Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: jdFocused ? "rgba(201,168,108,0.6)" : "rgba(255,255,255,0.2)",
                marginBottom: "6px",
                transition: "color 0.25s",
              }}
            >
              Job Description
            </label>
            <textarea
              id={jdId}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              disabled={isPending}
              onFocus={() => setJdFocused(true)}
              onBlur={() => setJdFocused(false)}
              placeholder="Paste the full job description here…"
              style={{
                width: "100%",
                minHeight: "260px",
                background: "rgba(255,255,255,0.03)",
                border: `1.5px solid ${jdFocused ? "#c9a86c" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "10px",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                lineHeight: 1.75,
                padding: "0.75rem 1rem",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                opacity: isPending ? 0.4 : 1,
                transition: "border-color 0.25s, opacity 0.2s",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: "13px",
                color: "#e05c5c",
                fontFamily: "'Inter', sans-serif",
                marginBottom: "1.25rem",
                padding: "0.75rem 1rem",
                background: "rgba(224,92,92,0.07)",
                border: "1px solid rgba(224,92,92,0.18)",
                borderRadius: "10px",
              }}
            >
              {error}
            </motion.p>
          )}

          {/* Loading state in left panel */}
          <AnimatePresence>
            {isPending && <LoadingState />}
          </AnimatePresence>

          {/* Generate button */}
          {!isPending && (
            <button
              ref={btnRef}
              onClick={handleGenerate}
              disabled={!isReady}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseMove={isReady ? handleBtnMouseMove : undefined}
              onMouseLeave={handleBtnMouseLeave}
              style={{
                width: "100%",
                background: isReady
                  ? "linear-gradient(135deg, #c9a86c 0%, #a8834e 100%)"
                  : "rgba(255,255,255,0.04)",
                border: isReady ? "none" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "1.1rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                color: isReady ? "#1a1208" : "rgba(255,255,255,0.18)",
                cursor: isReady ? "pointer" : "default",
                transition: "background 0.3s, color 0.3s, transform 0.2s, box-shadow 0.3s",
                boxShadow: isReady && btnHovered
                  ? "0 16px 50px rgba(201,168,108,0.4)"
                  : isReady
                  ? "0 6px 24px rgba(201,168,108,0.2)"
                  : "none",
                position: "relative",
                overflow: "hidden",
                marginTop: "0.5rem",
              }}
            >
              {isReady && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                  animation: "shimmer 2.8s linear infinite",
                  pointerEvents: "none",
                }} />
              )}
              Generate Cover Letter →
            </button>
          )}
        </div>

        {/* ── Right column — preview/result panel ─────────────────────── */}
        <div style={{
          background: "#0a0c14",
          overflowY: "auto",
          padding: "3rem",
        }}>
          {!result ? (
            <CLVisualizer
              hasCompany={company.trim().length > 0}
              hasRole={role.trim().length > 0}
              hasJd={jd.trim().length >= 30}
              generating={isPending}
            />
          ) : (
            <ResultView result={result} company={company} role={role} />
          )}
        </div>
      </div>
    </>
  );
}
