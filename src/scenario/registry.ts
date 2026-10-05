import firstNarrative from "../data/narrative.json";
import { assertScenario } from "./validate";
import { assertNarrative } from "./narrative";
import type { Narrative, PlayableScenario, Solution } from "./types";

export type CaseEntry = { scenario: PlayableScenario; narrative: Narrative; solution: Solution };
const data = import.meta.glob("../data/case*.json", { eager: true, import: "default" });
const narratives = import.meta.glob("../data/narratives/case*.json", { eager: true, import: "default" });
export const cases: CaseEntry[] = Object.values(data).map(value => {
  assertScenario(value);
  const { solution, ...scenario } = value;
  const narrative = value.id === "case01" ? firstNarrative : narratives[`../data/narratives/${value.id}.json`];
  assertNarrative(narrative, scenario);
  return { scenario, solution, narrative };
}).sort((a, b) => a.scenario.id.localeCompare(b.scenario.id));
export const findCase = (id: string) => cases.find(entry => entry.scenario.id === id);
export const caseNumber = (id: string) => id.slice(4);
// Legacy case01 routes remain valid, including existing bookmarks.
export const caseHash = (id: string, route: string) =>
  route === "list" || route === "title" || id === "case01" ? "#" + route : "#" + id + "/" + route;
export const caseIdFromHash = (hash: string) => {
  const part = hash.replace(/^#/, "").split("/")[0];
  return findCase(part) ? part : null;
};
