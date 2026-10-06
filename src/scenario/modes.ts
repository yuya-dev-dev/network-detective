export type GameMode = "basic" | "network" | "security";

// Menu categories are independent of the technical theme of each scenario.
export const modes: { id: GameMode; label: string; description: string; caseIds: string[]; thought: string }[] = [
  { id: "basic", label: "ベーシック", description: "通信とセキュリティの基礎を、6つの事件で。", caseIds: ["case01", "case02", "case03", "case04", "case05", "case06"], thought: "依頼の記録を開こう。ここから、調査が始まる。" },
  { id: "network", label: "ネットワーク", description: "応用情報・午後のネットワーク分野へ。", caseIds: [], thought: "新しい通信調査の依頼が届くまで、ほかの事件に取り掛かろう。" },
  { id: "security", label: "セキュリティ", description: "応用情報・午後のセキュリティ分野へ。", caseIds: ["case07", "case08", "case09", "case10", "case11"], thought: "記録から言えることと、まだ分からないこと。分けて、確かめよう。" },
];
export const isGameMode = (value: string): value is GameMode => modes.some(mode => mode.id === value);
export const modeForCase = (id: string): GameMode => {
  const mode = modes.find(mode => mode.caseIds.includes(id));
  if (!mode) throw new Error(`事件 ${id} のモードが未登録です`);
  return mode.id;
};
export const modeHash = (mode: GameMode) => `#list/${mode}`;
export const listModeFromHash = (hash: string, fallback: GameMode): GameMode => {
  const [screen, mode] = hash.replace(/^#/, "").split("/");
  return screen === "list" && isGameMode(mode) ? mode : fallback;
};
