import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cases, caseNumber, caseHash, caseIdFromHash, findCase, type CaseEntry } from "../scenario/registry";
import type { PlayableScenario } from "../scenario/types";
import { GameProvider, useGame } from "./GameProvider";
import { CaseList } from "../ui/CaseList";
import { Dialogue } from "../ui/Dialogue";
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
import { useGameAudio } from "../audio/useGameAudio";
import { useTheme } from "./useTheme";
import { modes, modeHash, modeForCase, listModeFromHash } from "../scenario/modes";
import { backGame, navigateGame, previousGameRoute, replaceGameRoute } from "./navigation";
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
function readView(scenario: PlayableScenario): View {
  const parts = location.hash.slice(1).split("/");
  if (caseIdFromHash(location.hash)) parts.shift();
  const [screen, part, evidence] = parts;
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
type Selection = { id: string; token: number } | null;
export default function App() {
  useGameAudio();
  const appearance = useTheme();
  const themeButton = (
    <button className="theme-toggle"
      aria-label={appearance.theme === "dark" ? "ホワイトモードに切り替える" : "ダークモードに切り替える"}
      title={appearance.theme === "dark" ? "ホワイトモードに切り替える" : "ダークモードに切り替える"}
      onClick={appearance.toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {appearance.theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20 15.5A9 9 0 0 1 8.5 4a9 9 0 1 0 11.5 11.5Z" />}
      </svg>
      <small>{appearance.theme === "dark" ? "ホワイト" : "ダーク"}</small>
    </button>
  );
  const [selectedId, select] = useState(() => caseIdFromHash(location.hash) ?? "case01");
  const [selection, request] = useState<Selection>(null);
  useEffect(() => {
    const changed = () => {
      const id = caseIdFromHash(location.hash);
      // Unprefixed case routes are always case01; title/list retain the current provider.
      if (id) select(id);
      else if (/^#(brief|investigation|result)(\/|$)/.test(location.hash)) select("case01");
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const entry = findCase(selectedId) ?? cases[0];
  return <GameProvider key={entry.scenario.id} scenario={entry.scenario} solution={entry.solution}>
    <CaseApp entry={entry} themeButton={themeButton} selection={selection} consumed={() => request(null)} choose={id => { select(id); request({ id, token: Date.now() }); }} />
  </GameProvider>;
}
function CaseApp({ entry, themeButton, selection, consumed, choose }: { entry: CaseEntry; themeButton: ReactNode; selection: Selection; consumed: () => void; choose: (id: string) => void }) {
  const { scenario, narrative, solution } = entry;
  const read = () => readView(scenario);
  const hash = (route: string) => caseHash(scenario.id, route);
  const number = caseNumber(scenario.id);
  const { save, saved, notice, dispatch, begin, flush } = useGame();
  const offline = useOffline();
  const [view, setView] = useState<View>(read),
    [glossary, showGlossary] = useState(false),
    [hints, showHints] = useState(false);
  const modeId = listModeFromHash(location.hash, entry.mode);
  const mode = modes.find(mode => mode.id === modeId)!;
  const visibleCases = cases.filter(candidate => candidate.mode === modeId);
  const [thought, think] = useState(() => narrative.tabs[read().tab]);
  const positions = useRef<Record<string, number>>({});
  const previousHash = useRef(location.hash || "#list");
  const shell = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = shell.current!;
    const header = element.querySelector(".app-header");
    const dock = element.querySelector(".game-dock");
    const measure = () => {
      element.style.setProperty(
        "--header-height",
        `${header?.getBoundingClientRect().height ?? 0}px`,
      );
      element.style.setProperty(
        "--dock-height",
        `${dock?.getBoundingClientRect().height ?? 0}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (dock) observer.observe(dock);
    measure();
    return () => observer.disconnect();
  }, [view.screen]);
  const attempt = save.activeAttempt;
  const locked =
    attempt?.phase === "submitted" || attempt?.phase === "completed";
  useEffect(() => {
    const change = () => {
      positions.current[previousHash.current] = window.scrollY;
      const key = location.hash || "#list";
      previousHash.current = key;
      setView(read());
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
    const routedId = caseIdFromHash(location.hash) ?? (/^#(brief|investigation|result)(\/|$)/.test(location.hash) ? "case01" : null);
    // The parent is switching providers; only the destination case may redirect.
    if (routedId && routedId !== scenario.id) return;
    if (
      (view.screen === "investigation" ||
        view.screen === "brief" ||
        view.screen === "result") &&
      !attempt
    ) {
      replaceGameRoute(modeHash(modeForCase(scenario.id)));
      setView(read());
    } else if (
      locked &&
      (view.screen === "investigation" || view.screen === "brief")
    ) {
      replaceGameRoute(hash("result"));
      setView(read());
    } else if (view.screen === "result" && !locked) {
      replaceGameRoute(
        attempt?.phase === "brief" ? hash("brief") : hash("investigation/topology"),
      );
      setView(read());
    }
    if (view.screen === "result" && attempt?.phase === "submitted")
      dispatch({ type: "COMPLETE" });
  }, [view.screen, attempt?.phase]);
  const navigate = (target: string) => {
    const next = target === "#list" ? modeHash(view.screen === "list" ? modeId : entry.mode) : target.startsWith("#list/") || target === "#title" ? target : hash(target.slice(1));
    navigateGame(next);
  };
  const back = async () => {
    const previous = previousGameRoute() ?? "";
    const previousCase = caseIdFromHash(previous) ?? (/^#(brief|investigation|result)(\/|$)/.test(previous) ? "case01" : null);
    if (previousCase && previousCase !== scenario.id && !await flush()) return;
    const fallback = view.screen === "list" ? "#title"
      : view.screen === "brief" || (view.screen === "result" && !view.evidenceId) ? modeHash(entry.mode)
      : view.screen === "result" ? hash("result")
      : view.evidenceId ? hash("investigation/evidence")
      : view.tab === "topology" ? hash("brief") : hash("investigation/topology");
    backGame(fallback, previous => !(locked
      && (caseIdFromHash(previous) ?? "case01") === scenario.id
      && /^#(?:case\d+\/)?(?:brief|investigation)(?:\/|$)/.test(previous)));
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
  const consumedToken = useRef<number | null>(null);
  useEffect(() => {
    if (!selection || selection.id !== scenario.id || consumedToken.current === selection.token) return;
    consumedToken.current = selection.token;
    void (async () => {
      if (!attempt) await startNew(); else resume();
      consumed();
    })();
  }, [selection]);
  const selectCase = async (id: string) => {
    if (id === scenario.id) resume();
    else if ((!attempt && save.records.length === 0) || await flush()) choose(id);
  };
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
          ? entry.mode === modeId ? narrative.roomThought : mode.thought
          : view.evidenceId
            ? narrative.evidenceThoughts[
                view.evidenceId as keyof typeof narrative.evidenceThoughts
              ]
            : thought;
  return (
    <div
      ref={shell}
      className={`app-shell ${view.screen === "title" ? "title-mode" : ""} ${view.screen === "investigation" ? "investigating" : ""}`}
    >
      {view.screen !== "title" && (
        <header className="app-header">
          <div className="header-brand">
          <button className="header-back" onClick={back} aria-label="前の画面に戻る" title="前の画面に戻る">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
            <small>戻る</small>
          </button>
          <button
            className="brand"
            onClick={() => navigate("#list")}
            aria-label="事件一覧へ"
          >
            <span>
              通信捜査室<small>NETWORK INVESTIGATION ROOM</small>
            </span>
          </button>
          </div>
          <div className="header-tools">
            <span className="status-light">
              {saved ? "保存中断可" : "保存不可"}
            </span>
            <button onClick={() => showGlossary(true)}>用語辞典</button>
            {themeButton}
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
              {themeButton}
            </div>
            <div className="title-content">
              <p className="title-kicker">記録の向こうに、答えがある。</p>
              <h1>
                通信<span>捜査室</span>
              </h1>
              <p className="title-tagline">記録を読み、真相をつなぐ。</p>
              <nav className="title-modes" aria-label="モード選択">
                {modes.map(mode => <button key={mode.id} data-sound="select" className="title-mode-button" onClick={() => navigate(modeHash(mode.id))} aria-label={`${mode.label}モードを選ぶ`}>
                  <span><strong>{mode.label}</strong><small>{mode.description}</small></span>
                  <span className="mode-count">{mode.caseIds.length ? `${mode.caseIds.length}事件` : "追加予定"}<b aria-hidden="true">↗</b></span>
                </button>)}
              </nav>
              <p className="title-footnote">
                全{cases.length}事件 · 中断して再開できます
              </p>
            </div>
            <span className="title-edition">A NETWORK MYSTERY / {cases.length} CASE FILES</span>
          </section>
        )}
        {view.screen === "list" && (
          <section>
            <div className="section-heading case-heading">
              <div>
                <span className="eyebrow">{modeId.toUpperCase()} / CASE FILES</span>
                <h1>{mode.label}</h1>
              </div>
              <span className="stamp">{visibleCases.length} FILES</span>
            </div>
            <p className="mode-description">{mode.description}</p>
            {visibleCases.length ? <CaseList entries={visibleCases} selectedId={scenario.id} currentSave={save} choose={id => void selectCase(id)} /> : <article className="paper-card mode-empty"><span className="eyebrow">NEXT CASES</span><h2>新しい依頼は、まだ届いていない。</h2><p>ネットワークモードの事件は今後追加します。ベーシックとセキュリティの事件を先に遊べます。</p></article>}
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
            <span className="eyebrow">CASE {number} / REQUEST</span>
            <h1>{scenario.title}</h1>
            <article className="paper-card briefing">
              <span className="stamp">調査依頼</span>
              <p>{scenario.brief}</p>
            </article>
            {narrative.introDialogue && <Dialogue lines={narrative.introDialogue} title="依頼人との会話" />}
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
              <span>CASE {number} · 調査中</span>
              <button onClick={() => showHints(true)}>
                ヒント {attempt.hintLevel}/3
              </button>
            </div>
            <Investigation
              scenario={scenario}
              narrative={narrative}
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
              solution={solution}
              narrative={narrative}
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
