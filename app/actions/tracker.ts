"use server";

import { createClient } from "@/lib/db/server";
import {
  getApplications,
  createApplication,
  updateApplicationStatus,
  updateApplicationNotes,
  deleteApplication,
} from "@/lib/db/tracker";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@/types/tracker";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function addApplication(formData: {
  company: string;
  role_title: string;
  job_url?: string;
  job_description?: string;
  notes?: string;
}) {
  const user = await getUser();
  const app = await createApplication(user.id, formData);
  revalidatePath("/tracker");
  return app;
}

export async function moveApplication(applicationId: string, status: ApplicationStatus, note?: string) {
  const user = await getUser();
  await updateApplicationStatus(user.id, applicationId, status, note);
  revalidatePath("/tracker");
}

export async function saveNotes(applicationId: string, notes: string) {
  const user = await getUser();
  await updateApplicationNotes(user.id, applicationId, notes);
  revalidatePath("/tracker");
}

export async function removeApplication(applicationId: string) {
  const user = await getUser();
  await deleteApplication(user.id, applicationId);
  revalidatePath("/tracker");
}

export async function fetchApplications() {
  const user = await getUser();
  return getApplications(user.id);
}
