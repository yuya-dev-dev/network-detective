import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Explanation, PlayableScenario } from "../scenario/types";
import studyGlossary from "../data/study-glossary.json";
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
type GlossaryEntry = {
  term: string;
  definition: string;
  ports?: string;
  note?: string;
  aliases?: string;
};
export function Glossary({
  scenario,
  close,
}: {
  scenario: PlayableScenario;
  close: () => void;
}) {
  const [section, setSection] = useState<"ports" | "security" | "case">(
    "ports",
  );
  const [query, setQuery] = useState("");
  const sections = [
    { id: "ports" as const, label: "ポート番号", entries: studyGlossary.ports },
    {
      id: "security" as const,
      label: "セキュリティ",
      entries: studyGlossary.security,
    },
    { id: "case" as const, label: "この事件", entries: scenario.glossary },
  ];
  const normalize = (text: string) =>
    text.normalize("NFKC").toLowerCase().replace(/\s/g, "");
  const search = normalize(query);
  // Search across sections so a port, acronym, or Japanese synonym is easy to find.
  const groups = sections
    .filter((group) => search || group.id === section)
    .map((group) => ({
      ...group,
      entries: (group.entries as GlossaryEntry[]).filter(
        (entry) =>
          !search ||
          normalize(
            [
              entry.term,
              entry.definition,
              entry.ports,
              entry.note,
              entry.aliases,
            ].join(" "),
          ).includes(search),
      ),
    }))
    .filter((group) => group.entries.length);
  const count = groups.reduce(
    (total, group) => total + group.entries.length,
    0,
  );
  return (
    <Dialog title="用語辞典" close={close}>
      <p className="muted">いつでも確認できます。得点には影響しません。</p>
      <div className="glossary-tools">
        <label className="glossary-search">
          用語・番号を検索
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="FTP・161・最小権限など"
          />
        </label>
        <nav className="glossary-sections" aria-label="用語の分類">
          {sections.map((group) => (
            <button
              key={group.id}
              aria-pressed={!search && section === group.id}
              onClick={() => {
                setSection(group.id);
                setQuery("");
              }}
            >
              {group.label}
            </button>
          ))}
        </nav>
      </div>
      <p className="muted glossary-caption" role="status">
        {search
          ? "全分類の検索結果"
          : sections.find((group) => group.id === section)!.label}{" "}
        · {count}件
      </p>
      {!search && section === "ports" && (
        <p className="muted">
          代表的な標準ポートです。問題文に別の設定があれば、その条件を優先します。送信元と宛先を区別して読みましょう。
        </p>
      )}
      {!search && section === "security" && (
        <p className="muted">
          基本用語を短くまとめています。記述問題では、問われた対象と文脈に合わせて説明します。
        </p>
      )}
      {count === 0 && (
        <p>一致する用語がありません。略語や別の表記でも検索できます。</p>
      )}
      {groups.map((group) => (
        <section key={group.id} aria-label={group.label + "の用語"}>
          {search && <h3>{group.label}</h3>}
          <dl className="glossary">
            {group.entries.map((entry) => (
              <div key={entry.term}>
                <dt>{entry.term}</dt>
                {entry.ports && (
                  <dd className="glossary-port">{entry.ports}</dd>
                )}
                <dd>{entry.definition}</dd>
                {entry.note && <dd className="glossary-note">{entry.note}</dd>}
              </div>
            ))}
          </dl>
        </section>
      ))}
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
