export type NetworkConnection = {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  connected_on: string | null;
  email: string | null;
};

export type WarmPath = {
  connection: NetworkConnection;
  target_company: string;
  relevance_reason: string;
  suggested_message: string;
};
