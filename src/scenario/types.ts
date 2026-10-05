export type Option = { id: string; label: string; description: string };
export type ClaimOption = Option & { requiredEvidenceCount: 1 | 2 };
export type Explanation = { text: string; evidenceIds: string[] };
export type Block =
  | { type: "text"; body: string }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "log"; lines: string[] };
export type Evidence = {
  id: string;
  title: string;
  kind: "report" | "log" | "config" | "test" | "alert";
  nodeIds: string[];
  observedAt: string;
  observedAtLabel?: string;
  source: string;
  acquisition: "document" | "diagnostic";
  content: { blocks: Block[] };
};
export type ClaimRule = {
  claimId: string;
  requiredEvidenceSets: string[][];
  allowedSupportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
};
export type Solution = {
  scopeId: string;
  causeId: string;
  claimRules: ClaimRule[];
  repairId: string;
  preventionId: string;
  verificationId: string;
  criticalOptionIds: string[];
  causalChain: Explanation[];
  hypothesisFeedback: Record<string, Explanation>;
  optionFeedback: Record<string, Explanation>;
  evidenceRoles: Record<string, string>;
};
export type Scenario = {
  schemaVersion: 1;
  id: string;
  revision: number;
  title: string;
  type: "network" | "hybrid" | "security";
  difficulty: 1 | 2 | 3 | 4;
  estimatedMinutes: number;
  prerequisites: string[];
  brief: string;
  context: { baseline: string[]; assumptions: string[]; snapshotTime: string };
  topology: {
    nodes: { id: string; label: string; kind: string; addresses: string[] }[];
    links: { id: string; from: string; to: string; label: string }[];
  };
  evidence: Evidence[];
  hypotheses: Option[];
  reportOptions: {
    scopeOptions: Option[];
    causeOptions: Option[];
    claimOptions: ClaimOption[];
    repairOptions: Option[];
    preventionOptions: Option[];
    verificationOptions: Option[];
  };
  hints: { id: string; level: number; text: string; evidenceIds: string[] }[];
  glossary: { term: string; definition: string }[];
  solution: Solution;
};
export type PlayableScenario = Omit<Scenario, "solution">;

export type DialogueLine = { speaker: string; text: string };
export type Narrative = {
  roomThought: string; requestThought: string; startThought: string;
  tabs: Record<"topology" | "evidence" | "hypotheses" | "report", string>;
  evidenceThoughts: Record<string, string>; reportThought: string;
  resultThoughts: { solved: string; reconsider: string };
  retryThought: string; brief: string;
  characters?: { name: string; description: string }[];
  introDialogue?: DialogueLine[];
  resultDialogue?: { solved: DialogueLine[]; reconsider: DialogueLine[] };
};
