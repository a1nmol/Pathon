"use client";

import { useState, useRef, useTransition, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { importConnections, analyzeNetwork } from "@/app/actions/network";
import { parseConnectionsCSV } from "@/lib/linkedin/connections-parser";
import type { NetworkConnection, WarmPath } from "@/types/network";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setCount(target); return; }
    let cur = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setCount(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration, enabled]);
  return count;
}

// ── Stat Orb ───────────────────────────────────────────────────────────────────
function StatOrb({
  value,
  label,
  color = "var(--copper)",
  delay = 0,
  isText = false,
}: {
  value: number | string;
  label: string;
  color?: string;
  delay?: number;
  isText?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const numVal = typeof value === "number" ? value : parseInt(String(value).replace(/\D/g, "")) || 0;
  const count = useCountUp(numVal, 900, inView && !isText);

  const displayVal = isText
    ? value
    : typeof value === "string" && isNaN(Number(value.replace(/,/g, "")))
    ? value
    : count.toLocaleString();

  const colorAlpha = color
    .replace("var(--copper)", "rgba(201,168,108,")
    .replace("var(--indigo)", "rgba(124,133,245,")
    .replace("var(--green)", "rgba(90,138,106,");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "130px",
        height: "130px",
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, ${colorAlpha}0.12) 0%, transparent 65%)`,
        border: `1px solid ${colorAlpha}0.2)`,
        boxShadow: `0 0 24px ${colorAlpha}0.06), inset 0 0 20px ${colorAlpha}0.04)`,
        backdropFilter: "blur(12px)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Outer pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
        style={{
          position: "absolute",
          inset: "-6px",
          borderRadius: "50%",
          border: `1px solid ${colorAlpha}0.15)`,
          pointerEvents: "none",
        }}
      />
      <span style={{
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontWeight: 300,
        fontSize: isText ? "0.72rem" : "1.5rem",
        color,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        textAlign: "center",
        padding: "0 6px",
        maxWidth: "110px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: isText ? "nowrap" : "normal",
      }}>
        {displayVal}
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.52rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-4)",
        marginTop: "0.35rem",
      }}>
        {label}
      </span>
    </motion.div>
  );
}

// ── Thinking wave ──────────────────────────────────────────────────────────────
function ThinkingWave() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "20px" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          style={{
            width: "3px",
            height: "16px",
            background: "var(--copper)",
            borderRadius: "2px",
            transformOrigin: "center",
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

// ── Drag-drop import zone ──────────────────────────────────────────────────────
type ImportStep =
  | { id: "idle" }
  | { id: "preview"; connections: NetworkConnection[] }
  | { id: "saving" }
  | { id: "error"; message: string };

function ImportSection({ onImported }: { onImported: (c: NetworkConnection[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>({ id: "idle" });
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [, startTransition] = useTransition();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStep({ id: "error", message: "Please upload a .csv file (LinkedIn Connections.csv)." });
      return;
    }
    setIsParsing(true);
    try {
      const connections = await parseConnectionsCSV(file);
      if (connections.length === 0) {
        setStep({ id: "error", message: "No connections found. Make sure you are uploading Connections.csv from your LinkedIn data export." });
      } else {
        setStep({ id: "preview", connections });
      }
    } catch (err) {
      setStep({ id: "error", message: `Could not parse: ${err instanceof Error ? err.message : "unknown error"}` });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = useCallback((connections: NetworkConnection[]) => {
    setStep({ id: "saving" });
    startTransition(async () => {
      try {
        await importConnections(connections);
        onImported(connections);
      } catch (err) {
        setStep({ id: "error", message: `Failed to save: ${err instanceof Error ? err.message : "unknown error"}` });
      }
    });
  }, [onImported]);

  const STEPS_GUIDE = [
    "Go to LinkedIn → Me → Settings & Privacy → Data Privacy → Get a copy of your data.",
    'Select "Connections" then click Request Archive.',
    "LinkedIn emails you a download link. Unzip it and find Connections.csv inside.",
    "Upload that CSV file below.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* How-to steps */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 1rem" }}>
          How to export from LinkedIn
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {STEPS_GUIDE.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
              style={{
                display: "flex",
                gap: "1rem",
                padding: "0.9rem 1.1rem",
                background: "rgba(19,21,28,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border)",
                borderRadius: i === 0 ? "8px 8px 0 0" : i === STEPS_GUIDE.length - 1 ? "0 0 8px 8px" : "0",
                borderTop: i > 0 ? "none" : "1px solid var(--border)",
              }}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "var(--copper)", flexShrink: 0, marginTop: "1px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-3)", lineHeight: 1.65 }}>
                {text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      {(step.id === "idle" || step.id === "error") && (
        <div>
          {isParsing ? (
            <div style={{
              padding: "3.5rem",
              textAlign: "center",
              background: "rgba(19,21,28,0.6)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }}>
              <ThinkingWave />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-4)", fontStyle: "italic", marginTop: "1.25rem" }}>
                Parsing your connections…
              </p>
            </div>
          ) : (
            <motion.div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              animate={{
                borderColor: isDragOver ? "rgba(201,168,108,0.6)" : "rgba(37,42,56,0.8)",
                background: isDragOver ? "rgba(201,168,108,0.04)" : "rgba(19,21,28,0.5)",
                boxShadow: isDragOver ? "0 0 40px rgba(201,168,108,0.08), inset 0 0 40px rgba(201,168,108,0.03)" : "none",
              }}
              transition={{ duration: 0.2 }}
              style={{
                border: "1.5px dashed rgba(37,42,56,0.8)",
                padding: "4rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                borderRadius: "12px",
                backdropFilter: "blur(12px)",
                position: "relative",
                overflow: "hidden",
              }}
              whileHover={{
                borderColor: "rgba(201,168,108,0.4)",
                background: "rgba(201,168,108,0.02)",
              }}
            >
              {/* Animated corner accents */}
              {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
                <div key={corner} style={{
                  position: "absolute",
                  width: "16px",
                  height: "16px",
                  borderColor: isDragOver ? "var(--copper)" : "var(--border-2)",
                  borderStyle: "solid",
                  borderWidth: 0,
                  ...(corner === "top-left" ? { top: "10px", left: "10px", borderTopWidth: "1px", borderLeftWidth: "1px" } : {}),
                  ...(corner === "top-right" ? { top: "10px", right: "10px", borderTopWidth: "1px", borderRightWidth: "1px" } : {}),
                  ...(corner === "bottom-left" ? { bottom: "10px", left: "10px", borderBottomWidth: "1px", borderLeftWidth: "1px" } : {}),
                  ...(corner === "bottom-right" ? { bottom: "10px", right: "10px", borderBottomWidth: "1px", borderRightWidth: "1px" } : {}),
                  transition: "border-color 0.2s",
                  borderRadius: "2px",
                }} />
              ))}

              {/* Cloud upload icon */}
              <div style={{ marginBottom: "1rem" }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ opacity: isDragOver ? 0.9 : 0.4 }}>
                  <path d="M18 22V10M18 10L13 15M18 10L23 15" stroke={isDragOver ? "#c9a86c" : "#9ba3b8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 26C6.24 26 4 23.76 4 21c0-2.54 1.88-4.63 4.32-4.95.41-4.05 3.82-7.05 7.93-7.05 1.6 0 3.07.47 4.28 1.28" stroke={isDragOver ? "#c9a86c" : "#9ba3b8"} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M27 26c2.76 0 5-2.24 5-5 0-2.54-1.88-4.63-4.32-4.95" stroke={isDragOver ? "#c9a86c" : "#9ba3b8"} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: isDragOver ? "var(--copper)" : "var(--text-3)", margin: "0 0 0.4rem", transition: "color 0.2s" }}>
                {isDragOver ? "Release to upload" : "Drop Connections.csv here"}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "var(--text-4)", margin: 0 }}>
                or click to browse — .csv files only
              </p>
              <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </motion.div>
          )}

          {step.id === "error" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem",
                color: "var(--text-3)",
                borderLeft: "2px solid rgba(138,90,90,0.6)",
                paddingLeft: "1rem",
                marginTop: "1rem",
                lineHeight: 1.65,
                background: "rgba(138,90,90,0.04)",
                padding: "0.75rem 1rem",
                borderRadius: "0 6px 6px 0",
              }}
            >
              {step.message}
            </motion.p>
          )}
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {step.id === "preview" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ease: EASE, duration: 0.4 }}
            style={{
              background: "rgba(19,21,28,0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.75rem",
            }}
          >
            <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.15rem", color: "var(--text-1)", margin: "0 0 0.4rem" }}>
              Found {step.connections.length.toLocaleString()} connections
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "var(--text-4)", margin: "0 0 1.25rem" }}>
              Preview of first 5:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "1.75rem" }}>
              {step.connections.slice(0, 5).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: EASE }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.55rem 0.85rem",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-2)", minWidth: "140px" }}>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.company ?? ""}
                    {c.position ? ` · ${c.position}` : ""}
                  </span>
                </motion.div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <motion.button
                onClick={() => handleConfirm(step.connections)}
                whileHover={{ scale: 1.02, boxShadow: "0 6px 24px rgba(201,168,108,0.22)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: "var(--copper)",
                  border: "none",
                  color: "#1a1410",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.78rem",
                  padding: "0.65rem 1.5rem",
                  cursor: "pointer",
                  borderRadius: "8px",
                  letterSpacing: "-0.01em",
                }}
              >
                Import {step.connections.length.toLocaleString()} connections →
              </motion.button>
              <button
                onClick={() => setStep({ id: "idle" })}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-4)" }}
              >
                ← choose different file
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saving */}
      {step.id === "saving" && (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "rgba(19,21,28,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}>
          <ThinkingWave />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-4)", fontStyle: "italic", marginTop: "1.25rem" }}>
            Saving connections to your network…
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Company chart ──────────────────────────────────────────────────────────────
function CompanyChart({ companies }: { companies: { name: string; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const max = companies[0]?.count ?? 1;

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {companies.map(({ name, count }, i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.04, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-3)", width: "150px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
          <div style={{ flex: 1, height: "5px", background: "var(--surface-2)", borderRadius: "3px", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${(count / max) * 100}%` } : {}}
              transition={{ duration: 0.7, delay: i * 0.04 + 0.2, ease: EASE }}
              style={{ height: "100%", background: "linear-gradient(90deg, var(--indigo), var(--copper))", borderRadius: "3px" }}
            />
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--text-4)", width: "24px", textAlign: "right", flexShrink: 0 }}>
            {count}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Overview section ───────────────────────────────────────────────────────────
