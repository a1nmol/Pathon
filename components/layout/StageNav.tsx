"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfilePanel } from "@/components/UserProfilePanel";
import { switchRole, getUserProfile } from "@/app/actions/profile";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── Layout constants ──────────────────────────────────────────────────────────

const W_COLLAPSED = 68;
const W_EXPANDED  = 220;

// ── SVG Icons — 18 × 18 ──────────────────────────────────────────────────────

function IcoDashboard() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>;
}
function IcoIdentity() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"/></svg>;
}
function IcoCredentials() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="12" height="16" rx="1.5"/><line x1="7" y1="7" x2="13" y2="7"/><line x1="7" y1="10" x2="13" y2="10"/><line x1="7" y1="13" x2="11" y2="13"/></svg>;
}
function IcoLinkedIn() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1"/><line x1="2" y1="13" x2="2" y2="18"/><line x1="5" y1="13" x2="5" y2="18"/><line x1="5" y1="15.5" x2="9" y2="15.5"/><path d="M10 13v5M14 13v5M10 15.5c0-1.5 4-1.5 4 0"/></svg>;
}
function IcoMentor() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h14a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"/></svg>;
}
function IcoInterview() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3.314 2.686-6 6-6"/><circle cx="14.5" cy="13.5" r="4"/><path d="M14.5 11.5v2.5l1.5 1"/></svg>;
}
function IcoATS() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="1.5"/><path d="M6 7l2.5 2.5L13 5"/><line x1="6" y1="12" x2="14" y2="12"/><line x1="6" y1="15" x2="11" y2="15"/></svg>;
}
function IcoGap() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 2.5v7.5l4 2"/></svg>;
}
function IcoSalary() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v1.5M10 12.5V14"/><path d="M7.5 8.5a2.5 1.5 0 015 0c0 1-1 1.5-2.5 2s-2.5 1-2.5 2a2.5 1.5 0 005 0"/></svg>;
}
function IcoTracker() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="4" height="13" rx="1"/><rect x="8" y="7" width="4" height="10" rx="1"/><rect x="14" y="2" width="4" height="15" rx="1"/></svg>;
}
function IcoCoverLetter() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M12 2v4h4"/><line x1="7" y1="10" x2="13" y2="10"/><line x1="7" y1="13" x2="11" y2="13"/></svg>;
}
function IcoNetwork() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="3" cy="5" r="1.5"/><circle cx="17" cy="5" r="1.5"/><circle cx="3" cy="15" r="1.5"/><circle cx="17" cy="15" r="1.5"/><line x1="10" y1="10" x2="3" y2="5"/><line x1="10" y1="10" x2="17" y2="5"/><line x1="10" y1="10" x2="3" y2="15"/><line x1="10" y1="10" x2="17" y2="15"/></svg>;
}
function IcoSettings() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="10" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="15" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function IcoSwitch() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M4 6l3-3M4 6l3 3"/><path d="M16 14H4M16 14l-3-3M16 14l-3 3"/></svg>;
}
// Mobile icons
function MIcoDash()  { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>; }
function MIcoId()   { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7"/></svg>; }
function MIcoCred() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="12" height="16" rx="1.5"/><line x1="7" y1="7" x2="13" y2="7"/><line x1="7" y1="10" x2="13" y2="10"/><line x1="7" y1="13" x2="11" y2="13"/></svg>; }
function MIcoTrack(){ return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="4" height="13" rx="1"/><rect x="8" y="7" width="4" height="10" rx="1"/><rect x="14" y="2" width="4" height="15" rx="1"/></svg>; }
function MIcoATS()  { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="1.5"/><path d="M6 7l2.5 2.5L13 5"/><line x1="6" y1="12" x2="14" y2="12"/><line x1="6" y1="15" x2="11" y2="15"/></svg>; }

// ── Nav data ──────────────────────────────────────────────────────────────────

