import { caseNumber, type CaseEntry } from "../scenario/registry";
import { loadSave } from "../storage/localStorage";
import type { GameSave } from "../game/types";
const levels = ["", "初級", "中級", "上級", "発展"];
export function CaseList({ entries, selectedId, currentSave, choose }: { entries: CaseEntry[]; selectedId: string; currentSave: GameSave; choose: (id: string) => void }) {
  return <div className="case-files">{entries.map(({ scenario, solution }) => {
    const save = scenario.id === selectedId ? currentSave : loadSave(() => localStorage, scenario, solution).save;
    const attempt = save.activeAttempt;
    const locked = attempt?.phase === "submitted" || attempt?.phase === "completed";
    return <article className="case-card" data-case-id={scenario.id} key={scenario.id}>
      <div className="case-meta"><span>CASE {caseNumber(scenario.id)}</span><span>{scenario.type.toUpperCase()}</span><span>{levels[scenario.difficulty]} · 約{scenario.estimatedMinutes}分</span></div>
      <h2>{scenario.title}</h2>
      <p>{scenario.prerequisites.join(" / ")}</p>
      <div className="case-progress">{!attempt ? "未着手" : locked ? "報告済み" : attempt.phase === "brief" ? "依頼を確認中" : `調査中 · 証拠 ${attempt.openedEvidenceIds.length}/${scenario.evidence.length}`}</div>
      <button data-sound="select" className="primary wide" onClick={() => choose(scenario.id)}>{!attempt ? "依頼を開く" : locked ? "結果と解説を見る" : "続きから調査する"} <span>→</span></button>
      {save.records.length > 0 && <div className="record-summary"><span>初回 {save.records[0].result.total}点</span><span>最新 {save.records[save.records.length - 1].result.total}点</span><span>{save.records.length}回の報告</span></div>}
    </article>;
  })}</div>;
}
