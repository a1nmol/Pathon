"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfilePanel } from "@/components/UserProfilePanel";
import { switchRole, getUserProfile } from "@/app/actions/profile";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── Layout constants ──────────────────────────────────────────────────────────

const W_COLLAPSED = 68;
const W_EXPANDED  = 224;

// ── Transition spec — calm, professional ─────────────────────────────────────

const TR = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

// ── SVG Icons — 18 × 18 ──────────────────────────────────────────────────────

function IconGrid() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
function IconBriefcase() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
}
function IconPipeline() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="4" height="16" rx="1" /><rect x="10" y="7" width="4" height="13" rx="1" /><rect x="18" y="2" width="4" height="18" rx="1" /></svg>;
}
function IconUsers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="4" /><path d="M2 21c0-4 2.686-7 6-7" /><path d="M15 11a4 4 0 100-8" /><path d="M22 21c0-4-2.686-7-6-7" /></svg>;
}
function IconChart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>;
}
function IconSettings() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/><circle cx="7" cy="5" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="10" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="15" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function IconSwitch() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12M4 6l3-3M4 6l3 3" /><path d="M16 14H4M16 14l-3-3M16 14l-3 3" /></svg>;
}
// Mobile icons
function MIcoDash()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function MIcoJobs()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>; }
function MIcoPipe()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="4" height="16" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="18" y="2" width="4" height="18" rx="1"/></svg>; }
function MIcoTalent()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="7" r="4"/><path d="M2 21c0-4 2.686-7 6-7"/><path d="M15 11a4 4 0 100-8"/><path d="M22 21c0-4-2.686-7-6-7"/></svg>; }
function MIcoChart()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }

// ── Nav groups ────────────────────────────────────────────────────────────────

const GROUP_HIRING = [
  { key: "dashboard", route: "/employer/dashboard", label: "Dashboard",    Icon: IconGrid      },
  { key: "jobs",      route: "/employer/jobs",      label: "Job Postings", Icon: IconBriefcase },
  { key: "pipeline",  route: "/employer/pipeline",  label: "Pipeline",     Icon: IconPipeline  },
  { key: "talent",    route: "/employer/talent",    label: "Talent Pool",  Icon: IconUsers     },
  { key: "analytics", route: "/employer/analytics", label: "Analytics",    Icon: IconChart     },
];

const MOBILE_TABS = [
  { key: "dashboard", route: "/employer/dashboard", label: "Home",     Icon: MIcoDash   },
  { key: "jobs",      route: "/employer/jobs",      label: "Jobs",     Icon: MIcoJobs   },
  { key: "pipeline",  route: "/employer/pipeline",  label: "Pipeline", Icon: MIcoPipe   },
  { key: "talent",    route: "/employer/talent",    label: "Talent",   Icon: MIcoTalent },
  { key: "analytics", route: "/employer/analytics", label: "Stats",    Icon: MIcoChart  },
];

const HIDE_ON = ["/", "/onboarding", "/auth/callback"];

// ── NavRow ────────────────────────────────────────────────────────────────────

function NavRow({
  route,
  label,
  Icon,
  active,
  expanded,
  badge,
}: {
  route:    string;
  label:    string;
  Icon:     () => React.ReactElement;
  active?:  boolean;
  expanded: boolean;
  badge?:   string;
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
          background: active ? "rgba(124,133,245,0.08)" : "transparent",
          color: active ? "var(--indigo)" : "var(--text-3)",
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
              background: "var(--indigo)",
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
                flex: 1,
                overflow: "hidden",
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {expanded && badge && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "5px",
            background: "rgba(124,133,245,0.12)",
            color: "var(--indigo)",
            flexShrink: 0,
          }}>
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

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

// ── Main nav ──────────────────────────────────────────────────────────────────

export function EmployerNav() {
  const pathname    = usePathname();
  const isMobile    = useIsMobile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [expanded,    setExpanded]    = useState(false);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    getUserProfile().then((p) => { if (p?.displayName) setDisplayName(p.displayName); }).catch(() => {});
  }, []);

  // Push sidebar width into CSS var so employer layout shifts smoothly
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--sidebar-w",
      expanded ? `${W_EXPANDED}px` : `${W_COLLAPSED}px`,
    );
  }, [expanded]);

  // Inline avatar helpers (mirrors UserProfilePanel logic)
  const initials = displayName ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  const avatarBg = "linear-gradient(135deg, #7c85f5 0%, #5a63d4 100%)";

  if (HIDE_ON.some((p) => pathname === p)) return null;

  function isActive(route: string) {
    return pathname === route || pathname.startsWith(route + "/");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <motion.nav
          aria-label="Employer navigation"
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
          <Link href="/employer/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              padding: "0 15px",
              gap: 10,
              borderBottom: "1px solid var(--border)",
            }}>
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
                    <div style={{
                      fontFamily: "'Poppins', system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--indigo)",
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                    }}>
                      Pathon
                    </div>
                    <div style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 8,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-4)",
                      marginTop: 1,
                    }}>
                      Hiring
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>

          {/* Nav */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
            <SectionLabel label="Hiring" expanded={expanded} />
            {GROUP_HIRING.map((item) => (
              <NavRow
                key={item.key}
                route={item.route}
                label={item.label}
                Icon={item.Icon}
                active={isActive(item.route)}
                expanded={expanded}
              />
            ))}
          </div>

          {/* Bottom */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "6px 0 10px", flexShrink: 0 }}>
            <NavRow route="/settings" label="Settings" Icon={IconSettings} active={isActive("/settings")} expanded={expanded} />

            {/* Switch to Job Seeker */}
            <button
              onClick={() => switchRole("applicant")}
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
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,108,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--copper)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-4)";
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", opacity: 0.6 }}>
                <IconSwitch />
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
                    Switch to Job Seeker
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
                boxShadow: "0 0 0 2px var(--surface), 0 0 0 2.5px rgba(124,133,245,0.4)",
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
                      color: "var(--indigo)",
                      opacity: 0.7,
                      marginTop: 1,
                    }}>
                      Hiring
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
      )}

      <UserProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} accentColor="var(--indigo)" />

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
          zIndex: 300, display: "flex", alignItems: "stretch",
          background: "var(--surface)", borderTop: "1px solid var(--border)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        }}>
          {MOBILE_TABS.map((tab) => {
            const active = isActive(tab.route);
            return (
              <Link
                key={tab.key}
                href={tab.route as Parameters<typeof Link>[0]["href"]}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 3,
                  textDecoration: "none",
                  color: active ? "var(--indigo)" : "var(--text-4)",
                  background: active ? "rgba(124,133,245,0.07)" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                <tab.Icon />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
