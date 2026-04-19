"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { STATUS_ORDER, STATUS_LABELS, type JobApplication, type ApplicationStatus } from "@/types/tracker";
import { isGhosted, daysSince } from "@/lib/utils/days-since";
import { moveApplication, removeApplication, addApplication, saveNotes } from "@/app/actions/tracker";

// ── Colour palette per status ──────────────────────────────────────────────
const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied:      "#7c85f5",
  phone_screen: "#f5a623",
  interview:    "#c9a86c",
  offer:        "#5a8a6a",
  rejected:     "#e05c5c",
  ghosted:      "#666e8a",
};

const STATUS_GLOW: Record<ApplicationStatus, string> = {
  applied:      "rgba(124,133,245,0.25)",
  phone_screen: "rgba(245,166,35,0.25)",
  interview:    "rgba(201,168,108,0.25)",
  offer:        "rgba(90,138,106,0.25)",
  rejected:     "rgba(224,92,92,0.25)",
  ghosted:      "rgba(102,110,138,0.25)",
};

const STATUS_GRADIENT: Record<ApplicationStatus, string> = {
  applied:      "radial-gradient(circle at 60% 40%, rgba(124,133,245,0.18) 0%, transparent 70%)",
  phone_screen: "radial-gradient(circle at 60% 40%, rgba(245,166,35,0.15) 0%, transparent 70%)",
  interview:    "radial-gradient(circle at 60% 40%, rgba(201,168,108,0.15) 0%, transparent 70%)",
  offer:        "radial-gradient(circle at 60% 40%, rgba(90,138,106,0.18) 0%, transparent 70%)",
  rejected:     "radial-gradient(circle at 60% 40%, rgba(224,92,92,0.15) 0%, transparent 70%)",
  ghosted:      "radial-gradient(circle at 60% 40%, rgba(102,110,138,0.12) 0%, transparent 70%)",
};