const GROUP_CORE = [
  { key: "dashboard",   route: "/dashboard",   label: "Dashboard",    Icon: IcoDashboard   },
  { key: "identity",    route: "/identity",    label: "Profile",      Icon: IcoIdentity    },
  { key: "credentials", route: "/credentials", label: "Resume",       Icon: IcoCredentials },
  { key: "linkedin",    route: "/linkedin",    label: "LinkedIn",     Icon: IcoLinkedIn    },
];
const GROUP_AI = [
  { key: "mentor",         route: "/mentor",         label: "AI Mentor",      Icon: IcoMentor    },
  { key: "mock-interview", route: "/mock-interview", label: "Mock Interview", Icon: IcoInterview },
  { key: "ats",            route: "/ats",            label: "ATS Scan",       Icon: IcoATS       },
  { key: "gap-analyzer",   route: "/gap-analyzer",   label: "Gap Analyser",   Icon: IcoGap       },
  { key: "salary",         route: "/salary",         label: "Salary Intel",   Icon: IcoSalary    },
];
const GROUP_APPLY = [
  { key: "tracker",      route: "/tracker",      label: "Job Tracker",  Icon: IcoTracker     },
  { key: "cover-letter", route: "/cover-letter", label: "Cover Letter", Icon: IcoCoverLetter },
  { key: "network",      route: "/network",      label: "Network",      Icon: IcoNetwork     },
];
const MOBILE_TABS = [
  { key: "dashboard",   route: "/dashboard",   label: "Home",    Icon: MIcoDash  },
  { key: "identity",    route: "/identity",    label: "Profile", Icon: MIcoId    },
  { key: "credentials", route: "/credentials", label: "Resume",  Icon: MIcoCred  },
  { key: "tracker",     route: "/tracker",     label: "Tracker", Icon: MIcoTrack },
  { key: "ats",         route: "/ats",         label: "ATS",     Icon: MIcoATS   },
];

const HIDE_ON     = ["/", "/auth/callback", "/onboarding"];
const HIDE_PREFIX = ["/employer", "/demo"];

// ── Transition spec — calm, professional ──────────────────────────────────────

const TR = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

// ── NavRow ────────────────────────────────────────────────────────────────────

function NavRow({
  route,
  label,
  Icon,
  active,
  expanded,
}: {
  route:    string;
  label:    string;
  Icon:     () => React.ReactElement;
  active?:  boolean;
  expanded: boolean;
}) {
  return (
    <Link href={route as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 38,
          padding: "0 12px 0 20px",
          borderRadius: 7,
          margin: "1px 6px",
          background: active ? "rgba(201,168,108,0.07)" : "transparent",
          color: active ? "var(--copper)" : "var(--text-3)",
          cursor: "pointer",
          transition: "background 0.2s ease, color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLDivElement).style.color = "var(--text-2)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
            (e.currentTarget as HTMLDivElement).style.color = "var(--text-3)";
          }
        }}
      >
        {/* Active accent bar */}
        {active && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "20%",
              bottom: "20%",
              width: 2,
              borderRadius: "0 2px 2px 0",
              background: "var(--copper)",
            }}
          />
        )}

        {/* Icon */}
        <span style={{ flexShrink: 0, display: "flex", opacity: active ? 0.9 : 0.55 }}>
          <Icon />
        </span>

        {/* Label */}
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={TR}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, expanded }: { label: string; expanded: boolean }) {
  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: "10px 18px 3px",
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "var(--text-4)",
          }}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Divider({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <div style={{ height: 1, margin: "5px 12px", background: "rgba(255,255,255,0.05)" }} />
  ) : (
    <div style={{ height: 6 }} />
  );
}

// ── StageNav ──────────────────────────────────────────────────────────────────

