export interface CommandExplanation {
  token: string;
  description: string;
}

export interface CommandCandidate {
  command: string;
  description?: string;
  explanations?: CommandExplanation[];
  risk?: "low" | "medium" | "high";
}
