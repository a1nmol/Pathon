"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfilePanel, ProfileTrigger } from "@/components/UserProfilePanel";
import { switchRole } from "@/app/actions/profile";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── SVG Icons — 20×20, stroke-based, consistent weight ───────────────────────

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconIdentity() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    </svg>
  );
}
function IconCredentials() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="12" height="16" rx="1.5" />
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="13" x2="11" y2="13" />
    </svg>
  );
}
function IconPaths() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="3.5" r="1.5" />
      <circle cx="4" cy="16.5" r="1.5" />
      <circle cx="16" cy="16.5" r="1.5" />
      <line x1="10" y1="5" x2="10" y2="9.5" />
      <line x1="10" y1="9.5" x2="4" y2="15" />
      <line x1="10" y1="9.5" x2="16" y2="15" />
    </svg>
  );
}
function IconMentor() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h14a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" />
    </svg>
  );
}
function IconReflection() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14" />
      <path d="M13.5 4.5a7 7 0 010 11" />
    </svg>
  );
}
function IconSkills() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="4"  cy="4"  r="1.5" fill="currentColor" />
      <circle cx="16" cy="4"  r="1.5" fill="currentColor" />
      <circle cx="4"  cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <line x1="10" y1="10" x2="4"  y2="4"  />
      <line x1="10" y1="10" x2="16" y2="4"  />
      <line x1="10" y1="10" x2="4"  y2="16" />
      <line x1="10" y1="10" x2="16" y2="16" />
    </svg>
  );
}
function IconInterview() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="6" height="9" rx="3" />
      <path d="M4 9a6 6 0 0012 0" />
      <line x1="10" y1="15" x2="10" y2="18" />
      <line x1="7"  y1="18" x2="13" y2="18" />
    </svg>
  );
}
function IconCheckIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <line x1="3"  y1="8"  x2="17" y2="8" />
      <line x1="7"  y1="2"  x2="7"  y2="6" />
      <line x1="13" y1="2"  x2="13" y2="6" />
      <path d="M7 12l2 2 4-4" />
    </svg>
  );
}
function IconStory() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h6a3 3 0 013 3v11a3 3 0 00-3-3H3V3z" />
      <path d="M17 3h-6a3 3 0 00-3 3v11a3 3 0 013-3h6V3z" />
    </svg>
  );
}
function IconOffer() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M12 2v4h4" />
      <path d="M10 8.5l.7 1.4 1.6.25-1.15 1.1.27 1.55-1.42-.74-1.42.74.27-1.55-1.15-1.1 1.6-.25z" />
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <line x1="2" y1="13" x2="2" y2="18" />
      <line x1="5" y1="13" x2="5" y2="18" />
      <line x1="5" y1="15.5" x2="9" y2="15.5" />
      <path d="M10 13v5M14 13v5M10 15.5c0-1.5 4-1.5 4 0" />
    </svg>
  );
}
function IconFailures() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,15 7,10 10,13 14,7 17,5" />
      <polyline points="14,5 17,5 17,8" />
    </svg>
  );
}
function IconTracker() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="4" height="13" rx="1" />
      <rect x="8" y="7" width="4" height="10" rx="1" />
      <rect x="14" y="2" width="4" height="15" rx="1" />
    </svg>
  );
}
function IconATS() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="1.5" />
      <path d="M6 7l2.5 2.5L13 5" />
      <line x1="6" y1="12" x2="14" y2="12" />
      <line x1="6" y1="15" x2="11" y2="15" />
    </svg>
  );
}
function IconMockInterview() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3.314 2.686-6 6-6" />
      <circle cx="14.5" cy="13.5" r="4" />
      <path d="M14.5 11.5v2.5l1.5 1" />
    </svg>
  );
}
function IconGap() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 2.5v7.5l4 2" />
    </svg>
  );
}
function IconSalary() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v1.5M10 12.5V14" />
      <path d="M7.5 8.5a2.5 1.5 0 015 0c0 1-1 1.5-2.5 2s-2.5 1-2.5 2a2.5 1.5 0 005 0" />
    </svg>
  );
}
function IconNetwork() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <circle cx="3"  cy="5"  r="1.5" />
      <circle cx="17" cy="5"  r="1.5" />
      <circle cx="3"  cy="15" r="1.5" />
      <circle cx="17" cy="15" r="1.5" />
      <line x1="10" y1="10" x2="3"  y2="5"  />
      <line x1="10" y1="10" x2="17" y2="5"  />
      <line x1="10" y1="10" x2="3"  y2="15" />
      <line x1="10" y1="10" x2="17" y2="15" />
    </svg>
  );
}
function IconCompany() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="16" height="10" rx="1" />
      <path d="M6 8V5a4 4 0 018 0v3" />
      <line x1="10" y1="12" x2="10" y2="14" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="3"  y1="5"  x2="17" y2="5"  />
      <line x1="3"  y1="10" x2="17" y2="10" />
      <line x1="3"  y1="15" x2="17" y2="15" />
      <circle cx="7"  cy="5"  r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13" cy="10" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9"  cy="15" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4.5L4 7.5L10 1" />
    </svg>
  );
}

