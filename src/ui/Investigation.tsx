import { useState } from "react";
import type { PlayableScenario, Narrative } from "../scenario/types";
import { useGame } from "../app/GameProvider";
import { Topology } from "./Topology";
import { EvidenceView } from "./EvidenceView";
import { HypothesisPanel } from "./HypothesisPanel";
import { ReportForm } from "./ReportForm";
export type Tab = "topology" | "evidence" | "hypotheses" | "report";
export function Investigation({
  scenario,
  narrative,
  tab,
  evidenceId,
  open,
  back,
  think,
  submitted,
}: {
  scenario: PlayableScenario;
  narrative: Narrative;
  tab: Tab;
  evidenceId: string | null;
  open: (id: string) => void;
  back: () => void;
  think: (s: string) => void;
  submitted: () => void;
}) {
  const { save, dispatch, submit } = useGame();
  const attempt = save.activeAttempt!;
  const [pinnedOnly, filter] = useState(false);
  const detail = scenario.evidence.find((e) => e.id === evidenceId);
  return (
    <>
      <div hidden={tab !== "topology"}>
        <Topology scenario={scenario} open={open} think={think} thought={narrative.tabs.topology} />
      </div>
      <div hidden={tab !== "hypotheses"}>
        <HypothesisPanel
          scenario={scenario}
          attempt={attempt}
          dispatch={dispatch}
        />
      </div>
      <div hidden={tab !== "report"}>
        <ReportForm
          scenario={scenario}
          report={attempt.reportDraft}
          opened={attempt.openedEvidenceIds}
          change={(report) => {
            dispatch({ type: "DRAFT", report });
          }}
          onReview={() => think(narrative.reportThought)}
          submit={async () => {
            await submit(attempt.reportDraft);
            submitted();
          }}
        />
      </div>
      <div hidden={tab !== "evidence"}>
        {detail && (
          <EvidenceView
            evidence={detail}
            pinned={attempt.pinnedEvidenceIds.includes(detail.id)}
            togglePin={(checked) =>
              dispatch({ type: "PIN", evidenceId: detail.id, checked })
            }
            back={back}
          />
        )}
        <section hidden={!!detail}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">EVIDENCE FILES</span>
              <h2>資料と診断</h2>
            </div>
            <span className="stamp">
              閲覧 {attempt.openedEvidenceIds.length}/{scenario.evidence.length}
            </span>
          </div>
          <p className="muted">
            どれからでも調べられます。診断結果は固定です。
          </p>
          <div className="segmented">
            <button aria-pressed={!pinnedOnly} onClick={() => filter(false)}>
              すべて（{scenario.evidence.length}）
            </button>
            <button aria-pressed={pinnedOnly} onClick={() => filter(true)}>
              確認済み（{attempt.pinnedEvidenceIds.length}）
            </button>
          </div>
          <div className="evidence-list">
            {scenario.evidence
              .filter(
                (e) => !pinnedOnly || attempt.pinnedEvidenceIds.includes(e.id),
              )
              .map((e) => (
                <div className="evidence-row" key={e.id}>
                  <label
                    className="evidence-check"
                    title="自分で確認済みを記録"
                  >
                    <input
                      type="checkbox"
                      checked={attempt.pinnedEvidenceIds.includes(e.id)}
                      aria-label={`${e.id}を確認済みにする`}
                      onChange={(event) =>
                        dispatch({
                          type: "PIN",
                          evidenceId: e.id,
                          checked: event.target.checked,
                        })
                      }
                    />
                  </label>
                  <button
                    key={e.id}
                    className="evidence-card"
                    data-evidence-id={e.id}
                    onClick={() => open(e.id)}
                  >
                    <span className="file-number">{e.id}</span>
                    <span>
                      <span className="file-kind">
                        {e.acquisition === "diagnostic"
                          ? "固定診断"
                          : e.kind === "report"
                            ? "報告・資料"
                            : "記録・資料"}
                        {attempt.pinnedEvidenceIds.includes(e.id)
                          ? " · 確認済み"
                          : ""}
                        {attempt.openedEvidenceIds.includes(e.id)
                          ? " · 閲覧済み"
                          : ""}
                      </span>
                      <strong>{e.title}</strong>
                    </span>
                    <span className="chevron">›</span>
                  </button>
                </div>
              ))}
          </div>
          {pinnedOnly && attempt.pinnedEvidenceIds.length === 0 && (
            <p>証拠の横のチェック欄で、確認済みの資料を記録できます。</p>
          )}
        </section>
      </div>
    </>
  );
}
