import type { Narrative, PlayableScenario } from "./types";
import { object, string, array } from "./validate";

export function assertNarrative(value: unknown, scenario: PlayableScenario): asserts value is Narrative {
  const n = object(value, "narrative");
  for (const key of ["roomThought", "requestThought", "startThought", "reportThought", "retryThought", "brief"]) string(n[key], key);
  const tabs = object(n.tabs, "tabs");
  for (const key of ["topology", "evidence", "hypotheses", "report"]) string(tabs[key], key);
  const thoughts = object(n.evidenceThoughts, "evidenceThoughts");
  for (const e of scenario.evidence) string(thoughts[e.id], e.id);
  if (Object.keys(thoughts).some(id => !scenario.evidence.some(e => e.id === id))) throw new Error("内心に不明な証拠IDがあります");
  const result = object(n.resultThoughts, "resultThoughts");
  for (const key of ["solved", "reconsider"]) string(result[key], key);
  const lines = (value: unknown, path: string) => {
    const items = array(value, path);
    if (!items.length) throw new Error(path + ": 発言がありません");
    for (const item of items) { const line = object(item, path); string(line.speaker, "speaker"); string(line.text, "text"); }
  };
  if (n.characters !== undefined) for (const c of array(n.characters, "characters")) { const character = object(c, "character"); string(character.name, "name"); string(character.description, "description"); }
  if (n.introDialogue !== undefined) lines(n.introDialogue, "introDialogue");
  if (n.resultDialogue !== undefined) { const dialogue = object(n.resultDialogue, "resultDialogue"); lines(dialogue.solved, "solved"); lines(dialogue.reconsider, "reconsider"); }
}
