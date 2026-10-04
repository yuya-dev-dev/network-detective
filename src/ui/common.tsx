import { useEffect, useRef, type ReactNode } from "react";
import type { Explanation, PlayableScenario } from "../scenario/types";
export function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  useEffect(() => {
    const onNavigate = () => {
      ref.current?.close();
      closeRef.current();
    };
    window.addEventListener("hashchange", onNavigate);
    return () => window.removeEventListener("hashchange", onNavigate);
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-label={title}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button onClick={close} aria-label="閉じる">
          ×
        </button>
      </div>
      {children}
      <button className="primary wide" onClick={close}>
        閉じる
      </button>
    </dialog>
  );
}
export function EvidenceRefs({
  ids,
  open,
}: {
  ids: string[];
  open: (id: string) => void;
}) {
  return (
    <div className="evidence-refs">
      {ids.map((id) => (
        <button
          key={id}
          onClick={() => open(id)}
          aria-label={`${id}の証拠を見る`}
        >
          {id} ↗
        </button>
      ))}
    </div>
  );
}
export function ExplanationCard({
  item,
  open,
}: {
  item: Explanation;
  open: (id: string) => void;
}) {
  return (
    <div className="explanation-card">
      <p>{item.text}</p>
      <EvidenceRefs ids={item.evidenceIds} open={open} />
    </div>
  );
}
export function Glossary({
  scenario,
  close,
}: {
  scenario: PlayableScenario;
  close: () => void;
}) {
  return (
    <Dialog title="用語辞典" close={close}>
      <p className="muted">いつでも確認できます。得点には影響しません。</p>
      <dl className="glossary">
        {scenario.glossary.map((g) => (
          <div key={g.term}>
            <dt>{g.term}</dt>
            <dd>{g.definition}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
export function InnerVoice({ text }: { text: string }) {
  return (
    <aside className="inner-voice" aria-label="主人公の心の声">
      <span className="voice-label">調査員・心の声</span>
      <p aria-live="polite">{text}</p>
      <span className="voice-arrow" aria-hidden="true">
        ◆
      </span>
    </aside>
  );
}
export function TabIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {name === "topology" ? (
        <>
          <rect x="8" y="2" width="8" height="6" rx="1" />
          <path d="M12 8v5M4 13h16M4 13v3M20 13v3" />
          <rect x="1" y="16" width="6" height="6" rx="1" />
          <rect x="17" y="16" width="6" height="6" rx="1" />
        </>
      ) : name === "evidence" ? (
        <>
          <path d="M5 3h11l4 4v14H5zM16 3v5h4M8 12h9M8 16h6" />
        </>
      ) : name === "hypotheses" ? (
        <>
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 7 7M9 6v4M9 12v1" />
        </>
      ) : (
        <>
          <path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3" />
        </>
      )}
    </svg>
  );
}
