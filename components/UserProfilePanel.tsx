"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  getUserProfile,
  updateDisplayName,
  switchRole,
  signOutUser,
  type UserProfile,
} from "@/app/actions/profile";

// ── Avatar ─────────────────────────────────────────────────────────────────────

function avatarGradient(name: string, role: "applicant" | "employer" | null) {
  if (role === "employer")
    return "linear-gradient(135deg, #7c85f5 0%, #5a63d4 100%)";
  const hue = ((name.charCodeAt(0) ?? 65) * 17) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,45%) 0%, hsl(${(hue + 40) % 360},50%,35%) 100%)`;
}

function Avatar({ name, size = 56, role }: { name: string; size?: number; role: "applicant" | "employer" | null }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: avatarGradient(name, role),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontSize: size > 40 ? "18px" : "12px", fontWeight: 700, color: "#fff",
        flexShrink: 0,
        boxShadow: role === "employer"
          ? "0 4px 20px rgba(124,133,245,0.35)"
          : "0 4px 20px rgba(0,0,0,0.25)",
        letterSpacing: "-0.02em",
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.9s linear infinite" }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  accentColor?: string; // copper for applicant, indigo for employer
}

export function UserProfilePanel({ open, onClose, accentColor = "var(--copper)" }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Display name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Role switching
  const [switching, setSwitching] = useState(false);

  // Sign out
  const [signingOut, setSigningOut] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Fetch profile when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getUserProfile()
      .then((p) => { setProfile(p); if (p) setNameInput(p.displayName); })
      .finally(() => setLoading(false));
  }, [open]);

  // Focus name input when editing starts
  useEffect(() => {
    if (editingName) setTimeout(() => nameRef.current?.focus(), 50);
  }, [editingName]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSaveName() {
    if (!nameInput.trim() || !profile) return;
    setNameSaving(true);
    try {
      await updateDisplayName(nameInput.trim());
      setProfile((p) => p ? { ...p, displayName: nameInput.trim() } : p);
      setEditingName(false);
    } catch { /* ignore */ } finally {
      setNameSaving(false);
    }
  }

  async function handleSwitch() {
    if (!profile || switching) return;
    const target = profile.userType === "employer" ? "applicant" : "employer";
    setSwitching(true);
    try { await switchRole(target); } catch { setSwitching(false); }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOutUser(); } catch { setSigningOut(false); }
  }

  const targetRole = profile?.userType === "employer" ? "applicant" : "employer";
  const switchLabel = profile?.userType === "employer"
    ? "Switch to Applicant Mode"
    : "Switch to Employer Mode";
  const switchColor = profile?.userType === "employer" ? "var(--copper)" : "var(--indigo)";

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 210,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            style={{
              position: "fixed",
              left: "80px", top: 0, bottom: 0,
              width: "300px", zIndex: 220,
              background: "var(--surface, #0f1014)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
              boxShadow: "8px 0 40px rgba(0,0,0,0.35)",
            }}
          >
            {/* Header bar */}
            <div style={{
              padding: "16px 20px", display: "flex", alignItems: "center",
              justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "10px",
                color: "var(--text-4)", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Profile
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-4)", padding: "4px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)" }}>
                <Spinner />
              </div>
            ) : profile ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* Avatar + identity section */}
                <div style={{
                  padding: "28px 24px 24px",
                  background: `linear-gradient(180deg, ${accentColor === "var(--indigo)" ? "rgba(124,133,245,0.06)" : "rgba(201,168,108,0.05)"} 0%, transparent 100%)`,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                    <Avatar name={profile.displayName} size={56} role={profile.userType} />

                    <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
                      {/* Name row */}
                      {editingName ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            ref={nameRef}
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveName();
                              if (e.key === "Escape") setEditingName(false);
                            }}
                            style={{
                              flex: 1, background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: "8px", padding: "6px 10px",
                              color: "var(--text-1)", fontFamily: "'Inter', system-ui, sans-serif",
                              fontSize: "14px", fontWeight: 600, outline: "none",
                            }}
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={nameSaving}
                            style={{
                              padding: "6px 12px", borderRadius: "8px",
                              background: accentColor === "var(--indigo)" ? "rgba(124,133,245,0.15)" : "rgba(201,168,108,0.15)",
                              border: `1px solid ${accentColor}30`, color: accentColor,
                              fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                              cursor: nameSaving ? "wait" : "pointer",
                            }}
                          >
                            {nameSaving ? <Spinner /> : "Save"}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px",
                            fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {profile.displayName}
                          </div>
                          <button
                            onClick={() => { setEditingName(true); setNameInput(profile.displayName); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--text-4)", padding: "2px", flexShrink: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title="Edit name"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Email */}
                      <div style={{
                        fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                        color: "var(--text-4)", marginTop: "4px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {profile.email}
                      </div>
                    </div>
                  </div>

                  {/* Current role badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "4px 12px", borderRadius: "20px",
                      background: `${accentColor === "var(--indigo)" ? "rgba(124,133,245,0.12)" : "rgba(201,168,108,0.12)"}`,
                      border: `1px solid ${accentColor}25`,
                    }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor }} />
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: "10px",
                        color: accentColor, letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>
                        {profile.userType === "employer" ? "Employer" : "Applicant"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role switching */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                    color: "var(--text-4)", letterSpacing: "0.08em", textTransform: "uppercase",
                    marginBottom: "12px",
                  }}>
                    Switch Mode
                  </div>

                  <motion.button
                    onClick={handleSwitch}
                    disabled={switching}
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: "14px",
                      background: `linear-gradient(135deg, ${switchColor === "var(--copper)" ? "rgba(201,168,108,0.1)" : "rgba(124,133,245,0.1)"} 0%, rgba(0,0,0,0.2) 100%)`,
                      border: `1px solid ${switchColor}30`,
                      color: switchColor, cursor: switching ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: "12px",
                      opacity: switching ? 0.7 : 1,
                      textAlign: "left",
                    }}
                    whileHover={!switching ? { scale: 1.01, borderColor: `${switchColor}50` } : {}}
                    whileTap={!switching ? { scale: 0.99 } : {}}
                  >
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "10px",
                      background: `${switchColor === "var(--copper)" ? "rgba(201,168,108,0.15)" : "rgba(124,133,245,0.15)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {switching ? <Spinner /> : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17 1 21 5 17 9" />
                          <path d="M3 11V9a4 4 0 014-4h14" />
                          <polyline points="7 23 3 19 7 15" />
                          <path d="M21 13v2a4 4 0 01-4 4H3" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
                        fontWeight: 600, marginBottom: "2px",
                      }}>
                        {switching ? "Switching…" : switchLabel}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px",
                        color: "var(--text-4)",
                      }}>
                        {targetRole === "employer"
                          ? "Post jobs, screen candidates, hire"
                          : "Apply to jobs, track progress"}
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Account section */}
                <div style={{ padding: "20px 24px", marginTop: "auto" }}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                    color: "var(--text-4)", letterSpacing: "0.08em", textTransform: "uppercase",
                    marginBottom: "12px",
                  }}>
                    Account
                  </div>

                  <motion.button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "12px",
                      background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                      color: "#ef4444", cursor: signingOut ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: "10px",
                      opacity: signingOut ? 0.7 : 1,
                    }}
                    whileHover={!signingOut ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)" } : {}}
                    whileTap={!signingOut ? { scale: 0.98 } : {}}
                  >
                    {signingOut ? <Spinner /> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    )}
                    <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 500 }}>
                      {signingOut ? "Signing out…" : "Sign Out"}
                    </span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)" }}>
                  Unable to load profile
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Profile trigger button (avatar circle for nav bottom) ─────────────────────

export function ProfileTrigger({
  onClick,
  displayName,
  userType,
  accentColor,
}: {
  onClick: () => void;
  displayName?: string;
  userType?: "applicant" | "employer" | null;
  accentColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const name = displayName || "U";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const grad = avatarGradient(name, userType ?? null);
  const accent = accentColor ?? "var(--copper)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "36px", height: "36px", borderRadius: "50%", border: "none",
        background: grad, cursor: "pointer", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "12px",
        fontWeight: 700, color: "#fff", letterSpacing: "-0.01em",
        boxShadow: hovered
          ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${accent}`
          : `0 0 0 2px var(--surface), 0 0 0 2px transparent`,
        transition: "box-shadow 0.18s ease",
        outline: "none",
      }}
      title="Profile & settings"
    >
      {initials}
    </button>
  );
}
