import { requireStage, nextRoute } from "@/lib/auth/flow";
import { buildCareerContext } from "@/lib/ai/context";
import { generateCareerPaths } from "@/lib/ai/decisions";
import { saveSnapshot, getLatestSnapshot } from "@/lib/db/memory";
import { CareerPathViz } from "@/components/identity/CareerPathViz";
import { PathsContinue } from "@/components/identity/PathsContinue";
import type { CareerPathAnalysis } from "@/types/decisions";

export default async function PathsPage() {
  const { userId } = await requireStage("paths");

  // Reuse saved snapshot — no API call on refresh
  const existing = await getLatestSnapshot(userId);
  let analysis: CareerPathAnalysis | null =
    (existing?.analysis as CareerPathAnalysis | null) ?? null;
  let snapshotId: string | undefined = existing?.id;
  let error: string | null = null;

  if (!analysis) {
    const context = await buildCareerContext(userId);
    const result = await generateCareerPaths(context);
    if (result.ok) {
      analysis = result.analysis;
      const saved = await saveSnapshot(userId, result.analysis);
      if ("snapshot_id" in saved) snapshotId = saved.snapshot_id;
    } else {
      error = result.error;
    }
  }

  const paths = analysis?.paths ?? [];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {paths.length > 0 ? (
        <CareerPathViz paths={paths} analysis={analysis ?? undefined} snapshotId={snapshotId} />
      ) : (
        <div
          className="flex h-screen items-center justify-center"
          style={{ background: "var(--bg)" }}
        >
          <p style={{ color: "var(--text-3)", fontSize: "0.85rem", maxWidth: "400px", lineHeight: 1.7 }}>
            {error ?? "No paths could be generated from the current data."}
          </p>
        </div>
      )}

      <PathsContinue redirectTo={nextRoute("paths")} />
    </div>
  );
}
