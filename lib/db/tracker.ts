import { createClient } from "@/lib/db/server";
import type { JobApplication, ApplicationStatus } from "@/types/tracker";

export async function getApplications(userId: string): Promise<JobApplication[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as JobApplication[];
}

export async function createApplication(
  userId: string,
  input: {
    company: string;
    role_title: string;
    job_url?: string;
    job_description?: string;
    notes?: string;
  }
): Promise<JobApplication> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("job_applications")
    .insert({
      user_id: userId,
      company: input.company,
      role_title: input.role_title,
      job_url: input.job_url ?? null,
      job_description: input.job_description ?? null,
      notes: input.notes ?? null,
      current_status: "applied",
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
  note?: string
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Update the application
  const { error } = await (supabase as any)
    .from("job_applications")
    .update({
      current_status: status,
      last_activity_at: now,
      updated_at: now,
    })
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (error) throw error;

  // Append event
  await (supabase as any)
    .from("application_events")
    .insert({
      application_id: applicationId,
      status,
      note: note ?? null,
      occurred_at: now,
    });
}

export async function updateApplicationNotes(
  userId: string,
  applicationId: string,
  notes: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("job_applications")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteApplication(
  userId: string,
  applicationId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("job_applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (error) throw error;
}
