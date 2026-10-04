import data from "../data/case01.json" with { type: "json" };
import { assertScenario } from "./validate";
import type { PlayableScenario, Scenario } from "./types";
assertScenario(data);
const scenario: Scenario = data;
const { solution, ...playable } = scenario;
export const playableScenario: PlayableScenario = playable;
// Author data is imported only by submission orchestration and the result view.
export function getSolution() {
  return solution;
}
