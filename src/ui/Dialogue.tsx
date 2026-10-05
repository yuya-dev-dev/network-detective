import { useState } from "react";
import type { DialogueLine } from "../scenario/types";

export function Dialogue({ lines, title }: { lines: DialogueLine[]; title: string }) {
  const [index, setIndex] = useState(0);
  const line = lines[index];
  return <section className="paper-card conversation" aria-label={title}>
    <span className="eyebrow">{title}</span>
    <div className="conversation-line" aria-live="polite" aria-atomic="true">
      <strong>{line.speaker}</strong><p>{line.text}</p>
    </div>
    <div className="conversation-controls">
      <button disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="前の発言">←</button>
      <span>{index + 1} / {lines.length}</span>
      <button disabled={index === lines.length - 1} onClick={() => setIndex(index + 1)} aria-label="次の発言">→</button>
    </div>
    <details><summary>会話をまとめて読む</summary>{lines.map((l, i) => <p key={i}><strong>{l.speaker}</strong>：{l.text}</p>)}</details>
  </section>;
}
