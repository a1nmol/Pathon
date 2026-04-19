import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { buildCareerContext } from "@/lib/ai/context";
import { buildSkillNodes } from "@/lib/ai/skills";
import { getLatestSnapshot } from "@/lib/db/memory";
import { SkillConstellation } from "@/components/identity/SkillConstellation";
import type { CareerPathAnalysis } from "@/types/decisions";
import type { ContextIdentity } from "@/types/context";

export default async function SkillsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: identityCheck } = await supabase
    .from("career_identity")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!identityCheck) redirect("/identity");

  const [context, snapshot] = await Promise.all([
    buildCareerContext(user.id),
    getLatestSnapshot(user.id),
  ]);

  if (!context.identity) redirect("/identity");

  const analysis = (snapshot?.analysis as CareerPathAnalysis | null) ?? null;
  const nodes = buildSkillNodes(context.identity as ContextIdentity, analysis);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--bg)", paddingTop: "48px" }}>
      <div style={{
        padding: "calc(56px + 2rem) 3vw 0",
        paddingLeft: "calc(var(--sidebar-w, 80px) + 2rem)",
        width: "100%",
        pointerEvents: "none",
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c6478", marginBottom: "0.75rem" }}>
            SKILLS
          </p>
          <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "#8892a4", margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
            Your skill constellation.
          </h1>
        </div>
      </div>
      {nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p style={{ color: "#2a3040", fontSize: "0.82rem", fontFamily: "Inter, system-ui, sans-serif" }}>
            Complete your identity and generate paths to see your skill constellation.
          </p>
        </div>
      ) : (
        <SkillConstellation nodes={nodes} />
      )}
    </div>
  );
}