function IconSwitch() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12M4 6l3-3M4 6l3 3" />
      <path d="M16 14H4M16 14l-3-3M16 14l-3 3" />
    </svg>
  );
}

// ── SwitchRoleButton ───────────────────────────────────────────────────────────

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
        onClick={() => switchRole("employer")}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        title="Switch to Hiring"
        style={{
          width: "48px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          border: "1px solid",
          borderColor: hovered ? "rgba(124,133,245,0.4)" : "var(--border)",
          background: hovered ? "rgba(124,133,245,0.08)" : "transparent",
          color: hovered ? "var(--indigo)" : "var(--text-4)",
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
              transition={{ duration: 0.15, ease: "easeOut" }}
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
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 500, color: "var(--indigo)", letterSpacing: "-0.01em" }}>
                Switch to Hiring
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Nav data ──────────────────────────────────────────────────────────────────

const STAGES = [
  { key: "identity",    route: "/identity",    label: "Profile",   num: "01", Icon: IconIdentity    },
  { key: "credentials", route: "/credentials", label: "Resume",    num: "02", Icon: IconCredentials },
  { key: "mentor",      route: "/mentor",      label: "Mentor",    num: "03", Icon: IconMentor      },
];

const TOOLS = [
  { key: "linkedin",       route: "/linkedin",       label: "LinkedIn",       Icon: IconLinkedIn      },
  { key: "tracker",        route: "/tracker",        label: "Tracker",        Icon: IconTracker       },
  { key: "ats",            route: "/ats",            label: "ATS Scan",       Icon: IconATS           },
  { key: "cover-letter",   route: "/cover-letter",   label: "Cover Letter",   Icon: IconStory         },
  { key: "mock-interview", route: "/mock-interview", label: "Mock Interview", Icon: IconMockInterview },
  { key: "gap-analyzer",   route: "/gap-analyzer",   label: "Gap Analyzer",   Icon: IconGap           },
  { key: "salary",         route: "/salary",         label: "Salary",         Icon: IconSalary        },
  { key: "network",        route: "/network",        label: "Network",        Icon: IconNetwork       },
];

const HIDE_ON = ["/", "/auth/callback", "/onboarding"];
const HIDE_PREFIX = ["/employer"];

// ── NavItem — icon button with portal-rendered label tooltip ─────────────────
// Tooltip is portalled to document.body so it escapes all stacking contexts
// (Framer Motion transforms on page elements would otherwise clip/hide it)

function NavItem({
  route,
  label,
  Icon,
  active,
  done,
  dim,
}: {
  route: string;
  label: string;
  Icon: () => React.ReactElement;
  active?: boolean;
  done?: boolean;
  dim?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const itemRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const iconColor = active
    ? "var(--copper)"
    : done
    ? "var(--green)"
    : dim
    ? "var(--text-4)"
    : hovered
    ? "var(--text-2)"
    : "var(--text-3)";

  function handleEnter() {
    if (itemRef.current) {
      const r = itemRef.current.getBoundingClientRect();
      setTooltipStyle({
        top: r.top + r.height / 2,
        left: r.right + 10,
      });
    }
    setHovered(true);
  }

  return (
    <div
      ref={itemRef}
      style={{ position: "relative" }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
    >
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
            background: active
              ? "var(--copper-dim)"
              : hovered && !dim
              ? "var(--surface-2)"
              : "transparent",
            transition: "background 0.18s ease",
            color: iconColor,
          }}
        >
          {/* Active indicator — left edge accent line */}
          {active && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "25%",
                bottom: "25%",
                width: "2px",
                background: "var(--copper)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          )}
          {/* Done indicator — small green dot */}
          {done && !active && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--green)",
                opacity: 0.7,
              }}
            />
          )}
          {done ? <IconCheck /> : <Icon />}
        </div>
      </Link>

      {/* Tooltip — portalled to document.body to escape all stacking contexts */}
      {mounted && createPortal(
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-1)",
                  letterSpacing: "-0.01em",
                }}
              >
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

