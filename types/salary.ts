export type SalaryRange = {
  low: number;
  mid: number;
  high: number;
  rationale: string;
  data_caveats: string;
};

export type NegotiationMessage = {
  role: "user" | "hiring_manager";
  content: string;
};

export type SalarySession = {
  id: string;
  user_id: string;
  role_title: string;
  location: string | null;
  years_of_exp: number | null;
  company_size: string | null;
  range_low: number | null;
  range_mid: number | null;
  range_high: number | null;
  rationale: string | null;
  data_caveats: string | null;
  negotiation_transcript: NegotiationMessage[];
  created_at: string;
};
