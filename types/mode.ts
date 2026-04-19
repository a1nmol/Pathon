/**
 * Career Mode
 *
 * A lightweight signal that tells every AI module how the user is
 * currently relating to their career. Stored in localStorage — no
 * DB migration needed. The mode adjusts mentor tone, not content.
 */

export type CareerMode = "explore" | "build" | "recover" | "reflect";

export type ModeConfig = {
  label: string;
  description: string;
  /** Injected at the top of the mentor system prompt to set tone. */
  mentorTone: string;
};

export const CAREER_MODES: Record<CareerMode, ModeConfig> = {
  explore: {
    label: "Explore",
    description: "Wide lens. Questions over answers.",
    mentorTone:
      "The user is in Explore mode. They are not ready to commit to a direction. Do not push them toward decisions. Ask questions that expand the option space. Surface possibilities they may not have considered. Challenge premature narrowing. This is a time for honest uncertainty, not resolution.",
  },
  build: {
    label: "Build",
    description: "Committed to a direction. Focused on execution.",
    mentorTone:
      "The user is in Build mode. They have chosen a direction and are focused on execution. Do not re-open the question of whether they chose correctly unless there is clear evidence of a serious problem. Focus on what stands between them and forward progress. Be concrete and tactical when the situation calls for it. Do not add philosophical distance to operational questions.",
  },
  recover: {
    label: "Recover",
    description: "Something went wrong. Reorienting.",
    mentorTone:
      "The user is in Recovery mode. Something has gone wrong or they are returning from a setback. Do not project urgency onto their timeline. Do not minimize what happened. Be steady and direct. Help them separate what can be salvaged from what needs to be released. Avoid language that implies they should bounce back on a particular timeline. The goal right now is clarity, not momentum.",
  },
  reflect: {
    label: "Reflect",
    description: "Stepping back to evaluate the bigger picture.",
    mentorTone:
      "The user is in Reflect mode. They are stepping back to evaluate the larger arc of their career. Do not drive toward action. Let them think out loud. Ask questions that reveal patterns across their history. Surface what their behavioral data shows about them that they may not have consciously articulated. This is a time for observation, not prescription.",
  },
};

export const DEFAULT_MODE: CareerMode = "explore";
export const MODE_STORAGE_KEY = "pathon_career_mode";