// ── Thin separator ────────────────────────────────────────────────────────────

function Sep() {
  return (
    <div
      style={{
        width: "28px",
        height: "1px",
        background: "var(--border)",
        margin: "8px auto",
        opacity: 0.6,
      }}
    />
  );
}

// ── StageNav ──────────────────────────────────────────────────────────────────

// ── Mobile bottom tab items ────────────────────────────────────────────────────
const MOBILE_TABS = [
  { key: "dashboard",  route: "/dashboard",    label: "Home",     Icon: IconDashboard  },
  { key: "identity",   route: "/identity",     label: "Profile",  Icon: IconIdentity   },
  { key: "credentials",route: "/credentials",  label: "Resume",   Icon: IconCredentials},
  { key: "tracker",    route: "/tracker",      label: "Tracker",  Icon: IconTracker    },
  { key: "ats",        route: "/ats",          label: "ATS",      Icon: IconATS        },
];

export function StageNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const reveal = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setVisible(true);
  }, []);

  const conceal = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 160);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + .
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
          hideTimer.current = null;
        }
        setVisible((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  if (HIDE_ON.some((p) => pathname === p)) return null;
  if (HIDE_PREFIX.some((p) => pathname.startsWith(p))) return null;

  const currentStageIdx = STAGES.findIndex(
    (s) => pathname === s.route || pathname.startsWith(s.route + "/"),
  );

  const getStatus = (idx: number): "done" | "active" | "locked" => {
    if (idx < currentStageIdx) return "done";
    if (idx === currentStageIdx) return "active";
    return "locked";
  };

  // Shadow adapts to theme via CSS custom property
  const railShadow = "8px 0 40px rgba(0,0,0,0.22), 2px 0 8px rgba(0,0,0,0.08)";

  return (
    <>
      {/* ── Invisible edge activation zone (14px, always present) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "14px",
          zIndex: 195,
          background: "transparent",
        }}
        onMouseEnter={reveal}
        onMouseLeave={conceal}
      />

      {/* ── Nav rail ── */}
      <nav
        aria-label="Site navigation"
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
          boxShadow: visible ? railShadow : "none",
          // Slide in/out — no spring, controlled ease
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          transition: visible
            ? "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms ease"
            : "transform 240ms cubic-bezier(0.55, 0, 0.45, 1), box-shadow 240ms ease",
          // Allow tooltips to escape the 80px boundary
          overflow: "visible",
          // prefers-reduced-motion handled by CSS
        }}
      >
        {/* Logo — clickable to navigate to dashboard */}
        <Link
          href="/dashboard"
          aria-label="Pathon — go to dashboard"
          style={{ textDecoration: "none", flexShrink: 0 }}
        >
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

        {/* Scrollable icon area */}
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 16px",
            overflowY: "auto",
            overflowX: "visible",
            gap: 0,
          }}
        >
          {/* Dashboard */}
          <NavItem
            route="/dashboard"
            label="Dashboard"
            Icon={IconDashboard}
            active={pathname === "/dashboard"}
          />

          <Sep />

          {/* Journey stages */}
          {STAGES.map((stage, idx) => {
            const status = getStatus(idx);
            return (
              <NavItem
                key={stage.key}
                route={stage.route}
                label={stage.label}
                Icon={stage.Icon}
                active={status === "active"}
                done={status === "done"}
                dim={status === "locked" && currentStageIdx > -1}
              />
            );
          })}

          <Sep />

          {/* Tools */}
          {TOOLS.map((tool) => {
            const isActive =
              pathname === tool.route || pathname.startsWith(tool.route + "/");
            return (
              <NavItem
                key={tool.key}
                route={tool.route}
                label={tool.label}
                Icon={tool.Icon}
                active={isActive}
              />
            );
          })}
        </div>

        {/* Profile trigger — pinned at bottom */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 16px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
            gap: "8px",
          }}
        >
          <SwitchRoleButton />
          <NavItem
            route="/settings"
            label="Settings"
            Icon={IconSettings}
            active={pathname === "/settings"}
          />
          <ProfileTrigger
            onClick={() => setProfileOpen(true)}
            accentColor="var(--copper)"
          />
        </div>
      </nav>

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
          {MOBILE_TABS.map((tab) => {
            const isActive = pathname === tab.route || pathname.startsWith(tab.route + "/");
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
                  gap: "3px",
                  textDecoration: "none",
                  color: isActive ? "var(--copper)" : "var(--text-4)",
                  background: isActive ? "var(--copper-dim)" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                <tab.Icon />
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
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
