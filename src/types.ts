export interface CommandCandidate {
  command: string;
  description?: string;
  risk?: "low" | "medium" | "high";
}
