import type {
  CareerIdentity,
  CareerIdentityInsert,
  CareerIdentityUpdate,
  ThinkingStyle,
  DecisionApproach,
  LearningMode,
  WorkRhythm,
  EnergySource,
  CollaborationStyle,
  CommunicationStyle,
  FeedbackPreference,
  CareerStage,
} from "./identity";

import type { Credentials, CredentialsInsert, CredentialsUpdate } from "./credentials";
import type { ProofCapsuleRecord, ProofCapsuleInsert, ProofCapsuleUpdate, ProofCapsuleRevision, ProofCapsuleRevisionInsert } from "./proof";

export type Database = {
  public: {
    Tables: {
      career_identity: {
        Row: CareerIdentity;
        Insert: CareerIdentityInsert;
        Update: CareerIdentityUpdate;
      };
      credentials: {
        Row: Credentials;
        Insert: CredentialsInsert;
        Update: CredentialsUpdate;
      };
      proof_capsules: {
        Row: ProofCapsuleRecord;
        Insert: ProofCapsuleInsert;
        Update: ProofCapsuleUpdate;
      };
      proof_capsule_revisions: {
        Row: ProofCapsuleRevision;
        Insert: ProofCapsuleRevisionInsert;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      thinking_style: ThinkingStyle;
      decision_approach: DecisionApproach;
      learning_mode: LearningMode;
      work_rhythm: WorkRhythm;
      energy_source: EnergySource;
      collaboration_style: CollaborationStyle;
      communication_style: CommunicationStyle;
      feedback_preference: FeedbackPreference;
      career_stage: CareerStage;
    };
  };
};
