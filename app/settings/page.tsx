import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata = {
  title: "Settings — Pathon",
};

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div
        style={{
          maxWidth: "740px",
          margin: "0 auto",
          padding: "calc(56px + 2.5rem) 5vw 8rem",
        }}
      >
      {/* Page header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-4)",
            marginBottom: "0.5rem",
          }}
        >
          Settings
        </p>
        <h1
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--text-1)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Account &amp; preferences
        </h1>
      </div>

      <SettingsClient email={user.email} />
      </div>
    </div>
  );
}
