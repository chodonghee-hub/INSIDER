export type Gender = "male" | "female";

export interface ChildInfo {
  age: number;
  gender: Gender;
}

export interface SampleCase {
  case_id: string;
  label: string;
  child: ChildInfo;
  scores: Record<string, number>;
}

export interface Strength {
  scale: string;
  trait_theme: string;
  description: string;
  activity_suggestion: string;
}

export interface AttentionArea {
  scale: string;
  description: string;
  home_tip: string;
}

export interface ClassificationEntry {
  t_score: number;
  level: string;
}

export interface ReportResponse {
  child: ChildInfo;
  step0: { message: string };
  step1: {
    strengths: Strength[];
    attention_areas: AttentionArea[];
  };
  classification: Record<string, ClassificationEntry>;
  disclaimer: string;
}
