import { createClient } from "@/lib/db/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles the magic link redirect from Supabase.
 * After session exchange, checks user_type:
 *   - no type → /onboarding (choose role)
 *   - employer → /employer/dashboard
 *   - applicant → /dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData.user) {
      // If a specific next path was requested, honor it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, route based on user_type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("user_profiles")
        .select("user_type")
        .eq("user_id", sessionData.user.id)
        .maybeSingle();

      const userType = profile?.user_type;
      if (userType === "employer") {
        return NextResponse.redirect(`${origin}/employer/dashboard`);
      } else if (userType === "applicant") {
        return NextResponse.redirect(`${origin}/dashboard`);
      } else {
        // New user — pick a role
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
