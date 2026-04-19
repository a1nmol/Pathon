"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTheme } from "@/context/theme";

const PAGE_NAMES: Record<string, string> = {
  "/employer/dashboard": "Command Center",
  "/employer/jobs":      "Job Postings",
  "/employer/jobs/new":  "New Job",
  "/employer/pipeline":  "Candidate Pipeline",
  "/employer/talent":    "Talent Pool",
  "/employer/analytics": "Analytics",
};

export function EmployerTopBar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const name =
    PAGE_NAMES[pathname] ??
    Object.entries(PAGE_NAMES).find(([k]) => pathname.startsWith(k))?.[1] ??
    "Employer";

  return (
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
        paddingLeft: "calc(var(--sidebar-w, 80px) + 1.5rem)",
        borderBottom: "1px solid transparent",
        WebkitBackdropFilter: active ? "blur(20px)" : "blur(10px)",
      }}
    >
      {/* Left: Logo */}
      <Link
        href="/employer/dashboard"
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
        <img
          src="/pathonlogo.png"
          alt="Pathon"
          style={{ width: "20px", height: "20px", borderRadius: "4px", display: "block", flexShrink: 0 }}
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

      {/* Center: Breadcrumb */}
      <div style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",
          color: "var(--text-3)",
          fontWeight: 400,
        }}>
          /
        </span>
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-2)",
          letterSpacing: "-0.01em",
        }}>
          {name}
        </span>
      </div>

      {/* Right: Hiring badge + theme */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "6px",
          background: "rgba(124,133,245,0.1)",
          border: "1px solid rgba(124,133,245,0.2)",
        }}>
          <div style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--indigo)",
            boxShadow: "0 0 6px var(--indigo)",
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: "var(--indigo)",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}>
            Hiring
          </span>
        </div>
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
