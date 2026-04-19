import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SalaryInterface } from "@/components/salary/SalaryInterface";

export const metadata = {
  title: "Salary & Negotiation — Pathon",
  description: "Get your market salary range and practice negotiation with an AI hiring manager.",
};

export default async function SalaryPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        paddingLeft: "var(--sidebar-w, 60px)",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "3rem" }}>
          <p
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: "0.75rem",
            }}
          >
            Salary & Negotiation
          </p>
          <h1
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              fontWeight: 300,
              color: "var(--text-1)",
              marginBottom: "0.75rem",
              letterSpacing: "-0.025em",
            }}
          >
            Know your worth. Ask for it.
          </h1>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.95rem",
              color: "var(--text-3)",
              lineHeight: 1.65,
              maxWidth: "520px",
            }}
          >
            Get a personalized salary range based on your profile and market data,
            then practice the negotiation conversation with a realistic AI hiring
            manager before the real thing.
          </p>
        </div>

        <SalaryInterface />
      </div>
    </div>
  );
}
