import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { GapAnalyzer } from "@/components/gap-analyzer/GapAnalyzer";

export const metadata = {
  title: "Gap Analyzer — Pathon",
  description: "Identify skill gaps between your current profile and your target role.",
};

export default async function GapAnalyzerPage() {
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
          maxWidth: "1140px",
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
            Gap Analyzer
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
            Know exactly what's missing.
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
            Enter your target role. Live market oracle fetches demand and salary data,
            then a planner agent maps your specific skill gaps, and the syllabus
            builder creates a day-by-day learning plan with real verified courses.
          </p>
        </div>

        <GapAnalyzer />
      </div>
    </div>
  );
}
