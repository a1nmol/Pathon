"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { signInWithMagicLink } from "@/lib/auth/actions";
import { createClient } from "@/lib/db/client";

// ─── Magnetic Button Hook ─────────────────────────────────────────────────────
function useMagnetic(strength = 0.3) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  const onMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }, [strength, x, y]);

  const onLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [onMove, onLeave]);

  return { ref, sx, sy };
}

// ─── Animated Stat ─────────────────────────────────────────────────────────────
function AnimatedStat({ value, label, color = "var(--copper)" }: { value: string; label: string; color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(num)) { setShown(value); return; }
    const suffix = value.replace(/[\d]/g, "");
    let frame = 0;
    const steps = 48;
    const tick = () => {
      frame++;
      const prog = 1 - Math.pow(1 - frame / steps, 3);
      setShown(Math.round(prog * num) + suffix);
      if (frame < steps) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ textAlign: "center" }}
    >
      <div style={{ fontFamily: "'Poppins', system-ui", fontWeight: 300, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {shown}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", marginTop: "6px" }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── Auth Form ────────────────────────────────────────────────────────────────
function AuthForm({ accent, mode }: { accent: string; mode: "applicant" | "employer" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const mag = useMagnetic(0.25);
  const nextPath = mode === "employer" ? "/employer/dashboard" : "/dashboard";

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
    });
    // browser will redirect — no need to reset loading state
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "loading") return;
    setState("loading");
    const res = await signInWithMagicLink(email.trim(), nextPath);
    if ("error" in res && res.error) {
      setErrMsg(res.error);
      setState("error");
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "rgba(90,138,106,0.08)", border: "1px solid rgba(90,138,106,0.25)",
          borderRadius: "16px", padding: "1.5rem 2rem", textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✉️</div>
        <p style={{ fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "1rem", color: "var(--green)", margin: "0 0 0.4rem" }}>
          Magic link sent!
        </p>
        <p style={{ fontFamily: "'Inter', system-ui", fontSize: "0.85rem", color: "var(--text-3)", margin: 0 }}>
          Check <strong style={{ color: "var(--text-2)" }}>{email}</strong> and click the link to sign in.<br />
          No password needed — ever.
        </p>
        <button
          onClick={() => { setState("idle"); setEmail(""); }}
          style={{ marginTop: "1rem", background: "none", border: "none", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "var(--text-4)", cursor: "pointer", letterSpacing: "0.08em" }}
        >
          Use a different email ↩
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* ── OAuth buttons ── */}
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={oauthLoading !== null}
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            padding: "0.8rem 1rem",
            background: oauthLoading === "google" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            fontFamily: "'Inter', system-ui", fontSize: "0.88rem", fontWeight: 500,
            color: oauthLoading === "google" ? "var(--text-4)" : "var(--text-2)",
            cursor: oauthLoading !== null ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => { if (!oauthLoading) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"; } }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
        >
          {oauthLoading === "google" ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: "0.82rem" }}>Connecting…</motion.span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </>
          )}
        </button>

        {/* GitHub */}
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={oauthLoading !== null}
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            padding: "0.8rem 1rem",
            background: oauthLoading === "github" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            fontFamily: "'Inter', system-ui", fontSize: "0.88rem", fontWeight: 500,
            color: oauthLoading === "github" ? "var(--text-4)" : "var(--text-2)",
            cursor: oauthLoading !== null ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => { if (!oauthLoading) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"; } }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
        >
          {oauthLoading === "github" ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: "0.82rem" }}>Connecting…</motion.span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-4)", textTransform: "uppercase" }}>
          or continue with email
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
      </div>

    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
          placeholder="your@email.com"
          required
          style={{
            flex: 1, minWidth: "220px",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${state === "error" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "12px", padding: "0.875rem 1.25rem",
            fontFamily: "'Inter', system-ui", fontSize: "0.95rem", color: "var(--text-1)",
            outline: "none", transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = accent + "60"; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}10`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = state === "error" ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <motion.button
          ref={mag.ref}
          type="submit"
          disabled={!email.trim() || state === "loading"}
          style={{
            x: mag.sx, y: mag.sy,
            background: email.trim() ? `linear-gradient(135deg, ${accent}dd, ${accent}99)` : "rgba(255,255,255,0.06)",
            border: "none", borderRadius: "12px", padding: "0.875rem 1.75rem",
            fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "0.9rem",
            color: email.trim() ? "#fff" : "var(--text-4)", cursor: email.trim() ? "pointer" : "not-allowed",
            whiteSpace: "nowrap", transition: "all 0.2s",
            boxShadow: email.trim() ? `0 4px 20px ${accent}30` : "none",
          }}
          whileHover={email.trim() ? { scale: 1.03 } : {}}
          whileTap={email.trim() ? { scale: 0.97 } : {}}
        >
          {state === "loading" ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>Sending…</motion.span>
          ) : "Get started free →"}
        </motion.button>
      </div>
      {state === "error" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "#ef4444", margin: 0 }}>
          {errMsg}
        </motion.p>
      )}
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-4)", margin: 0 }}>
        No password. No credit card. Magic link sent to your inbox.
      </p>
    </form>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
type Feature = { icon: string; label: string; desc: string; color: string; glow: string };

function FeatureCard({ f, i }: { f: Feature; i: number }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    setHovered(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onLeave}
        style={{
          position: "relative", padding: "1.6rem", borderRadius: "16px",
          background: hovered ? "rgba(25,29,40,0.95)" : "rgba(19,21,28,0.7)",
          border: `1px solid ${hovered ? f.color + "35" : "rgba(255,255,255,0.07)"}`,
          backdropFilter: "blur(12px)", cursor: "default",
          boxShadow: hovered ? `0 16px 48px rgba(0,0,0,0.5), 0 0 32px ${f.glow}` : "0 2px 12px rgba(0,0,0,0.3)",
          transition: "all 0.25s ease", transformStyle: "preserve-3d", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: "1.5rem", right: "1.5rem", height: "1px", background: `linear-gradient(90deg, ${f.color}, transparent)`, opacity: hovered ? 0.7 : 0.2, transition: "opacity 0.3s" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top left, ${f.glow} 0%, transparent 60%)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "1.4rem", color: f.color, marginBottom: "0.9rem", filter: hovered ? `drop-shadow(0 0 8px ${f.glow})` : "none", transition: "filter 0.3s" }}>{f.icon}</div>
          <h3 style={{ fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "0.95rem", color: "var(--text-1)", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>{f.label}</h3>
          <p style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: i * 0.06 }}
      style={{
        border: `1px solid ${open ? "rgba(201,168,108,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "14px", overflow: "hidden",
        background: open ? "rgba(201,168,108,0.04)" : "rgba(19,21,28,0.5)",
        transition: "all 0.25s ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "none", border: "none", cursor: "pointer", gap: "1rem", textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "'Inter', system-ui", fontWeight: 500, fontSize: "0.95rem", color: "var(--text-1)", lineHeight: 1.5 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          style={{ fontSize: "1.2rem", color: "var(--copper)", flexShrink: 0, lineHeight: 1 }}>+</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ fontFamily: "'Inter', system-ui", fontSize: "0.88rem", color: "var(--text-3)", lineHeight: 1.75, margin: 0, padding: "0 1.5rem 1.25rem" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ n, title, desc, color, i }: { n: string; title: string; desc: string; color: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", fontWeight: 700, color,
      }}>{n}</div>
      <div>
        <h4 style={{ fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "1rem", color: "var(--text-1)", margin: "0 0 0.4rem" }}>{title}</h4>
        <p style={{ fontFamily: "'Inter', system-ui", fontSize: "0.84rem", color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const APPLICANT_FEATURES: Feature[] = [
  { icon: "◆", label: "AI Career Mentor", desc: "A shadow mentor that challenges your thinking, not just your resume. Streamed conversations that adapt to you.", color: "var(--indigo)", glow: "rgba(124,133,245,0.15)" },
  { icon: "⊕", label: "Gap Analyzer", desc: "Multi-agent analysis: live market oracle, skill gap scoring, and a day-by-day learning syllabus with verified courses.", color: "var(--copper)", glow: "rgba(201,168,108,0.15)" },
  { icon: "⊟", label: "Application Tracker", desc: "Every application, every stage, every follow-up. Never lose track of where you stand.", color: "var(--green)", glow: "rgba(90,138,106,0.15)" },
  { icon: "◈", label: "ATS Scanner", desc: "Score your resume against any job description. Know exactly what a recruiter's parser will see.", color: "var(--indigo)", glow: "rgba(124,133,245,0.15)" },
  { icon: "◷", label: "Cover Letter AI", desc: "Written from your actual career data — not generic templates. Targeted to each role.", color: "var(--copper)", glow: "rgba(201,168,108,0.15)" },
  { icon: "◎", label: "Mock Interview", desc: "Live AI interviewer with real-time voice + feedback. Behavioral, technical, case — you pick the format.", color: "var(--green)", glow: "rgba(90,138,106,0.15)" },
  { icon: "◉", label: "Salary & Negotiation", desc: "Live market ranges by role and location. Practice negotiation with an AI that pushes back.", color: "var(--copper)", glow: "rgba(201,168,108,0.15)" },
  { icon: "⌁", label: "Network Map", desc: "Surface warm intro paths through your LinkedIn network. Know who can open doors before you knock.", color: "var(--indigo)", glow: "rgba(124,133,245,0.15)" },
];

const EMPLOYER_FEATURES: Feature[] = [
  { icon: "◐", label: "AI Job Description Builder", desc: "Write job descriptions that attract the right candidates — not everyone. AI-scored, bias-checked, and market-calibrated.", color: "var(--indigo)", glow: "rgba(124,133,245,0.15)" },
  { icon: "◑", label: "AI Resume Screening", desc: "Auto-score every application against your rubric. Shortlist the top candidates without reading 200 resumes.", color: "var(--copper)", glow: "rgba(201,168,108,0.15)" },
  { icon: "◒", label: "Candidate Pipeline", desc: "Kanban-style hiring board. Move candidates through stages, leave AI-generated notes, track decisions.", color: "var(--green)", glow: "rgba(90,138,106,0.15)" },
  { icon: "◓", label: "Interview Kit", desc: "Auto-generated question sets per candidate based on their resume. Role-specific. One click.", color: "var(--indigo)", glow: "rgba(124,133,245,0.15)" },
  { icon: "◔", label: "Company Branding", desc: "Build a company profile that sells the role before a recruiter ever calls. Culture, team, and mission — all in one place.", color: "var(--copper)", glow: "rgba(201,168,108,0.15)" },
];

const APPLICANT_STEPS = [
  { n: "01", title: "Enter your email", desc: "No password, no forms. A magic link lands in your inbox — click it and you're in.", color: "var(--copper)" },
  { n: "02", title: "Build your career profile", desc: "Import from LinkedIn or fill in your identity, skills, and background. Takes 5 minutes.", color: "var(--copper)" },
  { n: "03", title: "Let the tools work", desc: "AI analyzes your profile against any target role. Gap scores, readiness report, syllabus, and salary intel — all generated for you.", color: "var(--copper)" },
];

const EMPLOYER_STEPS = [
  { n: "01", title: "Sign in with your work email", desc: "Magic link — no passwords. Select 'Hiring' during onboarding and you're in the employer dashboard.", color: "var(--indigo)" },
  { n: "02", title: "Post a role with AI assistance", desc: "Describe what you need in plain English. AI builds a structured, market-calibrated job description.", color: "var(--indigo)" },
  { n: "03", title: "Screen, pipeline, and hire", desc: "Every applicant is auto-scored. Move the best through your pipeline with AI-assisted interview kits.", color: "var(--indigo)" },
];

const FAQS = [
  { q: "How does sign-in work? Do I need a password?", a: "No password, ever. Enter your email and we send a secure magic link. Click it and you're signed in. Works for both job seekers and employers — the same email flow, with role selection on first login." },
  { q: "Is Pathon free to use?", a: "Yes, the core platform is free during our early access period. You get full access to all tools — the gap analyzer, mock interview, ATS scanner, cover letter AI, and more. We'll introduce optional paid plans in the future." },
  { q: "How is this different from ChatGPT or other AI tools?", a: "Pathon is purpose-built for hiring — not a general chatbot. Every tool is connected to your career profile, so the gap analysis, cover letters, and interview prep are personalized to you specifically. We also use real live market data for salary and demand signals." },
  { q: "What does the Gap Analyzer actually do?", a: "It runs a 3-agent AI pipeline: first it fetches live salary and market demand data for your target role, then a Planner agent maps your specific skill gaps, and finally a Syllabus Builder creates a day-by-day learning plan with real verified courses from Coursera, YouTube, and certification programs." },
  { q: "I'm an employer. Can I use this to screen candidates?", a: "Yes. The employer dashboard includes AI resume scoring, a Kanban hiring pipeline, auto-generated interview question sets per candidate, and a job description builder. You don't need any technical knowledge — it works out of the box." },
  { q: "Is my career data secure?", a: "All data is stored encrypted in Supabase (PostgreSQL). Your career profile, resume, and LinkedIn data are only used to power your personal tools — never shared with employers or third parties without your explicit action." },
  { q: "Does the mock interview actually talk back?", a: "Yes. The mock interview uses real-time voice streaming — you speak, the AI interviewer responds with spoken audio. You can pick behavioral, technical, or case interview formats and get detailed feedback at the end of each session." },
  { q: "Can I import my LinkedIn data?", a: "Yes. The LinkedIn import pulls your positions, skills, summary, and recent posts. This enriches your career profile so every AI tool — from the mentor to the ATS scanner — knows your actual background." },
];

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, color = "var(--copper)" }: { eyebrow: string; title: string; subtitle?: string; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      style={{ textAlign: "center", marginBottom: "3.5rem" }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color, marginBottom: "0.75rem" }}>{eyebrow}</p>
      <h2 style={{ fontFamily: "'Poppins', system-ui", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--text-1)", letterSpacing: "-0.025em", margin: "0 0 1rem", lineHeight: 1.15 }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: "'Inter', system-ui", fontSize: "1rem", color: "var(--text-3)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>{subtitle}</p>}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EntryScreen({ authError }: { authError?: string }) {
  const [mode, setMode] = useState<"applicant" | "employer">("applicant");
  const accent = mode === "applicant" ? "var(--copper)" : "var(--indigo)";
  const accentHex = mode === "applicant" ? "#c9a86c" : "#7c85f5";

  const W = "min(1160px, 92vw)";
  const section: React.CSSProperties = { padding: "5rem max(1.5rem, 4vw)", position: "relative" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(13,14,18,0.85)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 max(1.5rem, 4vw)",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/pathonlogo.png" alt="Pathon" style={{ width: "28px", height: "28px", borderRadius: "8px", display: "block" }} />
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 600, fontSize: "1rem", color: "var(--text-1)", letterSpacing: "-0.01em" }}>Pathon</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--text-4)", textTransform: "uppercase", marginLeft: "2px" }}>Beta</span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a href="#features" style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "var(--text-3)", textDecoration: "none", padding: "4px 12px", display: "none" } as React.CSSProperties}>Features</a>
          <a href="#faq" style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "var(--text-3)", textDecoration: "none", padding: "4px 12px" }}>FAQ</a>
          <a href="#get-started">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: `linear-gradient(135deg, ${accentHex}cc, ${accentHex}88)`,
                borderRadius: "9px", padding: "7px 18px",
                fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "0.82rem", color: "#fff",
                cursor: "pointer", boxShadow: `0 2px 12px ${accentHex}30`,
                transition: "background 0.3s",
              }}
            >
              Get started
            </motion.div>
          </a>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ ...section, paddingTop: "6rem", paddingBottom: "5rem", textAlign: "center" }}>
        {/* Mode switcher */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", borderRadius: "14px", padding: "4px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "2.5rem" }}
        >
          {(["applicant", "employer"] as const).map((m) => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "8px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                fontFamily: "'Inter', system-ui", fontWeight: 500, fontSize: "0.85rem",
                background: mode === m ? (m === "applicant" ? "rgba(201,168,108,0.18)" : "rgba(124,133,245,0.18)") : "transparent",
                color: mode === m ? (m === "applicant" ? "var(--copper)" : "var(--indigo)") : "var(--text-4)",
                transition: "all 0.2s",
              }}
            >
              {m === "applicant" ? "For Job Seekers" : "For Employers"}
            </motion.button>
          ))}
        </motion.div>

        {/* Headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: W, margin: "0 auto" }}
          >
            <h1 style={{
              fontFamily: "'Poppins', system-ui", fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(2.4rem, 6vw, 4.5rem)", color: "var(--text-1)",
              letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 1.25rem",
            }}>
              {mode === "applicant" ? (
                <>Your career,<br />
                  <span style={{ color: "var(--copper)" }}>intelligently</span> accelerated.</>
              ) : (
                <>Hire better.<br />
                  <span style={{ color: "var(--indigo)" }}>Three times</span> faster.</>
              )}
            </h1>
            <p style={{
              fontFamily: "'Inter', system-ui", fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
              color: "var(--text-3)", lineHeight: 1.75, maxWidth: "600px", margin: "0 auto 2.5rem",
            }}>
              {mode === "applicant"
                ? "Pathon gives you a full intelligence layer for your job search — from a live market oracle and skill gap analysis, to AI mock interviews and salary negotiation practice."
                : "Pathon automates the grunt work of hiring — AI-written job descriptions, auto-scored applicants, interview kits, and a pipeline that actually moves."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Auth form */}
        <motion.div
          id="get-started"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ maxWidth: "540px", margin: "0 auto" }}
        >
          <AuthForm accent={accentHex} mode={mode} />
          {authError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "#ef4444", marginTop: "0.75rem" }}>
              {authError}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "3rem max(1.5rem,4vw)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, var(--copper), var(--indigo), var(--green), transparent)", opacity: 0.35 }} />
        <div style={{ maxWidth: W, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "2.5rem" }}>
          <AnimatedStat value="13+" label="AI-powered tools" color="var(--copper)" />
          <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
          <AnimatedStat value="5" label="agent pipeline" color="var(--indigo)" />
          <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
          <AnimatedStat value="2" label="sides of hiring" color="var(--green)" />
          <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
          <AnimatedStat value="0" label="passwords needed" color="var(--copper)" />
          <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
          <AnimatedStat value="Real-time" label="streaming AI" color="var(--indigo)" />
        </div>
      </section>

      {/* ── Job Seeker Features ──────────────────────────────────────────────── */}
      <section id="features" style={section}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="For Job Seekers"
            title="Every tool you need to land the role."
            subtitle="Eight AI tools, all connected to your career profile. Not generic — built around you."
            color="var(--copper)"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {APPLICANT_FEATURES.map((f, i) => <FeatureCard key={f.label} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works: Applicants ─────────────────────────────────────────── */}
      <section style={{ ...section, background: "rgba(255,255,255,0.015)" }}>
        <div className="entry-two-col" style={{ maxWidth: W, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <SectionHeader eyebrow="How it works" title="Three steps to your next role." color="var(--copper)" />
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {APPLICANT_STEPS.map((s, i) => <StepCard key={s.n} {...s} i={i} />)}
            </div>
          </div>
          {/* Visual panel */}
          <motion.div
            className="entry-visual-panel"
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(19,21,28,0.8)", border: "1px solid rgba(201,168,108,0.15)",
              borderRadius: "20px", padding: "2rem", backdropFilter: "blur(20px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {[
              { label: "Readiness Score", value: "74 / 100", color: "var(--copper)" },
              { label: "Critical gaps found", value: "2", color: "#ef4444" },
              { label: "Moderate gaps", value: "3", color: "var(--copper)" },
              { label: "Salary range", value: "$145k – $210k", color: "var(--green)" },
              { label: "Market demand", value: "Very High (+28% YoY)", color: "#22c55e" },
              { label: "Syllabus ready", value: "48-hour plan", color: "var(--indigo)" },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span style={{ fontFamily: "'Inter', system-ui", fontSize: "0.82rem", color: "var(--text-3)" }}>{row.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", fontWeight: 600, color: row.color }}>{row.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Employer Features ────────────────────────────────────────────────── */}
      <section style={section}>
        <div style={{ maxWidth: W, margin: "0 auto" }}>
          <SectionHeader
            eyebrow="For Employers"
            title="The AI hiring layer your team actually needs."
            subtitle="From writing the job description to moving the final candidate — Pathon handles the repetitive work."
            color="var(--indigo)"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {EMPLOYER_FEATURES.map((f, i) => <FeatureCard key={f.label} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works: Employers ──────────────────────────────────────────── */}
      <section style={{ ...section, background: "rgba(255,255,255,0.015)" }}>
        <div className="entry-two-col" style={{ maxWidth: W, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          {/* Visual panel */}
          <motion.div
            className="entry-visual-panel"
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(19,21,28,0.8)", border: "1px solid rgba(124,133,245,0.15)",
              borderRadius: "20px", padding: "2rem", backdropFilter: "blur(20px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--indigo)", marginBottom: "1rem" }}>Pipeline — Senior ML Engineer</div>
            {[
              { name: "Priya K.", score: 94, stage: "Offer", color: "#22c55e" },
              { name: "James L.", score: 87, stage: "Final Interview", color: "var(--indigo)" },
              { name: "Ana R.", score: 82, stage: "Technical", color: "var(--copper)" },
              { name: "David M.", score: 71, stage: "Screening", color: "var(--text-3)" },
              { name: "Sara T.", score: 65, stage: "Applied", color: "var(--text-4)" },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${c.color}20`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui", fontWeight: 600, fontSize: "0.7rem", color: c.color, flexShrink: 0 }}>
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Inter', system-ui", fontWeight: 500, fontSize: "0.85rem", color: "var(--text-1)" }}>{c.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.08em" }}>{c.stage}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", fontWeight: 700, color: c.color }}>{c.score}</div>
              </motion.div>
            ))}
          </motion.div>

          <div>
            <SectionHeader eyebrow="How it works" title="Post, screen, and hire — in one place." color="var(--indigo)" />
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {EMPLOYER_STEPS.map((s, i) => <StepCard key={s.n} {...s} i={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={section}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <SectionHeader
            eyebrow="FAQ"
            title="Questions answered."
            subtitle="Everything you need to know before you sign in."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ ...section, textAlign: "center", paddingBottom: "7rem" }}>
        <div style={{ maxWidth: "620px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: "rgba(19,21,28,0.8)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px", padding: "3rem 2.5rem",
              backdropFilter: "blur(20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, var(--copper), var(--indigo), transparent)" }} />
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.75rem" }}>
              Ready when you are
            </p>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text-1)", letterSpacing: "-0.025em", margin: "0 0 1rem", lineHeight: 1.2 }}>
              Start in 30 seconds.<br />No credit card.
            </h2>
            <p style={{ fontFamily: "'Inter', system-ui", fontSize: "0.9rem", color: "var(--text-3)", lineHeight: 1.7, marginBottom: "2rem" }}>
              Enter your email and a magic link will take you straight in. Works for both job seekers and hiring teams.
            </p>
            <AuthForm accent={accentHex} mode={mode} />
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem max(1.5rem, 4vw)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/pathonlogo.png" alt="Pathon" style={{ width: "22px", height: "22px", borderRadius: "6px", display: "block" }} />
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-2)" }}>Pathon</span>
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-4)", margin: 0 }}>
          Built for Hawkathon 2026 · Career Intelligence Platform
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["For Job Seekers", "For Employers", "FAQ"].map((link) => (
            <a key={link} href={link === "FAQ" ? "#faq" : "#get-started"} style={{ fontFamily: "'Inter', system-ui", fontSize: "0.78rem", color: "var(--text-4)", textDecoration: "none" }}>{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
