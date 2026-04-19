"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { ModeSelector } from "@/components/layout/ModeSelector";
import { signOut } from "@/lib/auth/actions";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SettingsClientProps {
  email: string | undefined;
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid #252a38",
        paddingTop: "2rem",
        marginBottom: "2rem",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: danger ? "#c4545a" : "#5c6478",
          marginBottom: "1.5rem",
        }}
      >
        {title}
      </p>
      <div
        style={
          danger
            ? {
                border: "1px solid #3a1a1a",
                borderRadius: "8px",
                padding: "1.5rem",
                background: "rgba(58,26,26,0.15)",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value?: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#f0eff4",
            margin: "0 0 0.2rem",
          }}
        >
          {label}
        </p>
        {note && (
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "13px",
              color: "#5c6478",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {note}
          </p>
        )}
        {value && (
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              color: "#9ba3b8",
              margin: 0,
            }}
          >
            {value}
          </p>
        )}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

// ─── SettingsClient ────────────────────────────────────────────────────────────

export function SettingsClient({ email }: SettingsClientProps) {
  const router = useRouter();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [failureCount, setFailureCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Read failure archive count on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pathon_failures");
      if (raw) {
        const parsed = JSON.parse(raw);
        setFailureCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setFailureCount(0);
      }
    } catch {
      setFailureCount(0);
    }
  }, []);

  function handleClearFailures() {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    localStorage.removeItem("pathon_failures");
    setFailureCount(0);
    setCleared(true);
    setClearConfirm(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  async function handleSignOutAll() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/");
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#f0eff4",
      }}
    >
      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Section title="Account">
        <Row
          label="Email address"
          value={email ?? "—"}
          note="Magic link — no password required"
        >
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: signingOut ? "#5c6478" : "#9ba3b8",
              background: "none",
              border: "1px solid #252a38",
              borderRadius: "6px",
              padding: "0.4rem 0.85rem",
              cursor: signingOut ? "not-allowed" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!signingOut) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#c9a86c";
                (e.currentTarget as HTMLButtonElement).style.color = "#f0eff4";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#252a38";
              (e.currentTarget as HTMLButtonElement).style.color = "#9ba3b8";
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </Row>
      </Section>

      {/* ── Career Mode ─────────────────────────────────────────────────── */}
      <Section title="Career Mode">
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "13px",
            color: "#5c6478",
            marginBottom: "1.5rem",
            lineHeight: 1.6,
          }}
        >
          Sets how the mentor approaches you. Doesn&apos;t change the AI reasoning — just the tone and focus.
        </p>
        <ModeSelector />
      </Section>

      {/* ── Data ────────────────────────────────────────────────────────── */}
      <Section title="Data">
        <Row
          label="Your data"
          note="All profile data, career paths, and mentor conversations are private to your account. Nothing is shared or sold."
        />

        <div style={{ borderTop: "1px solid rgba(37,42,56,0.5)", paddingTop: "1.25rem", marginTop: "0.25rem" }}>
          <Row
            label="Failure Archive"
            note={
              failureCount !== null
                ? failureCount === 0
                  ? "Stored locally in this browser. No entries yet."
                  : `Stored locally in this browser only — ${failureCount} entr${failureCount === 1 ? "y" : "ies"}.`
                : "Stored locally in this browser only."
            }
          >
            {cleared ? (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#5a8a6a",
                  padding: "0.4rem 0.85rem",
                }}
              >
                Cleared ✓
              </span>
            ) : (
              <button
                onClick={handleClearFailures}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: clearConfirm ? "#c4545a" : "#9ba3b8",
                  background: clearConfirm ? "rgba(196,84,90,0.08)" : "none",
                  border: `1px solid ${clearConfirm ? "#3a1a1a" : "#252a38"}`,
                  borderRadius: "6px",
                  padding: "0.4rem 0.85rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!clearConfirm) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4545a";
                    (e.currentTarget as HTMLButtonElement).style.color = "#c4545a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!clearConfirm) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#252a38";
                    (e.currentTarget as HTMLButtonElement).style.color = "#9ba3b8";
                  }
                }}
              >
                {clearConfirm ? "Confirm clear?" : "Clear archive"}
              </button>
            )}
          </Row>
          {clearConfirm && (
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "12px",
                color: "#5c6478",
                marginTop: "-0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              Click again to confirm. This cannot be undone.{" "}
              <button
                onClick={() => setClearConfirm(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ba3b8",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textDecoration: "underline",
                }}
              >
                Cancel
              </button>
            </p>
          )}
        </div>
      </Section>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <Section title="Danger Zone" danger>
        <Row
          label="Sign out of all sessions"
          note="Ends all active sessions across every device."
        >
          <button
            onClick={handleSignOutAll}
            disabled={signingOut}
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: signingOut ? "#5c6478" : "#c4545a",
              background: "none",
              border: "1px solid #3a1a1a",
              borderRadius: "6px",
              padding: "0.4rem 0.85rem",
              cursor: signingOut ? "not-allowed" : "pointer",
              transition: "border-color 0.15s, background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!signingOut) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4545a";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,84,90,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a1a1a";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            {signingOut ? "Signing out…" : "Sign out everywhere"}
          </button>
        </Row>
      </Section>
    </div>
  );
}
