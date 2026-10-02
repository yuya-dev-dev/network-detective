import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playableScenario, getSolution } from "../scenario/load";
import { gameReducer, newAttempt, type Action } from "../game/reducer";
import { gradeReport, validateReport } from "../game/scoring";
import { loadSave, persistSave, storageKey } from "../storage/localStorage";
import type { GameSave, Report } from "../game/types";
type GameContextValue = {
  save: GameSave;
  saved: boolean;
  notice: string | null;
  dispatch: (action: Action) => Promise<void>;
  begin: () => Promise<void>;
  submit: (report: Report) => Promise<void>;
  flush: () => Promise<boolean>;
};
const GameContext = createContext<GameContextValue | null>(null);
export function GameProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() =>
    loadSave(() => window.localStorage, playableScenario, getSolution()),
  );
  const [save, reduce] = useReducer(gameReducer, initial.save);
  const current = useRef(save);
  const committed = useRef(save);
  const pending = useRef<{ action: Action; expectedId: string | undefined }[]>(
    [],
  );
  const [saved, setSaved] = useState(initial.writable);
  const savedRef = useRef(initial.writable);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [notice, setNotice] = useState(initial.warning);
  const persist = (value = committed.current) => {
    const ok = persistSave(
      () => window.localStorage,
      playableScenario.id,
      value,
    );
    setSaved(ok);
    savedRef.current = ok;
    if (!ok)
      setNotice(
        "保存できませんでした。メモリ上で続行できますが、再読み込みや更新で進行を失う可能性があります。",
      );
    else if (!saved)
      setNotice("保存できるようになりました。進行を保存しました。");
    return ok;
  };
  const sync = (value: GameSave) => {
    current.current = value;
    reduce({ type: "SYNC", save: value });
  };
  const project = () => {
    let view = committed.current;
    for (const item of pending.current) {
      if (
        item.action.type === "NEW" ||
        item.action.type === "SYNC" ||
        view.activeAttempt?.attemptId === item.expectedId
      )
        view = gameReducer(view, item.action);
    }
    sync(view);
  };
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== storageKey(playableScenario.id)) return;
      const latest = loadSave(
        () => window.localStorage,
        playableScenario,
        getSolution(),
      );
      if (latest.warning) setNotice(latest.warning);
      else setNotice("別のタブの進行を同期しました。");
      committed.current = latest.save;
      project();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  const coordinated = async (operation: () => void) => {
    if (navigator.locks)
      await navigator.locks.request(storageKey(playableScenario.id), operation);
    else operation();
  };
  const dispatch = (action: Action): Promise<void> => {
    const expectedId = current.current.activeAttempt?.attemptId;
    const item = { action, expectedId };
    pending.current.push(item);
    // Keep controlled inputs responsive while the browser obtains the cross-tab lock.
    project();
    const run = () =>
      coordinated(() => {
        const latest = loadSave(
          () => window.localStorage,
          playableScenario,
          getSolution(),
        );
        const base =
          savedRef.current && latest.writable ? latest.save : committed.current;
        // The lock serializes submissions across tabs. An old tab cannot edit a new attempt.
        if (
          action.type !== "NEW" &&
          action.type !== "SYNC" &&
          base.activeAttempt?.attemptId !== expectedId
        ) {
          committed.current = base;
          pending.current = pending.current.filter((p) => p !== item);
          project();
          setNotice(
            "別のタブで試行が切り替わりました。現在の進行を表示します。",
          );
          return;
        }
        committed.current = gameReducer(base, action);
        persist();
        pending.current = pending.current.filter((p) => p !== item);
        project();
      });
    const next = queue.current.then(run);
    queue.current = next.catch(() => {
      pending.current = pending.current.filter((p) => p !== item);
      project();
      setNotice("操作を保存できませんでした。もう一度お試しください。");
    });
    return next;
  };
  const begin = () =>
    dispatch({
      type: "NEW",
      attempt: newAttempt(playableScenario, crypto.randomUUID()),
    });
  const submit = async (report: Report) => {
    if (current.current.activeAttempt?.phase !== "investigating") return;
    const normalized = validateReport(report, playableScenario, true);
    await dispatch({
      type: "SUBMIT",
      report: normalized,
      result: gradeReport(normalized, getSolution(), playableScenario),
    });
  };
  const flush = async () => {
    await queue.current;
    let ok = false;
    await coordinated(() => {
      const latest = loadSave(
        () => window.localStorage,
        playableScenario,
        getSolution(),
      );
      if (savedRef.current && latest.writable) committed.current = latest.save;
      ok = persist();
      project();
    });
    return ok;
  };
  return (
    <GameContext.Provider
      value={{ save, saved, notice, dispatch, begin, submit, flush }}
    >
      {children}
    </GameContext.Provider>
  );
}
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("GameProviderがありません");
  return context;
}
