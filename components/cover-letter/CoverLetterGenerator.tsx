"use client";

/**
 * CoverLetterGenerator — cinematic redesign
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

// ── Loading state — typewriter effect ───────────────────────────────────────
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
        padding: "2.5rem",
        background: "rgba(19,21,28,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        backdropFilter: "blur(24px)",
        marginBottom: "1.5rem",
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

      {/* Skeleton letter lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {[88, 72, 94, 60, 80, 45, 86, 66, 50].map((width, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
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
    <div style={{ flex: 1 }}>
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

// ── ResultView ───────────────────────────────────────────────────────────────
function ResultView({
  result,
  company,
  role,
  onReset,
}: {
  result: CoverLetterResult;
  company: string;
  role: string;
  onReset: () => void;
}) {
  const fullText = `Subject: ${result.subject_line}\n\n${result.body}`;
  const paragraphs = result.body.split("\n\n").filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      {/* ── Action bar ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <motion.button
            whileHover={{ x: -3 }}
            onClick={onReset}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontSize: "12px", letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono', monospace",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}
          >
            ← generate another
          </motion.button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
        </div>
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
          gridTemplateColumns: "320px 1fr",
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
            padding: "3rem 3.5rem 3rem 3rem",
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
    <div className="mobile-page-wrap" style={{
      background: "var(--bg)",
      minHeight: "100vh",
      paddingLeft: "var(--sidebar-w, 60px)",
    }}>
      <div style={{
        maxWidth: result ? "1200px" : "720px",
        margin: "0 auto",
        padding: "calc(56px + 4rem) 5vw 8rem",
        transition: "max-width 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          style={{ marginBottom: "3rem" }}
        >
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(201,168,108,0.5)",
            margin: "0 0 0.75rem",
          }}>
            Cover Letter
          </p>
          <h1 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            Cover Letter
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.7,
            margin: 0,
          }}>
            Built from your actual data — not a template.
          </p>
        </motion.div>

        {/* ── Form / Result ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              {/* Company + Role — inline row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
                style={{
                  display: "flex",
                  gap: "2rem",
                  background: "rgba(19,21,28,0.6)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  padding: "1.25rem 1.5rem",
                  marginBottom: "1.25rem",
                  backdropFilter: "blur(20px)",
                }}
              >
                <GlassInput
                  label="Company"
                  id={companyId}
                  value={company}
                  onChange={setCompany}
                  placeholder="Stripe, Notion, Acme…"
                  disabled={isPending}
                />
                <div style={{
                  width: "1px",
                  background: "rgba(255,255,255,0.07)",
                  alignSelf: "stretch",
                  flexShrink: 0,
                }} />
                <GlassInput
                  label="Role Title"
                  id={roleId}
                  value={role}
                  onChange={setRole}
                  placeholder="Senior Product Designer"
                  disabled={isPending}
                />
              </motion.div>

              {/* JD Textarea */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT }}
                style={{
                  background: jdFocused ? "rgba(19,21,28,0.9)" : "rgba(19,21,28,0.6)",
                  border: jdFocused
                    ? "1px solid rgba(201,168,108,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  backdropFilter: "blur(20px)",
                  overflow: "hidden",
                  marginBottom: "1.5rem",
                  transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
                  boxShadow: jdFocused
                    ? "0 0 0 3px rgba(201,168,108,0.07), 0 8px 32px rgba(0,0,0,0.25)"
                    : "0 4px 16px rgba(0,0,0,0.12)",
                }}
              >
                <label
                  htmlFor={jdId}
                  style={{
                    display: "block",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: jdFocused ? "rgba(201,168,108,0.6)" : "rgba(255,255,255,0.2)",
                    padding: "1.1rem 1.25rem 0",
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
                    minHeight: "200px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    lineHeight: 1.75,
                    padding: "0.75rem 1.25rem 1.25rem",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: isPending ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                />
              </motion.div>

              {/* Loading state */}
              <AnimatePresence>
                {isPending && <LoadingState />}
              </AnimatePresence>

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
                    marginTop: isPending ? "1.25rem" : 0,
                    padding: "0.75rem 1rem",
                    background: "rgba(224,92,92,0.07)",
                    border: "1px solid rgba(224,92,92,0.18)",
                    borderRadius: "10px",
                  }}
                >
                  {error}
                </motion.p>
              )}

              {/* Generate button — magnetic + copper gradient */}
              {!isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
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
                    }}
                  >
                    {/* Shimmer effect */}
                    {isReady && (
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                    Generate Cover Letter →
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              <ResultView result={result} company={company} role={role} onReset={() => setResult(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