export function StageNav() {
  const pathname   = usePathname();
  const isMobile   = useIsMobile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [expanded,    setExpanded]    = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    getUserProfile().then((p) => { if (p?.displayName) setDisplayName(p.displayName); }).catch(() => {});
  }, []);

  // Push sidebar width into the CSS variable so all content smoothly shifts
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--sidebar-w",
      expanded ? `${W_EXPANDED}px` : `${W_COLLAPSED}px`,
    );
  }, [expanded]);

  // Inline avatar helpers
  const initials = displayName ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const hue = displayName ? ((displayName.charCodeAt(0) ?? 65) * 17) % 360 : 35;
  const avatarBg = `linear-gradient(135deg, hsl(${hue},55%,45%) 0%, hsl(${(hue + 40) % 360},50%,35%) 100%)`;

  if (HIDE_ON.some((p)     => pathname === p))          return null;
  if (HIDE_PREFIX.some((p) => pathname.startsWith(p))) return null;

  function isActive(route: string) {
    return pathname === route || pathname.startsWith(route + "/");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <motion.nav
          aria-label="Site navigation"
          onHoverStart={() => setExpanded(true)}
          onHoverEnd={() => setExpanded(false)}
          animate={{ width: expanded ? W_EXPANDED : W_COLLAPSED }}
          transition={TR}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <div
              style={{
                height: 56,
                display: "flex",
                alignItems: "center",
                padding: "0 15px",
                gap: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <img
                src="/pathonlogo.png"
                alt="Pathon"
                style={{ width: 28, height: 28, borderRadius: 6, display: "block", flexShrink: 0 }}
              />
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={TR}
                  >
                    <div
                      style={{
                        fontFamily: "'Poppins', system-ui, sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--copper)",
                        lineHeight: 1.1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Pathon
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 8,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--text-4)",
                        marginTop: 1,
                      }}
                    >
                      Career
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>

          {/* Nav */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "6px 0",
            }}
          >
            <SectionLabel label="Overview" expanded={expanded} />
            {GROUP_CORE.map((item) => (
              <NavRow key={item.key} route={item.route} label={item.label} Icon={item.Icon} active={isActive(item.route)} expanded={expanded} />
            ))}

            <Divider expanded={expanded} />
            <SectionLabel label="AI Tools" expanded={expanded} />
            {GROUP_AI.map((item) => (
              <NavRow key={item.key} route={item.route} label={item.label} Icon={item.Icon} active={isActive(item.route)} expanded={expanded} />
            ))}

            <Divider expanded={expanded} />
            <SectionLabel label="Track & Apply" expanded={expanded} />
            {GROUP_APPLY.map((item) => (
              <NavRow key={item.key} route={item.route} label={item.label} Icon={item.Icon} active={isActive(item.route)} expanded={expanded} />
            ))}
          </div>

          {/* Bottom */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "6px 0 10px",
              flexShrink: 0,
            }}
          >
            <NavRow route="/settings" label="Settings" Icon={IcoSettings} active={isActive("/settings")} expanded={expanded} />

            {/* Switch to Hiring */}
            <button
              onClick={() => switchRole("employer")}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 38,
                padding: "0 12px 0 20px",
                margin: "1px 6px",
                borderRadius: 7,
                border: "none",
                background: "transparent",
                color: "var(--text-4)",
                cursor: "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 400,
                width: "calc(100% - 12px)",
                textAlign: "left",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,133,245,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--indigo)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)";
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", opacity: 0.6 }}>
                <IcoSwitch />
              </span>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={TR}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Switch to Hiring
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Profile */}
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "calc(100% - 12px)",
                margin: "4px 6px 0",
                padding: expanded ? "6px 10px" : "6px 0",
                justifyContent: expanded ? "flex-start" : "center",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.2s ease, padding 0.35s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontSize: 11, fontWeight: 700, color: "#fff",
                flexShrink: 0,
                boxShadow: "0 0 0 2px var(--surface), 0 0 0 2.5px rgba(201,168,108,0.4)",
              }}>
                {initials}
              </div>

              {/* Name + role — only when expanded */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={TR}
                    style={{ textAlign: "left", overflow: "hidden" }}
                  >
                    <div style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 12, fontWeight: 500,
                      color: "var(--text-2)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 130,
                    }}>
                      {displayName || "Account"}
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 8, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--copper)",
                      opacity: 0.7,
                      marginTop: 1,
                    }}>
                      Career
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
      )}

      <UserProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        accentColor="var(--copper)"
      />

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            zIndex: 300,
            display: "flex",
            alignItems: "stretch",
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {MOBILE_TABS.map((tab) => {
            const active = pathname === tab.route || pathname.startsWith(tab.route + "/");
            return (
              <Link
                key={tab.key}
                href={tab.route as Parameters<typeof Link>[0]["href"]}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  textDecoration: "none",
                  color: active ? "var(--copper)" : "var(--text-4)",
                  background: active ? "var(--copper-dim)" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                <tab.Icon />
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
