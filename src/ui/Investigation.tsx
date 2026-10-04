import { useState } from "react";
import type { PlayableScenario } from "../scenario/types";
import { useGame } from "../app/GameProvider";
import { Topology } from "./Topology";
import { EvidenceView } from "./EvidenceView";
import { HypothesisPanel } from "./HypothesisPanel";
import { ReportForm } from "./ReportForm";
import narrative from "../data/narrative.json";
export type Tab = "topology" | "evidence" | "hypotheses" | "report";
export function Investigation({
  scenario,
  tab,
  evidenceId,
  open,
  back,
  think,
  submitted,
}: {
  scenario: PlayableScenario;
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
        <Topology scenario={scenario} open={open} think={think} />
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
            togglePin={() => dispatch({ type: "PIN", evidenceId: detail.id })}
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
              閲覧 {attempt.openedEvidenceIds.length}/8
            </span>
          </div>
          <p className="muted">
            どれからでも調べられます。診断結果は固定です。
          </p>
          <div className="segmented">
            <button aria-pressed={!pinnedOnly} onClick={() => filter(false)}>
              すべて（8）
            </button>
            <button aria-pressed={pinnedOnly} onClick={() => filter(true)}>
              ピン留め（{attempt.pinnedEvidenceIds.length}）
            </button>
          </div>
          <div className="evidence-list">
            {scenario.evidence
              .filter(
                (e) => !pinnedOnly || attempt.pinnedEvidenceIds.includes(e.id),
              )
              .map((e) => (
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
                        ? " · ◆ ピン留め"
                        : ""}
                      {attempt.openedEvidenceIds.includes(e.id)
                        ? " · 閲覧済み"
                        : ""}
                    </span>
                    <strong>{e.title}</strong>
                  </span>
                  <span className="chevron">›</span>
                </button>
              ))}
          </div>
          {pinnedOnly && attempt.pinnedEvidenceIds.length === 0 && (
            <p>証拠の詳細でピン留めすると、ここに並びます。</p>
          )}
        </section>
      </div>
    </>
  );
}
