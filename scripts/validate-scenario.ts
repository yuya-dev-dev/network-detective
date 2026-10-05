import { readFileSync, readdirSync } from "node:fs";
import { assertScenario } from "../src/scenario/validate";
import { assertNarrative } from "../src/scenario/narrative";
const files = readdirSync("src/data").filter(name => /^case\d{2}\.json$/.test(name)).sort();
if (files.length !== 6) throw new Error("第1事件と追加5事件が必要です");
for (const file of files) {
  const data: unknown = JSON.parse(readFileSync("src/data/" + file, "utf8"));
  assertScenario(data);
  if (data.id === "case01" && (data.evidence.length !== 8 || data.hypotheses.length !== 4 || data.topology.nodes.length !== 6)) throw new Error("第1事件の構成が設計書と不一致");
  const narrative: unknown = JSON.parse(readFileSync(data.id === "case01" ? "src/data/narrative.json" : "src/data/narratives/" + file, "utf8"));
  assertNarrative(narrative, data);
  console.log(data.id + ": データ契約・ID参照・採点条件・会話の検証OK");
}
