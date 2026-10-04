import data from "../src/data/case01.json";
import { assertScenario } from "../src/scenario/validate";
assertScenario(data);
if (
  data.id !== "case01" ||
  data.evidence.length !== 8 ||
  data.hypotheses.length !== 4 ||
  data.topology.nodes.length !== 6
)
  throw new Error("第1事件の構成が設計書と不一致");
console.log("第1事件：データ契約・ID参照・採点条件の検証OK");
