"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTheme } from "@/context/theme";

// Page names for breadcrumb
const PAGE_NAMES: Record<string, string> = {
  "/dashboard":      "Dashboard",
  "/identity":       "Career Identity",
  "/credentials":    "Credentials",
  "/paths":          "Career Paths",
  "/mentor":         "Mentor",
  "/mentor/debate":  "Debate",
  "/proof":          "Proof Capsules",
  "/proof/new":      "New Capsule",
  "/interview":      "Interview Prep",
  "/skills":         "Skill Constellation",
  "/check-in":       "Weekly Check-in",
  "/story":          "Career Story",
  "/offer":          "Offer Evaluator",
  "/failures":       "Failure Archive",
  "/linkedin":       "LinkedIn Import",
  "/linkedin/posts": "Post Archive",
  "/tracker":        "Application Tracker",
  "/ats":            "ATS Scanner",
  "/cover-letter":   "Cover Letter",
  "/mock-interview": "Mock Interview",
  "/gap-analyzer":   "Gap Analyzer",
  "/salary":         "Salary & Negotiation",
  "/network":        "Network Map",
  "/settings":       "Settings",
};

const HIDE_ON = ["/", "/auth/callback", "/onboarding"];
const HIDE_PREFIX = ["/employer", "/demo"];

// Mobile nav sections
const MOBILE_NAV_SECTIONS = [
  {
    label: "Profile",
    links: [
      { href: "/identity",    label: "Career Profile" },
      { href: "/credentials", label: "Resume & Projects" },
      { href: "/linkedin",    label: "LinkedIn Import" },
      { href: "/mentor",      label: "AI Mentor" },
    ],
  },
  {
    label: "Job Search Tools",
    links: [
      { href: "/tracker",        label: "Application Tracker" },
      { href: "/ats",            label: "ATS Scanner" },
      { href: "/cover-letter",   label: "Cover Letter" },
      { href: "/mock-interview", label: "Mock Interview" },
      { href: "/gap-analyzer",   label: "Gap Analyzer" },
      { href: "/salary",         label: "Salary & Negotiation" },
      { href: "/network",        label: "Network Map" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/settings",  label: "Settings" },
    ],
  },
];

export function TopNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLight = theme === "light";
  const active = scrolled || hovered;
  const navBg     = isLight ? "rgba(244,243,239,0.96)" : "rgba(13,14,18,0.95)";
  const navBgRest = isLight ? "rgba(244,243,239,0.6)"  : "rgba(13,14,18,0.6)";
  const navBorder = isLight ? "rgba(213,211,222,0.8)"  : "rgba(37,42,56,0.8)";

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (HIDE_ON.some((p) => pathname === p)) return null;
  if (HIDE_PREFIX.some((p) => pathname.startsWith(p))) return null;

  // Find current page name
  const pageName = PAGE_NAMES[pathname]
    ?? (pathname.startsWith("/proof/") ? "Proof Capsule" : "Pathon");

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: active ? navBg : navBgRest,
          backdropFilter: active ? "blur(20px)" : "blur(10px)",
          borderBottomColor: active ? navBorder : "transparent",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "56px",
          zIndex: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          paddingLeft: "calc(var(--sidebar-w, 68px) + 1.5rem)",
          borderBottom: "1px solid transparent",
          WebkitBackdropFilter: active ? "blur(20px)" : "blur(10px)",
        }}
      >
        {/* Hamburger — mobile only, far left */}
        <div
          className="mobile-only"
          style={{ alignItems: "center", marginRight: "0.75rem" }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <line x1="0" y1="1"  x2="18" y2="1"  stroke="#9ba3b8" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="7"  x2="18" y2="7"  stroke="#9ba3b8" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="13" x2="18" y2="13" stroke="#9ba3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Left: Logo */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            opacity: 0.7,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7"; }}
        >
          {/* Logo mark */}
          <img
            src="/pathonlogo.png"
            alt="Pathon"
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              display: "block",
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
          }}>
            Pathon
          </span>
        </Link>

        {/* Center: Breadcrumb — desktop only */}
        <div
          className="desktop-only"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
            color: "var(--text-3)",
            fontWeight: 400,
          }}>
            /
          </span>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-2)",
            letterSpacing: "-0.01em",
          }}>
            {pageName}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Command palette hint */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.3rem 0.6rem",
              cursor: "pointer",
              color: "var(--text-3)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              transition: "border-color 0.15s, color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-2)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
            onClick={() => {
              // Dispatch a custom event to open the command palette
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
            }}
            aria-label="Open command palette"
          >
            <span style={{ fontSize: "10px" }}>⌘</span>
            <span>K</span>
          </button>

          {/* User indicator dot — links to /settings */}
          <Link
            href="/settings"
            style={{ textDecoration: "none", display: "flex" }}
          >
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--copper)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
            >
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--copper)",
                opacity: 0.6,
              }} />
            </div>
          </Link>
        </div>
      </motion.header>

      {/* Mobile nav overlay + drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(13, 14, 18, 0.85)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 298,
              }}
            />

            {/* Drawer */}
            <motion.nav
              key="mobile-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mobile-drawer"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "280px",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                zIndex: 299,
                padding: "1.5rem",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.75rem",
              }}>
                {/* Logo in drawer */}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                  }}
                >
                  <img
                    src="/pathonlogo.png"
                    alt="Pathon"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--text-1)",
                  }}>
                    Pathon
                  </span>
                </Link>

                {/* Close (X) button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-3)",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Nav sections */}
              {MOBILE_NAV_SECTIONS.map((section) => (
                <div key={section.label} style={{ marginBottom: "1.5rem" }}>
                  {/* Section label */}
                  <p style={{
                    fontFamily: "'DM Mono', 'Courier New', monospace",
                    fontSize: "10px",
                    fontWeight: 400,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-4)",
                    margin: "0 0 0.5rem 0.5rem",
                  }}>
                    {section.label}
                  </p>

                  {/* Links */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    {section.links.map((link) => {
                      const isActive =
                        pathname === link.href ||
                        (link.href !== "/" && pathname.startsWith(link.href + "/"));
                      return (
                        <Link
                          key={link.href}
                          href={link.href as Parameters<typeof Link>[0]["href"]}
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontSize: "13px",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "var(--text-1)" : "var(--text-2)",
                            background: isActive ? "var(--surface-2)" : "transparent",
                            transition: "background 0.15s, color 0.15s",
                            borderLeft: isActive ? "2px solid var(--copper)" : "2px solid transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)";
                              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-1)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)";
                            }
                          }}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
