"use client";

import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Career Identity", href: "/identity" },
    { label: "AI Mentor", href: "/mentor" },
    { label: "Proof Capsules", href: "/proof" },
  ],
  Resources: [
    { label: "FAQ", href: "#faq" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Company: [
    { label: "About Pathon", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: "#080c14",
        borderTop: "1px solid #1e2535",
        padding: "5rem max(3rem, 6vw) 2.5rem",
      }}
    >
      {/* Top: wordmark + tagline */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "2rem",
          marginBottom: "4rem",
          paddingBottom: "3rem",
          borderBottom: "1px solid #1e2535",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#c4a882",
              margin: "0 0 0.5rem",
            }}
          >
            PATHON
          </p>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.82rem",
              color: "#4a5568",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "260px",
            }}
          >
            A system that reasons about your career, not just your résumé.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <a
            href="#"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.75rem",
              color: "#4a5568",
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid #1e2535",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#c4a882";
              (e.currentTarget as HTMLAnchorElement).style.color = "#c4a882";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1e2535";
              (e.currentTarget as HTMLAnchorElement).style.color = "#4a5568";
            }}
          >
            Sign in
          </a>
          <a
            href="#"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.75rem",
              color: "#1a1410",
              textDecoration: "none",
              padding: "0.5rem 1.25rem",
              background: "#c4a882",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#d4b892";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#c4a882";
            }}
          >
            Get started →
          </a>
        </div>
      </div>

      {/* Links grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "3rem",
          marginBottom: "4rem",
        }}
      >
        {Object.entries(FOOTER_LINKS).map(([category, links]) => (
          <div key={category}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#4a5568",
                margin: "0 0 1.25rem",
              }}
            >
              {category}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href as Parameters<typeof Link>[0]["href"]}
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "0.82rem",
                      color: "#4a5568",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#8892a4";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#4a5568";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingTop: "2rem",
          borderTop: "1px solid #1e2535",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.06em",
            color: "#2a3040",
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} Pathon. Built for serious career reasoning.
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {["Privacy", "Terms", "Security"].map((label) => (
            <a
              key={label}
              href="#"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.72rem",
                color: "#2a3040",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#4a5568"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#2a3040"; }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
