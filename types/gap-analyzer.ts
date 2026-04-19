export type GapLevel = "critical" | "moderate" | "minor";

export type GapItem = {
  skill: string;
  gap_level: GapLevel;
  current_level: string;
  target_level: string;
  how_to_close: string;
  timeline_weeks: number;
};

export type MarketOracleResult = {
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  demand_growth_pct: number;
  demand_signal: "very high" | "high" | "moderate" | "low";
  hot_skills: string[];
  emerging_roles: Array<{
    title: string;
    growth_pct: number;
    description: string;
  }>;
  company_intel?: string;
  data_freshness: string;
};

export type CourseResource = {
  title: string;
  platform: "YouTube" | "Coursera" | "DeepLearning.ai" | "Udemy" | "GitHub" | "Other";
  creator?: string;
  duration_hours: number;
  is_free: boolean;
  search_url: string;
  type: "video" | "course" | "project" | "article";
};

export type SyllabusBlock = {
  time_of_day: string;
  hours: number;
  activity: string;
  resource?: CourseResource;
};

export type SyllabusDay = {
  day: number;
  total_hours: number;
  blocks: SyllabusBlock[];
};

export type SkillSyllabus = {
  skill: string;
  gap_level: GapLevel;
  total_hours: number;
  days: SyllabusDay[];
  milestone: string;
};

export type CritiqueIssue = {
  gap_index: number;
  issue: string;
  feasibility_score: number;
  suggested_fix: string;
};

export type CritiqueResult = {
  issues: CritiqueIssue[];
  overall_feasibility: number;
  revised_instructions: string;
};

export type GapAnalysisResult = {
  gaps: GapItem[];
  readiness_score: number;
  readiness_summary: string;
};

export type UserConstraints = {
  time_budget: "48-hours" | "1-week" | "1-month" | "3-months";
  situation: string[];
};

export type FullGapAnalysisSession = {
  id: string;
  user_id: string;
  target_role: string;
  target_company: string | null;
  constraints: UserConstraints;
  oracle: MarketOracleResult | null;
  gaps: GapItem[];
  readiness_score: number;
  readiness_summary: string;
  critique: CritiqueResult | null;
  syllabus: SkillSyllabus[];
  created_at: string;
};

// Legacy compat
export type GapAnalysisSession = FullGapAnalysisSession;

export type GapAnalysisPhase =
  | "idle"
  | "oracle_running"
  | "oracle_done"
  | "agent_a_running"
  | "agent_a_done"
  | "agent_b_running"
  | "agent_b_done"
  | "agent_revised_running"
  | "agent_revised_done"
  | "syllabus_running"
  | "complete"
  | "error";

export type GapAnalysisEvent =
  | { type: "oracle_start" }
  | { type: "oracle_result"; data: MarketOracleResult }
  | { type: "agent_a_start" }
  | { type: "agent_a_draft"; data: GapAnalysisResult }
  | { type: "agent_b_start" }
  | { type: "agent_b_critique"; data: CritiqueResult }
  | { type: "agent_revised_start" }
  | { type: "agent_revised"; data: GapAnalysisResult }
  | { type: "syllabus_start" }
  | { type: "syllabus_result"; data: SkillSyllabus[] }
  | { type: "complete"; data: FullGapAnalysisSession }
  | { type: "error"; message: string };
