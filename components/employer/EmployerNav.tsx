"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { UserProfilePanel, ProfileTrigger } from "@/components/UserProfilePanel";
import { switchRole } from "@/app/actions/profile";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── Icons ─────────────────────────────────────────────────────────────────────


function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="4" height="16" rx="1" />
      <rect x="10" y="7" width="4" height="13" rx="1" />
      <rect x="18" y="2" width="4" height="18" rx="1" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="4" />
      <path d="M2 21c0-4 2.686-7 6-7" />
      <path d="M15 11a4 4 0 100-8" />
      <path d="M22 21c0-4-2.686-7-6-7" />
    </svg>
  );
}


function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4"  />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "dashboard", route: "/employer/dashboard",  label: "Command Center", Icon: IconGrid      },
  { key: "jobs",      route: "/employer/jobs",       label: "Job Postings",   Icon: IconBriefcase },
  { key: "pipeline",  route: "/employer/pipeline",   label: "Pipeline",       Icon: IconPipeline  },
  { key: "talent",    route: "/employer/talent",     label: "Talent Pool",    Icon: IconUsers     },
  { key: "analytics", route: "/employer/analytics",  label: "Analytics",      Icon: IconChart     },
];

const HIDE_ON = ["/", "/onboarding", "/auth/callback"];

// ── NavItem with tooltip portal ───────────────────────────────────────────────

function NavItem({
  route,
  label,
  Icon,
  active,
}: {
  route: string;
  label: string;
  Icon: () => React.ReactElement;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function handleEnter() {
    if (itemRef.current) {
      const r = itemRef.current.getBoundingClientRect();
      setTooltipStyle({ top: r.top + r.height / 2, left: r.right + 10 });
    }
    setHovered(true);
  }

  return (
    <div ref={itemRef} style={{ position: "relative" }} onMouseEnter={handleEnter} onMouseLeave={() => setHovered(false)}>
      <Link href={route as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none", display: "block" }}>
        <div
          style={{
            position: "relative",
            width: "48px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            cursor: "pointer",
            background: active ? "rgba(124,133,245,0.12)" : hovered ? "var(--surface-2)" : "transparent",
            transition: "background 0.18s ease",
            color: active ? "var(--indigo)" : hovered ? "var(--text-2)" : "var(--text-3)",
          }}
        >
          {active && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "25%",
                bottom: "25%",
                width: "2px",
                background: "var(--indigo)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          )}
          <Icon />
        </div>
      </Link>

      {mounted && createPortal(
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: tooltipStyle.top,
                left: tooltipStyle.left,
                transform: "translateY(-50%)",
                zIndex: 9999,
                pointerEvents: "none",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                padding: "0.3rem 0.75rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 500, color: "var(--text-1)" }}>
                {label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function Sep() {
  return <div style={{ width: "28px", height: "1px", background: "var(--border)", margin: "8px auto", opacity: 0.6 }} />;
}

function IconSwitch() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12M4 6l3-3M4 6l3 3" />
      <path d="M16 14H4M16 14l-3-3M16 14l-3 3" />
    </svg>
  );
}

function SwitchRoleButton() {
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function handleEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTooltipStyle({ top: r.top + r.height / 2, left: r.right + 10 });
    }
    setHovered(true);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => switchRole("applicant")}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        title="Switch to Job Seeker"
        style={{
          width: "48px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          border: "1px solid",
          borderColor: hovered ? "rgba(184,140,80,0.4)" : "var(--border)",
          background: hovered ? "rgba(184,140,80,0.08)" : "transparent",
          color: hovered ? "var(--copper)" : "var(--text-4)",
          cursor: "pointer",
          transition: "all 0.18s ease",
          flexShrink: 0,
        }}
      >
        <IconSwitch />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: tooltipStyle.top,
                left: tooltipStyle.left,
                transform: "translateY(-50%)",
                zIndex: 9999,
                pointerEvents: "none",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                padding: "0.3rem 0.75rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 500, color: "var(--copper)", letterSpacing: "-0.01em" }}>
                Switch to Job Seeker
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Main nav ──────────────────────────────────────────────────────────────────

export function EmployerNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const reveal = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setVisible(true);
  }, []);

  const conceal = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 160);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
        setVisible((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  if (HIDE_ON.some((p) => pathname === p)) return null;

  return (
    <>
      {/* Activation zone */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "14px", zIndex: 195, background: "transparent" }}
        onMouseEnter={reveal}
        onMouseLeave={conceal}
      />

      {/* Rail */}
      <nav
        onMouseEnter={reveal}
        onMouseLeave={conceal}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "80px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "var(--surface)",
          boxShadow: visible ? "8px 0 40px rgba(0,0,0,0.22)" : "none",
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          transition: visible
            ? "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms ease"
            : "transform 240ms cubic-bezier(0.55, 0, 0.45, 1), box-shadow 240ms ease",
          overflow: "visible",
        }}
      >
        {/* Logo with indigo glow for employer side */}
        <Link href="/employer/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div
            style={{
              width: "80px",
              height: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <img
              src="/pathonlogo.png"
              alt="Pathon"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "block",
                flexShrink: 0,
              }}
            />
          </div>
        </Link>

        {/* Icons */}
        <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px", overflowY: "auto", overflowX: "visible", gap: 0 }}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              route={item.route}
              label={item.label}
              Icon={item.Icon}
              active={pathname === item.route || pathname.startsWith(item.route + "/")}
            />
          ))}
        </div>

        {/* Bottom: switch role + settings + profile */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px 20px", borderTop: "1px solid var(--border)", flexShrink: 0, gap: "8px" }}>
          <SwitchRoleButton />
          <NavItem route="/settings" label="Settings" Icon={IconSettings} active={pathname === "/settings"} />
          <ProfileTrigger
            onClick={() => setProfileOpen(true)}
            accentColor="var(--indigo)"
          />
        </div>
      </nav>

      <UserProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        accentColor="var(--indigo)"
      />

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "64px",
            zIndex: 300,
            display: "flex",
            alignItems: "stretch",
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.route || pathname.startsWith(item.route + "/");
            return (
              <Link
                key={item.key}
                href={item.route as Parameters<typeof Link>[0]["href"]}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3px",
                  textDecoration: "none",
                  color: isActive ? "var(--indigo)" : "var(--text-4)",
                  background: isActive ? "var(--indigo-dim)" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                <item.Icon />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
