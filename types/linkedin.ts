/**
 * LinkedIn import types
 *
 * These represent the parsed output of a LinkedIn data export ZIP.
 * LinkedIn exports CSVs — we parse them client-side for privacy.
 */

export type LinkedInPosition = {
  company: string;
  title: string;
  description: string | null;
  location: string | null;
  started_on: string | null;
  finished_on: string | null;
  is_current: boolean;
};

export type LinkedInEducation = {
  school: string;
  degree: string | null;
  field: string | null;
  started_on: string | null;
  finished_on: string | null;
  notes: string | null;
};

export type LinkedInPost = {
  date: string;
  text: string;
  url: string | null;
  type: "post" | "article";
  title: string | null;
};

export type LinkedInSkill = {
  name: string;
};

export type ParsedLinkedInData = {
  headline: string | null;
  summary: string | null;
  location: string | null;
  positions: LinkedInPosition[];
  education: LinkedInEducation[];
  skills: LinkedInSkill[];
  posts: LinkedInPost[];
};

export type LinkedInRecord = {
  id: string;
  user_id: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  positions: LinkedInPosition[];
  education: LinkedInEducation[];
  skills: LinkedInSkill[];
  posts: LinkedInPost[];
  post_count: number;
  position_count: number;
  imported_at: string;
  updated_at: string;
};
