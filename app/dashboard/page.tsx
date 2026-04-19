import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getLatestSnapshot, loadMemory } from "@/lib/db/memory";
import { listProofCapsules } from "@/lib/db/proof";
import { getLinkedInData } from "@/lib/db/linkedin";
import { getApplications } from "@/lib/db/tracker";
import { DashboardClient } from "@/components/layout/DashboardClient";
import { selectAction } from "@/lib/nba/actions";
import type { NBAContext } from "@/lib/nba/actions";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  const [identityRes, snapshot, capsules, memory, linkedIn, trackerApps] = await Promise.all([
    supabase
      .from("career_identity")
      .select("career_stage, thinking_style, career_direction")
      .eq("user_id", user.id)
      .maybeSingle() as unknown as Promise<{
        data: { career_stage?: string; thinking_style?: string; career_direction?: string } | null;
        error: unknown;
      }>,
    getLatestSnapshot(user.id),
    listProofCapsules(user.id),
    loadMemory(user.id),
    getLinkedInData(user.id),
    getApplications(user.id).catch(() => []),
  ]);

  const identity = identityRes.data as {
    career_stage?: string;
    thinking_style?: string;
    career_direction?: string;
  } | null;

  const analysisData = snapshot?.analysis as {
    paths?: { name: string; alignment: string; time_to_readiness?: string }[];
  } | null;

  const paths = analysisData?.paths ?? [];
  const completedCapsules = capsules.filter((c) => c.is_complete);
  const patterns = memory.patterns;
  const activePursuits = memory.active_pursuits;

  type Status = "complete" | "pending" | "open";

  const BLOCKS: {
    stage: string;
    route: string;
    label: string;
    status: Status;
    summary: string;
    detail?: string;
    pct: number;
    cta?: string;
  }[] = [
    {
      stage: "identity",
      route: "/identity",
      label: "Identity",
      status: identity ? "complete" : "pending",
      summary: identity
        ? `${identity.career_stage?.replace(/_/g, " ")}`
        : "How you think and decide",
      detail: identity?.thinking_style?.replace(/_/g, " "),
      pct: identity ? 100 : 0,
      cta: identity ? undefined : "Define who you are",
    },
    {
      stage: "credentials",
      route: "/credentials",
      label: "Credentials",
      status: "open",
      summary: "Resume \u00b7 GitHub \u00b7 projects",
      pct: 0,
      cta: "Upload your work",
    },
    {
      stage: "paths",
      route: "/paths",
      label: "Paths",
      status: paths.length > 0 ? "complete" : "pending",
      summary: paths.length > 0 ? paths[0]?.name ?? "Generated" : "AI-generated career paths",
      detail:
        paths.length > 1
          ? `+${paths.length - 1} more path${paths.length > 2 ? "s" : ""}`
          : undefined,
      pct: paths.length > 0 ? 100 : 0,
      cta: paths.length === 0 ? "Generate your paths" : undefined,
    },
    {
      stage: "mentor",
      route: "/mentor",
      label: "Mentor",
      status: "open",
      summary: "AI shadow mentor",
      pct: 0,
      cta: "Get challenged",
    },
    {
      stage: "proof",
      route: "/proof",
      label: "Reflection",
      status: completedCapsules.length > 0 ? "complete" : "pending",
      summary:
        completedCapsules.length > 0
          ? `${completedCapsules.length} capsule${completedCapsules.length !== 1 ? "s" : ""} recorded`
          : "Proof of your best decisions",
      pct: Math.min(100, completedCapsules.length * 20),
      cta: completedCapsules.length === 0 ? "Record a decision" : undefined,
    },
  ];

  const nextIncompleteIdx = BLOCKS.findIndex(
    (b) => b.status === "pending" || b.status === "open",
  );

  const primaryPath = paths.find((p) => p.alignment === "aligned") ?? paths[0];

  let hasCredentials = false;
  try {
    const { data: credCheck } = await supabase
      .from("credentials")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    hasCredentials = credCheck !== null;
  } catch { /* table may not exist yet */ }

  const nbaCtx: NBAContext = {
    hasIdentity: identity !== null,
    hasCredentials,
    hasPaths: paths.length > 0,
    proofCount: completedCapsules.length,
    mentorSessionCount: 0,
    skillGapCount: 0,
    daysSinceCheckIn: null,
  };

  const nbaAction = selectAction(nbaCtx);

  const trackerTotal = trackerApps.length;
  const trackerInFlight = trackerApps.filter(
    (a) => a.current_status === "phone_screen" || a.current_status === "interview"
  ).length;
  const trackerOffers = trackerApps.filter((a) => a.current_status === "offer").length;

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        paddingLeft: "var(--sidebar-w, 60px)",
      }}
    >
      <DashboardClient
        nbaAction={nbaAction}
        blocks={BLOCKS}
        nextIncompleteIdx={nextIncompleteIdx}
        activePursuits={activePursuits}
        patterns={patterns}
        careerDirection={identity?.career_direction}
        careerStage={identity?.career_stage}
        thinkingStyle={identity?.thinking_style}
        primaryPathName={primaryPath?.name}
        linkedInPostCount={linkedIn?.post_count ?? (linkedIn ? 0 : undefined)}
        linkedInPositionCount={linkedIn?.position_count ?? (linkedIn ? 0 : undefined)}
        trackerTotal={trackerTotal}
        trackerInFlight={trackerInFlight}
        trackerOffers={trackerOffers}
      />
    </div>
  );
}
