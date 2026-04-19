import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { buildCareerContext } from "@/lib/ai/context";
import { generateSTARStories } from "@/lib/ai/interview";
import { InterviewClient } from "./InterviewClient";

export default async function InterviewPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: identityCheck } = await supabase
    .from("career_identity")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!identityCheck) redirect("/identity");

  const context = await buildCareerContext(user.id);
  const result = await generateSTARStories(context);

  const stories = result.ok ? result.stories : [];
  const gaps = result.ok ? result.interview_gaps : [];
  const error = result.ok ? undefined : result.error;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
      {/* Heading */}
      <div style={{ marginBottom: "4rem" }}>
        <p style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.58rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#5c6478",
          marginBottom: "0.75rem",
        }}>
          Interview
        </p>
        <h1
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 300,
            color: "#8892a4",
            marginBottom: "0.75rem",
            letterSpacing: "-0.025em",
          }}
        >
          Turn your decisions into stories.
        </h1>
        <p
          style={{
            fontSize: "0.82rem",
            color: "#2a3040",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          STAR stories from your proof capsules · role fit analysis
        </p>
      </div>

      <InterviewClient stories={stories} gaps={gaps} error={error} />
      </div>
    </div>
  );
}
