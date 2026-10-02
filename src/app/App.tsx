import { useEffect, useRef, useState } from "react";
import { playableScenario as scenario, getSolution } from "../scenario/load";
import narrative from "../data/narrative.json";
import { useGame } from "./GameProvider";
import { useOffline } from "../pwa/register";
import {
  Dialog,
  EvidenceRefs,
  Glossary,
  InnerVoice,
  TabIcon,
} from "../ui/common";
import { Investigation, type Tab } from "../ui/Investigation";
import { ResultView } from "../ui/ResultView";
import { EvidenceView } from "../ui/EvidenceView";
type View = {
  screen: "title" | "list" | "brief" | "investigation" | "result";
  tab: Tab;
  evidenceId: string | null;
};
const tabs: { id: Tab; label: string }[] = [
  { id: "topology", label: "構成" },
  { id: "evidence", label: "証拠" },
  { id: "hypotheses", label: "仮説" },
  { id: "report", label: "報告" },
];
function readView(): View {
  const [screen, part, evidence] = location.hash.slice(1).split("/");
  if (screen === "investigation")
    return {
      screen,
      tab: tabs.some((t) => t.id === part) ? (part as Tab) : "topology",
      evidenceId: scenario.evidence.some((e) => e.id === evidence)
        ? evidence
        : null,
    };
  if (screen === "result")
    return {
      screen,
      tab: "evidence",
      evidenceId: scenario.evidence.some((e) => e.id === part) ? part : null,
    };
  return {
    screen: screen === "brief" ? "brief" : screen === "list" ? "list" : "title",
    tab: "topology",
    evidenceId: null,
  };
}
export default function App() {
  const { save, saved, notice, dispatch, begin, flush } = useGame();
  const offline = useOffline();
  const [view, setView] = useState<View>(readView),
    [glossary, showGlossary] = useState(false),
    [hints, showHints] = useState(false);
  const [thought, think] = useState(() => narrative.tabs[readView().tab]);
  const positions = useRef<Record<string, number>>({});
  const previousHash = useRef(location.hash || "#list");
  const attempt = save.activeAttempt;
  const locked =
    attempt?.phase === "submitted" || attempt?.phase === "completed";
  useEffect(() => {
    const change = () => {
      positions.current[previousHash.current] = window.scrollY;
      const key = location.hash || "#list";
      previousHash.current = key;
      setView(readView());
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          window.scrollTo(0, positions.current[key] ?? 0),
        ),
      );
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (
      (view.screen === "investigation" ||
        view.screen === "brief" ||
        view.screen === "result") &&
      !attempt
    ) {
      history.replaceState(null, "", "#list");
      setView(readView());
    } else if (
      locked &&
      (view.screen === "investigation" || view.screen === "brief")
    ) {
      history.replaceState(null, "", "#result");
      setView(readView());
    } else if (view.screen === "result" && !locked) {
      history.replaceState(
        null,
        "",
        attempt?.phase === "brief" ? "#brief" : "#investigation/topology",
      );
      setView(readView());
    }
    if (view.screen === "result" && attempt?.phase === "submitted")
      dispatch({ type: "COMPLETE" });
  }, [view.screen, attempt?.phase]);
  const navigate = (hash: string) => {
    if (location.hash !== hash) location.hash = hash;
  };
  const open = (id: string) => {
    dispatch({ type: "OPEN", evidenceId: id });
    showHints(false);
    think(
      narrative.evidenceThoughts[id as keyof typeof narrative.evidenceThoughts],
    );
    navigate(locked ? `#result/${id}` : `#investigation/evidence/${id}`);
  };
  const startNew = async () => {
    await begin();
    think(
      save.records.length ? narrative.retryThought : narrative.requestThought,
    );
    navigate("#brief");
  };
  const resume = () => {
    if (!attempt) startNew();
    else
      navigate(
        locked
          ? "#result"
          : attempt.phase === "brief"
            ? "#brief"
            : "#investigation/topology",
      );
  };
  const records = save.records.filter((r) => r.scenarioId === scenario.id);
  const dockText =
    view.screen === "result"
      ? narrative.resultThoughts[
          attempt?.result?.solved ? "solved" : "reconsider"
        ]
      : view.screen === "brief"
        ? save.records.length
          ? narrative.retryThought
          : narrative.requestThought
        : view.screen === "list"
          ? narrative.roomThought
          : view.evidenceId
            ? narrative.evidenceThoughts[
                view.evidenceId as keyof typeof narrative.evidenceThoughts
              ]
            : thought;
  return (
    <div
      className={`app-shell ${view.screen === "title" ? "title-mode" : ""} ${view.screen === "investigation" ? "investigating" : ""}`}
    >
      {view.screen !== "title" && (
        <header className="app-header">
          <button
            className="brand"
            onClick={() => navigate("#list")}
            aria-label="事件一覧へ"
          >
            <span className="brand-mark" aria-hidden="true">
              通信
            </span>
            <span>
              通信捜査室<small>NETWORK INVESTIGATION ROOM</small>
            </span>
          </button>
          <div className="header-tools">
            <span className="status-light">
              {saved ? "保存中断可" : "保存不可"}
            </span>
            <button onClick={() => showGlossary(true)}>用語辞典</button>
          </div>
        </header>
      )}
      <main className="main-content">
        {notice && view.screen !== "title" && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {view.screen === "title" && (
          <section className="title-screen" aria-label="タイトル画面">
            <img
              className="title-background"
              src={`${import.meta.env.BASE_URL}art/title-night.webp`}
              alt="雨の夜、都市を見渡す暗い捜査端末"
              width="960"
              height="1440"
            />
            <div className="title-shade" />
            <div className="title-topline">
              <span>NETWORK INVESTIGATION ROOM</span>
              <span>01</span>
            </div>
            <div className="title-content">
              <p className="title-kicker">記録の向こうに、答えがある。</p>
              <h1>
                通信<span>捜査室</span>
              </h1>
              <p className="title-tagline">記録を読み、真相をつなぐ。</p>
              <button className="title-start" onClick={() => navigate("#list")}>
                <span>捜査を始める</span>
                <span aria-hidden="true">↗</span>
              </button>
              <p className="title-footnote">
                第1事件 · 約10分 · 中断して再開できます
              </p>
            </div>
            <span className="title-edition">A NETWORK MYSTERY / CASE 01</span>
          </section>
        )}
        {view.screen === "list" && (
          <section>
            <div className="section-heading case-heading">
              <div>
                <span className="eyebrow">CASE FILES</span>
                <h1>受信した依頼</h1>
              </div>
              <span className="stamp">01 FILE</span>
            </div>
            <article className="case-card">
              <div className="case-meta">
                <span>CASE 01</span>
                <span>NETWORK</span>
                <span>初級 · 約10分</span>
              </div>
              <h2>{scenario.title}</h2>
              <p>構成と記録を突き合わせて、通信障害の原因を調べる。</p>
              <div className="case-progress">
                {attempt
                  ? locked
                    ? "報告済み"
                    : attempt.phase === "brief"
                      ? "依頼を確認中"
                      : `調査中 · 証拠 ${attempt.openedEvidenceIds.length}/8`
                  : "未着手"}
              </div>
              <button className="primary wide" onClick={resume}>
                {!attempt
                  ? "依頼を開く"
                  : locked
                    ? "結果と解説を見る"
                    : "続きから調査する"}{" "}
                <span>→</span>
              </button>
              {records.length > 0 && (
                <div className="record-summary">
                  <span>初回 {records[0].result.total}点</span>
                  <span>最新 {records[records.length - 1].result.total}点</span>
                  <span>{records.length}回の報告</span>
                </div>
              )}
            </article>
            <p className="offline-status" role="status">
              <span className={`dot ${offline.ready ? "ready" : ""}`} />
              {offline.ready
                ? "オフライン準備完了"
                : import.meta.env.PROD
                  ? "オフライン準備中（初回は通信が必要です）"
                  : "開発プレビュー"}
            </p>
            {offline.message && (
              <p className="notice" role="status">
                {offline.message}
              </p>
            )}
            {offline.waiting && (
              <div className="paper-card">
                <p>
                  新しいバージョンがあります。進行を保存して、一覧から更新できます。
                </p>
                <button
                  disabled={!saved}
                  onClick={async () => {
                    if (await flush()) offline.apply();
                  }}
                >
                  保存して更新する
                </button>
              </div>
            )}
            <button className="title-return" onClick={() => navigate("#title")}>
              タイトルへ戻る
            </button>
          </section>
        )}
        {view.screen === "brief" && attempt && (
          <section>
            <span className="eyebrow">CASE 01 / REQUEST</span>
            <h1>{scenario.title}</h1>
            <article className="paper-card briefing">
              <span className="stamp">調査依頼</span>
              <p>{scenario.brief}</p>
            </article>
            <article className="paper-card">
              <h2>普段の動作</h2>
              <ul>
                {scenario.context.baseline.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
            <p className="muted">
              資料を比べ、仮説を整理し、原因と根拠を報告します。途中で閉じても、この端末で再開できます。
            </p>
            <button
              className="primary wide"
              onClick={async () => {
                await dispatch({ type: "START" });
                think(narrative.startThought);
                navigate("#investigation/topology");
              }}
            >
              現場の調査を始める →
            </button>
          </section>
        )}
        {view.screen === "investigation" && attempt && !locked && (
          <>
            <div className="investigation-toolbar">
              <span>CASE 01 · 調査中</span>
              <button onClick={() => showHints(true)}>
                ヒント {attempt.hintLevel}/3
              </button>
            </div>
            <Investigation
              scenario={scenario}
              tab={view.tab}
              evidenceId={view.evidenceId}
              open={open}
              back={() => navigate("#investigation/evidence")}
              think={think}
              submitted={() => navigate("#result")}
            />
          </>
        )}
        {view.screen === "result" &&
          attempt &&
          locked &&
          (view.evidenceId ? (
            <>
              <p className="stamp">解説から証拠を確認中 · 閲覧のみ</p>
              <EvidenceView
                evidence={scenario.evidence.find(
                  (e) => e.id === view.evidenceId,
                )!}
                pinned={attempt.pinnedEvidenceIds.includes(view.evidenceId)}
                backLabel="解説へ戻る"
                back={() => navigate("#result")}
              />
            </>
          ) : (
            <ResultView
              scenario={scenario}
              solution={getSolution()}
              attempt={attempt}
              retry={startNew}
              list={() => navigate("#list")}
              open={open}
            />
          ))}
      </main>
      {view.screen !== "title" && (
        <footer className="game-dock">
          <InnerVoice text={dockText} />
          {view.screen === "investigation" && !locked && (
            <nav className="bottom-tabs" aria-label="調査タブ">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  aria-current={view.tab === t.id ? "page" : undefined}
                  onClick={() => {
                    think(narrative.tabs[t.id]);
                    navigate(`#investigation/${t.id}`);
                  }}
                >
                  <TabIcon name={t.id} />
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          )}
        </footer>
      )}
      {glossary && (
        <Glossary scenario={scenario} close={() => showGlossary(false)} />
      )}{" "}
      {hints && attempt && (
        <Dialog title="調査のヒント" close={() => showHints(false)}>
          <p className="muted">
            段階順に開きます。使用した段階は記録しますが、得点は下げません。
          </p>
          {scenario.hints.slice(0, attempt.hintLevel).map((h) => (
            <article className="paper-card" key={h.id}>
              <h3>第{h.level}段階</h3>
              <p>{h.text}</p>
              <EvidenceRefs ids={h.evidenceIds} open={open} />
            </article>
          ))}
          <button
            className="primary wide"
            disabled={attempt.hintLevel >= 3}
            onClick={() => dispatch({ type: "HINT" })}
          >
            {attempt.hintLevel >= 3
              ? "すべてのヒントを開きました"
              : `第${attempt.hintLevel + 1}段階のヒントを開く`}
          </button>
        </Dialog>
      )}
    </div>
  );
}