// ── Animated count-up hook ─────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── Stat Orb ──────────────────────────────────────────────────────────────
function StatOrb({ label, value, color, delay = 0 }: { label: string; value: number | string; color: string; delay?: number }) {
  const numVal = typeof value === "number" ? value : parseInt(value as string) || 0;
  const isPercent = typeof value === "string" && value.includes("%");
  const count = useCountUp(numVal, 900);
  const displayVal = isPercent ? `${count}%` : count;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 220, delay }}
      whileHover={{ scale: 1.08, y: -4 }}
      style={{
        position: "relative",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}22 0%, ${color}08 60%, transparent 100%)`,
        border: `1px solid ${color}40`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        boxShadow: `0 0 0 1px ${color}20, inset 0 1px 0 ${color}20, 0 8px 32px ${color}15`,
        cursor: "default",
        flexShrink: 0,
      }}
    >
      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay * 2 }}
        style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          border: `1px solid ${color}30`,
          pointerEvents: "none",
        }}
      />
      <span style={{
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontWeight: 300,
        fontSize: "1.6rem",
        color,
        lineHeight: 1,
        letterSpacing: "-0.03em",
      }}>
        {displayVal}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "8px",
        letterSpacing: "0.1em",
        color: `${color}aa`,
        textTransform: "uppercase",
        marginTop: "4px",
        textAlign: "center",
        lineHeight: 1.2,
        padding: "0 8px",
      }}>
        {label}
      </span>
    </motion.div>
  );
}

// ── FunnelMetrics ──────────────────────────────────────────────────────────
function FunnelMetrics({ apps }: { apps: JobApplication[] }) {
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.current_status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const total = apps.length;
  const ghostCount = apps.filter((a) => isGhosted(a.last_activity_at, a.current_status)).length;
  const conversionRate = total > 0 ? Math.round((counts.offer / total) * 100) : 0;
  const responseRate = total > 0 ? Math.round(((total - counts.applied - counts.rejected) / total) * 100) : 0;

  return (
    <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2rem", alignItems: "center" }}>
      <StatOrb label="Total" value={total} color="#7c85f5" delay={0} />
      <StatOrb label="In Flight" value={counts.phone_screen + counts.interview} color="#c9a86c" delay={0.08} />
      <StatOrb label="Offers" value={counts.offer} color="#5a8a6a" delay={0.16} />
      <StatOrb label="Ghosted?" value={ghostCount} color="#e05c5c" delay={0.24} />
      <StatOrb label="Response %" value={`${responseRate}%`} color="#c9a86c" delay={0.32} />
      <StatOrb label="Offer %" value={`${conversionRate}%`} color="#5a8a6a" delay={0.40} />
    </div>
  );
}

// ── AddApplicationModal ────────────────────────────────────────────────────
function AddApplicationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { company: string; role_title: string; job_url?: string; job_description?: string; notes?: string }) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [jd, setJd] = useState("");
  const [notes, setNotes] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onAdd({
      company: company.trim(),
      role_title: role.trim(),
      job_url: url.trim() || undefined,
      job_description: jd.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const underlineInputStyle = (fieldName: string): React.CSSProperties => ({
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1.5px solid ${focusedField === fieldName ? "var(--copper)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 0,
    padding: "0.65rem 0",
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    color: "rgba(255,255,255,0.85)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.25s ease",
    boxShadow: focusedField === fieldName ? `0 1px 0 var(--copper)` : "none",
  });

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "9px",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(24px)",
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        style={{
          background: "rgba(19,21,28,0.92)",
          border: "1px solid rgba(201,168,108,0.2)",
          borderRadius: "20px",
          padding: "2.25rem",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(40px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.16em",
            color: "rgba(201,168,108,0.6)",
            textTransform: "uppercase",
            margin: "0 0 0.5rem",
          }}>
            New Application
          </p>
          <h2 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "1.6rem",
            fontWeight: 300,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Add to tracker
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={labelStyle}>Company *</label>
            <input
              style={underlineInputStyle("company")}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onFocus={() => setFocusedField("company")}
              onBlur={() => setFocusedField(null)}
              placeholder="Anthropic, OpenAI, Stripe…"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Role Title *</label>
            <input
              style={underlineInputStyle("role")}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={() => setFocusedField("role")}
              onBlur={() => setFocusedField(null)}
              placeholder="Senior Software Engineer"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Job URL</label>
            <input
              style={underlineInputStyle("url")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocusedField("url")}
              onBlur={() => setFocusedField(null)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label style={labelStyle}>Job Description</label>
            <textarea
              style={{
                ...underlineInputStyle("jd"),
                minHeight: "80px",
                resize: "vertical",
                lineHeight: 1.6,
              }}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              onFocus={() => setFocusedField("jd")}
              onBlur={() => setFocusedField(null)}
              placeholder="Paste JD — used by ATS scanner & cover letter…"
            />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{
                ...underlineInputStyle("notes"),
                minHeight: "56px",
                resize: "vertical",
                lineHeight: 1.6,
              }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={() => setFocusedField("notes")}
              onBlur={() => setFocusedField(null)}
              placeholder="Referral from X, applied via Y…"
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "100px",
                padding: "0.6rem 1.5rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(201,168,108,0.4)" }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: "linear-gradient(135deg, #c9a86c 0%, #b8945a 100%)",
                border: "none",
                borderRadius: "100px",
                padding: "0.6rem 1.75rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1208",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(201,168,108,0.3)",
              }}
            >
              Add →
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── ApplicationCard ────────────────────────────────────────────────────────
function ApplicationCard({
  app,
  onMove,
  onDelete,
}: {
  app: JobApplication;
  onMove: (status: ApplicationStatus) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ghosted = isGhosted(app.last_activity_at, app.current_status);
  const days = daysSince(app.last_activity_at);
  const status = app.current_status as ApplicationStatus;
  const accent = STATUS_COLOR[status];
  const glow = STATUS_GLOW[status];

  const nextStatuses = STATUS_ORDER.filter((s) => s !== status && s !== "ghosted").slice(0, 3);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accent}40, 0 0 20px ${glow}`,
      }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      style={{
        background: ghosted
          ? "rgba(224,92,92,0.06)"
          : "rgba(19,21,28,0.8)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${ghosted ? "rgba(224,92,92,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: "12px",
        padding: "1rem",
        cursor: "pointer",
        position: "relative",
        overflow: "visible",
        boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Ghost badge */}
      {ghosted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "rgba(224,92,92,0.15)",
            border: "1px solid rgba(224,92,92,0.35)",
            borderRadius: "6px",
            padding: "2px 7px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "8px",
            color: "#e05c5c",
            letterSpacing: "0.08em",
          }}
        >
          GHOST?
        </motion.div>
      )}

      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: "rgba(255,255,255,0.9)",
        margin: "0 0 3px",
        lineHeight: 1.3,
        paddingRight: ghosted ? "64px" : "0",
      }}>
        {app.company}
      </p>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        color: "rgba(255,255,255,0.4)",
        margin: "0 0 0.75rem",
        lineHeight: 1.3,
      }}>
        {app.role_title}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          color: accent,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          padding: "2px 7px",
          borderRadius: "5px",
          letterSpacing: "0.05em",
        }}>
          {STATUS_LABELS[status]}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          color: "rgba(255,255,255,0.3)",
        }}>
          {days}d
        </span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              paddingTop: "0.85rem",
              marginTop: "0.85rem",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}>
              {app.notes && (
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 0.75rem",
                  lineHeight: 1.6,
                }}>
                  {app.notes}
                </p>
              )}
              {app.job_url && (
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    color: "var(--copper)",
                    textDecoration: "none",
                    marginBottom: "0.85rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    opacity: 0.8,
                  }}
                >
                  {app.job_url}
                </a>
              )}

              {/* Move controls */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.65rem" }}>
                {nextStatuses.map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMove(s)}
                    style={{
                      background: `${STATUS_COLOR[s]}12`,
                      border: `1px solid ${STATUS_COLOR[s]}35`,
                      borderRadius: "7px",
                      padding: "3px 10px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px",
                      color: STATUS_COLOR[s],
                      cursor: "pointer",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    → {STATUS_LABELS[s]}
                  </motion.button>
                ))}
                {status !== "ghosted" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMove("ghosted")}
                    style={{
                      background: "rgba(102,110,138,0.1)",
                      border: "1px solid rgba(102,110,138,0.3)",
                      borderRadius: "7px",
                      padding: "3px 10px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "11px",
                      color: "#666e8a",
                      cursor: "pointer",
                    }}
                  >
                    Mark ghosted
                  </motion.button>
                )}
              </div>
              <button
                onClick={() => { if (confirm("Delete this application?")) onDelete(); }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  apps,
  onMove,
  onDelete,
}: {
  status: ApplicationStatus;
  apps: JobApplication[];
  onMove: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  const accent = STATUS_COLOR[status];
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("application_id");
    if (id) onMove(id, status);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 200 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        minWidth: "230px",
        flex: "1 1 230px",
        background: dragOver
          ? `linear-gradient(180deg, ${accent}12 0%, transparent 100%)`
          : `linear-gradient(180deg, rgba(19,21,28,0.6) 0%, rgba(13,14,18,0.3) 100%)`,
        border: dragOver
          ? `1px dashed ${accent}60`
          : "1px solid rgba(255,255,255,0.05)",
        borderRadius: "16px",
        padding: "1rem",
        transition: "background 0.2s, border-color 0.2s",
        backdropFilter: "blur(12px)",
        boxShadow: dragOver ? `0 0 30px ${accent}15` : "none",
      }}
    >
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <motion.div
            animate={{ boxShadow: [`0 0 6px ${accent}80`, `0 0 12px ${accent}`, `0 0 6px ${accent}80`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: accent,
            }}
          />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "-0.01em",
          }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          color: accent,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          borderRadius: "100px",
          padding: "1px 8px",
        }}>
          {apps.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "80px" }}>
        <AnimatePresence>
          {apps.map((app) => (
            <div
              key={app.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("application_id", app.id)}
            >
              <ApplicationCard
                app={app}
                onMove={(s) => onMove(app.id, s)}
                onDelete={() => onDelete(app.id)}
              />
            </div>
          ))}
        </AnimatePresence>
        {apps.length === 0 && (
          <div style={{
            borderRadius: "10px",
            border: `1px dashed rgba(255,255,255,0.08)`,
            padding: "1.5rem",
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "rgba(255,255,255,0.2)",
            }}>
              Drop here
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── KanbanBoard ────────────────────────────────────────────────────────────
export function KanbanBoard({ initialApps }: { initialApps: JobApplication[] }) {
  const [apps, setApps] = useState(initialApps);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const ghostedApps = apps.filter((a) => isGhosted(a.last_activity_at, a.current_status));

  function handleMove(id: string, newStatus: ApplicationStatus) {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, current_status: newStatus, last_activity_at: new Date().toISOString() } : a
      )
    );
    startTransition(async () => {
      await moveApplication(id, newStatus);
    });
  }

  function handleDelete(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
    startTransition(async () => {
      await removeApplication(id);
    });
  }

  async function handleAdd(data: { company: string; role_title: string; job_url?: string; job_description?: string; notes?: string }) {
    setShowAdd(false);
    startTransition(async () => {
      const newApp = await addApplication(data);
      setApps((prev) => [newApp as unknown as JobApplication, ...prev]);
    });
  }

  return (
    <div style={{ position: "relative" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2.25rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.92)",
              margin: "0 0 0.4rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Application Tracker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            Track every application. Never get ghosted silently.
          </motion.p>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring", damping: 18 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 8px 35px rgba(201,168,108,0.45)",
          }}
          whileTap={{ scale: 0.96, rotateX: "2deg" }}
          onClick={() => setShowAdd(true)}
          style={{
            background: "linear-gradient(135deg, rgba(201,168,108,0.15) 0%, rgba(201,168,108,0.08) 100%)",
            border: "1px solid rgba(201,168,108,0.35)",
            borderRadius: "100px",
            padding: "0.7rem 1.75rem",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--copper)",
            cursor: "pointer",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 20px rgba(201,168,108,0.15), inset 0 1px 0 rgba(201,168,108,0.15)",
            flexShrink: 0,
            perspective: "800px",
          }}
        >
          + Add application
        </motion.button>
      </motion.div>

      {/* ── Ghost Alert Banner ──────────────────────────────────────────── */}
      <AnimatePresence>
        {ghostedApps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scaleX: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            exit={{ opacity: 0, y: -12, scaleX: 0.96 }}
            transition={{ type: "spring", damping: 20, stiffness: 240 }}
            style={{
              background: "linear-gradient(135deg, rgba(224,92,92,0.08) 0%, rgba(201,168,108,0.06) 100%)",
              border: "1px solid rgba(224,92,92,0.2)",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <motion.span
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: "18px", flexShrink: 0 }}
            >
              👻
            </motion.span>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "rgba(224,92,92,0.85)",
              margin: 0,
              lineHeight: 1.5,
            }}>
              <strong style={{ color: "#e05c5c" }}>{ghostedApps.length}</strong>{" "}
              application{ghostedApps.length > 1 ? "s look" : " looks"} like{" "}
              {ghostedApps.length > 1 ? "they" : "it"} may be ghosted — no activity in 14–21+ days. Consider following up.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Funnel Metrics ─────────────────────────────────────────────── */}
      <FunnelMetrics apps={apps} />

      {/* ── Kanban Columns ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          overflowX: "auto",
          paddingBottom: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {STATUS_ORDER.map((status, i) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 200, delay: i * 0.06 }}
            style={{ flex: "1 1 230px", minWidth: "230px" }}
          >
            <KanbanColumn
              status={status}
              apps={apps.filter((a) => a.current_status === status)}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Add Application Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <AddApplicationModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </div>
  );
}