function OverviewSection({ connections }: { connections: NetworkConnection[] }) {
  const companyMap = new Map<string, number>();
  for (const c of connections) {
    if (!c.company) continue;
    companyMap.set(c.company, (companyMap.get(c.company) ?? 0) + 1);
  }
  const topCompanies = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const uniqueCompanies = companyMap.size;
  const topCompany = topCompanies[0]?.name ?? "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 0.6rem" }}>
        Network overview
      </p>
      <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: "var(--text-1)", letterSpacing: "-0.02em", margin: "0 0 2rem" }}>
        Your network at a glance.
      </h2>

      {/* Stat orbs */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "3rem", alignItems: "center" }}>
        <StatOrb value={connections.length} label="connections" color="var(--indigo)" delay={0} />
        <StatOrb value={uniqueCompanies} label="companies" color="var(--copper)" delay={0.1} />
        <StatOrb value={topCompany} label="top company" color="var(--green)" delay={0.2} isText />
      </div>

      {/* Company chart */}
      {topCompanies.length > 0 && (
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 1rem" }}>
            Top companies
          </p>
          <div style={{
            background: "rgba(19,21,28,0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}>
            <CompanyChart companies={topCompanies} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Warm path card ─────────────────────────────────────────────────────────────
function WarmPathCard({ path, index }: { path: WarmPath; index: number }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(path.suggested_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [path.suggested_message]);

  const name = [path.connection.first_name, path.connection.last_name].filter(Boolean).join(" ");
  const initials = [path.connection.first_name?.[0], path.connection.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, ease: EASE, duration: 0.45 }}
      style={{
        background: "rgba(19,21,28,0.65)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--copper)",
        borderRadius: "0 12px 12px 0",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
        {/* Avatar circle */}
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, rgba(124,133,245,0.25) 0%, rgba(124,133,245,0.06) 100%)",
          border: "1px solid rgba(124,133,245,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--indigo)", letterSpacing: "0.05em" }}>
            {initials}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: "var(--text-1)", margin: "0 0 0.2rem" }}>
            {name || "—"}
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-4)", margin: 0 }}>
            {path.connection.position ?? ""}
            {path.connection.company ? ` @ ${path.connection.company}` : ""}
          </p>
        </div>
        {/* Target company badge */}
        <div style={{
          background: "rgba(201,168,108,0.06)",
          border: "1px solid rgba(201,168,108,0.2)",
          borderRadius: "6px",
          padding: "0.2rem 0.6rem",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--copper)" }}>
            {path.target_company}
          </span>
        </div>
      </div>

      {/* Relevance reason */}
      <p style={{
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontWeight: 300,
        fontSize: "0.85rem",
        color: "var(--text-3)",
        lineHeight: 1.75,
        margin: 0,
        paddingLeft: "1rem",
        borderLeft: "2px solid rgba(124,133,245,0.25)",
      }}>
        {path.relevance_reason}
      </p>

      {/* Suggested message */}
      <div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.54rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 0.6rem" }}>
          Suggested outreach
        </p>
        <div style={{
          position: "relative",
          background: "rgba(201,168,108,0.03)",
          border: "1px solid rgba(201,168,108,0.15)",
          borderRadius: "8px",
          padding: "1rem 1rem 2.75rem",
        }}>
          <p style={{
            fontFamily: "'DM Mono', 'Courier New', monospace",
            fontSize: "0.72rem",
            color: "var(--text-3)",
            lineHeight: 1.8,
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            {path.suggested_message}
          </p>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            style={{
              position: "absolute",
              bottom: "0.75rem",
              right: "0.85rem",
              background: copied ? "rgba(90,138,106,0.1)" : "none",
              border: copied ? "1px solid rgba(90,138,106,0.3)" : "1px solid transparent",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.56rem",
              color: copied ? "var(--green)" : "var(--text-4)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.25rem 0.6rem",
              borderRadius: "4px",
              transition: "all 0.2s",
            }}
          >
            {copied ? "copied ✓" : "copy →"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Warm path finder ───────────────────────────────────────────────────────────
function WarmPathFinder() {
  const [targetInput, setTargetInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [paths, setPaths] = useState<WarmPath[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleAnalyze = useCallback(() => {
    const companies = targetInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (companies.length === 0) return;
    setStatus("loading");
    setPaths([]);
    startTransition(async () => {
      try {
        const result = await analyzeNetwork(companies);
        setPaths(result);
        setStatus("done");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      }
    });
  }, [targetInput]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
      style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem", marginTop: "2.5rem" }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 0.6rem" }}>
        Warm path finder
      </p>
      <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: "var(--text-1)", letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>
        Find your way in.
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "var(--text-4)", lineHeight: 1.75, maxWidth: "520px", margin: "0 0 2rem" }}>
        Enter the companies you're targeting. Pathon scans your network and drafts personalized outreach for the most relevant warm paths.
      </p>

      {/* Input row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem", alignItems: "stretch" }}>
        <motion.div
          animate={{
            borderColor: focused ? "rgba(201,168,108,0.5)" : "var(--border)",
            boxShadow: focused ? "0 0 0 3px rgba(201,168,108,0.06)" : "none",
          }}
          style={{
            flex: 1,
            minWidth: "220px",
            background: "rgba(19,21,28,0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            padding: "0 0.9rem",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Google, Anthropic, OpenAI…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.78rem",
              color: "var(--text-1)",
              padding: "0.7rem 0",
              caretColor: "var(--copper)",
            }}
          />
        </motion.div>

        <motion.button
          onClick={handleAnalyze}
          disabled={status === "loading" || !targetInput.trim()}
          whileHover={status !== "loading" && targetInput.trim() ? { scale: 1.02, boxShadow: "0 6px 24px rgba(201,168,108,0.25)" } : {}}
          whileTap={{ scale: 0.98 }}
          style={{
            background: status === "loading" || !targetInput.trim() ? "var(--surface-2)" : "var(--copper)",
            color: status === "loading" || !targetInput.trim() ? "var(--text-4)" : "#1a1410",
            border: "none",
            borderRadius: "8px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "0.8rem",
            padding: "0 1.5rem",
            cursor: status === "loading" || !targetInput.trim() ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            transition: "background 0.2s, color 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "Scanning…" : "Find warm paths →"}
        </motion.button>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "2px" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                style={{
                  height: "90px",
                  background: "rgba(19,21,28,0.5)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--border)",
                  borderRadius: "0 12px 12px 0",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  overflow: "hidden",
                }}
              >
                {[80, 55, 40].map((w, j) => (
                  <div key={j} style={{ height: j === 0 ? "14px" : "10px", width: `${w}%`, background: "var(--surface-2)", borderRadius: "3px" }} />
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {status === "done" && (
          paths.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-4)" }}
            >
              No warm paths found for those companies. Try broadening your targets.
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {paths.map((p, i) => <WarmPathCard key={i} path={p} index={i} />)}
            </motion.div>
          )
        )}
      </AnimatePresence>

      {status === "error" && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: "var(--text-3)", borderLeft: "2px solid var(--border)", paddingLeft: "1rem", lineHeight: 1.65 }}>
          {errorMsg}
        </p>
      )}
    </motion.div>
  );
}

// ── Connection search ──────────────────────────────────────────────────────────
function ConnectionSearch({ connections }: { connections: NetworkConnection[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return connections.slice(0, 50);
    const q = query.toLowerCase();
    return connections
      .filter((c) =>
        [c.first_name, c.last_name, c.company, c.position]
          .filter(Boolean)
          .some((s) => s!.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [connections, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
      style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem", marginTop: "2.5rem" }}
    >
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", margin: "0 0 1rem" }}>
        Search connections
      </p>

      <motion.div
        animate={{
          borderColor: focused ? "rgba(201,168,108,0.5)" : "var(--border)",
          boxShadow: focused ? "0 0 0 3px rgba(201,168,108,0.06)" : "none",
        }}
        style={{
          background: "rgba(19,21,28,0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          padding: "0 0.9rem",
          marginBottom: "0.75rem",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4, flexShrink: 0, marginRight: "0.5rem" }}>
          <circle cx="6" cy="6" r="4.5" stroke="#9ba3b8" strokeWidth="1.2"/>
          <path d="M10 10L13 13" stroke="#9ba3b8" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search by name, company, or role…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.78rem",
            color: "var(--text-1)",
            padding: "0.7rem 0",
            caretColor: "var(--copper)",
          }}
        />
      </motion.div>

      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.1em", color: "var(--text-4)", margin: "0 0 0.75rem" }}>
        {query.trim()
          ? `${results.length} result${results.length !== 1 ? "s" : ""}`
          : `Showing first 50 of ${connections.length.toLocaleString()}`}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {results.map((c, i) => (
          <motion.div
            key={c.id ?? i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.015, 0.3) }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              padding: "0.6rem 0.85rem",
              background: i % 2 === 0 ? "rgba(19,21,28,0.4)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-2)", minWidth: "130px", flexShrink: 0 }}>
              {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.company ?? ""}
              {c.position ? ` · ${c.position}` : ""}
            </span>
            {c.connected_on && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {c.connected_on}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function NetworkMap({ initialConnections }: { initialConnections: NetworkConnection[] }) {
  const [connections, setConnections] = useState<NetworkConnection[]>(initialConnections);
  const hasConnections = connections.length > 0;

  const handleImported = useCallback((imported: NetworkConnection[]) => {
    setConnections(imported);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Ambient blob */}
      <div style={{
        position: "fixed",
        top: "20%",
        right: "5%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,133,245,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(60px)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Already-imported banner */}
        <AnimatePresence>
          {hasConnections && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: "rgba(90,138,106,0.06)",
                border: "1px solid rgba(90,138,106,0.2)",
                borderRadius: "10px",
                padding: "0.75rem 1.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "2.5rem",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "var(--text-3)", margin: 0 }}>
                {connections.length.toLocaleString()} connections imported. You can re-import to refresh.
              </p>
              <button
                onClick={() => setConnections([])}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--text-4)", letterSpacing: "0.1em" }}
              >
                re-import
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!hasConnections && <ImportSection onImported={handleImported} />}

        {hasConnections && (
          <>
            <OverviewSection connections={connections} />
            <WarmPathFinder />
            <ConnectionSearch connections={connections} />
          </>
        )}
      </div>
    </div>
  );
}
