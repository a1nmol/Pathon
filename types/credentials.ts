/**
 * Credentials
 *
 * Raw career background provided by the user.
 * No interpretation, scoring, or analysis — this is source material only.
 */

/**
 * A single project entry as stored in project_descriptions (JSONB array).
 * Title is optional so users can store unnamed projects.
 */
export type ProjectDescription = {
  title: string;
  description: string;
};

/**
 * How the resume text reached the system.
 *
 * pdf   → extracted from an uploaded PDF via pdfjs
 * text  → read from an uploaded plain text file
 * paste → typed or pasted directly by the user
 */
export type ResumeSource = "pdf" | "text" | "paste";

export type Credentials = {
  id: string;
  user_id: string;

  /** Raw text content of the resume. */
  resume_text: string | null;

  /**
   * Path to the original uploaded file in Supabase Storage (bucket: resumes).
   * Only set when resume_source is "pdf" or "text".
   * Null if the user pasted text directly or if the storage upload failed.
   */
  resume_file_path: string | null;

  /** Indicates how resume_text was produced. */
  resume_source: ResumeSource | null;

  /** GitHub profile URL, verbatim as entered. */
  github_url: string | null;

  /**
   * Optional project descriptions provided by the user.
   * Stored as JSONB; each entry is { title, description }.
   */
  project_descriptions: ProjectDescription[];

  created_at: string;
  updated_at: string;
};

export type CredentialsInsert = Omit<Credentials, "id" | "created_at" | "updated_at">;
export type CredentialsUpdate = Partial<Omit<Credentials, "id" | "user_id" | "created_at" | "updated_at">>;
