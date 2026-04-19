export type ApplicationStatus =
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted";

export const STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "ghosted",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
};

export type JobApplication = {
  id: string;
  user_id: string;
  company: string;
  role_title: string;
  job_url: string | null;
  job_description: string | null;
  current_status: ApplicationStatus;
  applied_at: string;
  last_activity_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobApplicationInsert = Omit<JobApplication, "id" | "user_id" | "created_at" | "updated_at">;

export type FunnelMetrics = {
  total: number;
  by_status: Record<ApplicationStatus, number>;
  response_rate: number;       // % that moved past "applied"
  interview_rate: number;      // % of total that reached interview
  offer_rate: number;          // % of total that reached offer
  ghosted_count: number;
  avg_days_to_response: number | null;
};
