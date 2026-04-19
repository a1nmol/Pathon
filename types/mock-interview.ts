export type InterviewType = "behavioral" | "system_design" | "technical" | "product";

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  behavioral: "Behavioral",
  system_design: "System Design",
  technical: "Technical / Coding",
  product: "Product Sense",
};

export type MockInterviewMessage = {
  role: "interviewer" | "candidate" | "user";
  content: string;
  timestamp?: string;
};

export type MockInterviewScore = {
  overall: number;        // 0-10
  communication: number;
  specificity: number;
  structure: number;
};

export type MockInterviewFeedback = {
  score: MockInterviewScore;
  strengths: string[];
  improvements: string[];
  standout_moments: string[];
  summary: string;
};

export type MockInterviewSession = {
  id: string;
  user_id: string;
  role_title: string;
  interview_type: InterviewType;
  transcript: MockInterviewMessage[];
  feedback: MockInterviewFeedback | null;
  is_complete: boolean;
  created_at: string;
};
