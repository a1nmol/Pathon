export type ATSFix = {
  issue: string;
  fix: string;
  capsule_id?: string;
  capsule_claim?: string;
};

export type ATSScanResult = {
  score: number; // 0–100
  headline: string;
  hard_skills_missing: string[];
  soft_skills_missing: string[];
  keyword_hits: string[];
  fixes: ATSFix[];
  summary: string;
};

export type CoverLetterResult = {
  subject_line: string;
  body: string;
  tone_notes: string;
};
