import type { PlayableScenario, Solution, Narrative } from "../scenario/types";
import type { Attempt } from "../game/types";
import { Dialogue } from "./Dialogue";
import { ExplanationCard } from "./common";
export function ResultView({
  scenario,
  narrative,
  solution,
  attempt,
  retry,
  list,
  open,
}: {
  scenario: PlayableScenario;
  narrative?: Narrative;
  solution: Solution;
  attempt: Attempt;
  retry: () => void;
  list: () => void;
  open: (id: string) => void;
}) {
  const result = attempt.result!,
    report = attempt.submittedReport!;
  const labels = {
    scope: "影響範囲",
    cause: "根本原因",
    claims: "判断根拠",
    repair: "修復計画",
    prevention: "再発防止",
    verification: "復旧確認",
  };
  const selected = [
    report.scopeId,
    report.causeId,
    ...report.claims.map((c) => c.claimId),
    report.repairId,
    report.preventionId,
    report.verificationId,
  ].filter((id): id is string => !!id);
  const option = (id: string) =>
    Object.values(scenario.reportOptions)
      .flat()
      .find((o) => o.id === id);
  return (
    <section>
      <div className="result-banner">
        <span className="eyebrow">CASE REPORT</span>
        <h1>{result.solved ? "解決" : "調査完了・再検討あり"}</h1>
        <p className="score">
          {result.total}
          <span>/100</span>
        </p>
        <p>
          ヒント使用：
          {attempt.hintLevel === 0 ? "なし" : `第${attempt.hintLevel}段階まで`}
        </p>
      </div>
      {narrative?.resultDialogue && <Dialogue lines={narrative.resultDialogue[result.solved ? "solved" : "reconsider"]} title="報告後の会話" />}
      <div className="paper-card">
        <h2>得点の内訳</h2>
        <dl className="score-breakdown">
          {Object.entries(result.scores).map(([key, score]) => (
            <div key={key}>
              <dt>{labels[key as keyof typeof labels]}</dt>
              <dd>
                {score} / {key === "cause" || key === "claims" ? 30 : 10}
              </dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          解決には原因・修復・確認の正解、根拠20点以上、合計80点以上、重大な危険操作なしが必要です。速さ・閲覧数・用語辞典・ヒントで減点しません。
        </p>
        {result.claimScores.map((c) => (
          <p key={c.claimId}>
            <strong>{option(c.claimId)?.label}</strong>
            <br />
            {c.points}/10点 ·{" "}
            {
              {
                complete: "成立条件を満たした",
                partial: "支持証拠はあるが、成立条件が不足",
                contradictory: "矛盾する証拠が含まれる",
                unrelated: "支持証拠が添付されていない",
                incorrect: "証拠から成立しない主張",
              }[c.reason]
            }
          </p>
        ))}
      </div>
      {result.criticalOptionIds.map((id) => (
        <article className="critical-notice" key={id}>
          <h2>重大な危険操作</h2>
          <ExplanationCard item={solution.optionFeedback[id]} open={open} />
        </article>
      ))}
      <h2>事件のつながり</h2>
      {solution.causalChain.map((item, i) => (
        <div key={i} className="causal-step">
          <span>{String(i + 1).padStart(2, "0")}</span>
          <ExplanationCard item={item} open={open} />
        </div>
      ))}
      <h2>提出した選択の解説</h2>
      {selected.map((id) => (
        <article className="paper-card" key={id}>
          <h3>{option(id)?.label}</h3>
          <ExplanationCard item={solution.optionFeedback[id]} open={open} />
        </article>
      ))}
      <h2>仮説の検証</h2>
      {scenario.hypotheses.map((h) => (
        <article className="paper-card" key={h.id}>
          <h3>{h.label}</h3>
          <ExplanationCard
            item={solution.hypothesisFeedback[h.id]}
            open={open}
          />
        </article>
      ))}
      <div className="result-actions">
        <button className="primary" onClick={retry}>
          別の試行で再挑戦
        </button>
        <button onClick={list}>事件一覧へ</button>
      </div>
    </section>
  );
}
