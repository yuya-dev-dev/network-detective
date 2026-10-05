# 追加5事件の実装と検証

2026-10-05。第1事件を維持し、完成原稿P01/P07/P03/P08/P09を第2〜6事件として実装。旧GAME_DESIGN.mdの将来案とは区別する。作者向け内容は[実装対応表](scenario-planning/implementation-map.md)に記載。解答の確認が不要な場合はゲーム画面から遊ぶこと。

## 構成

- scenario/registry.ts: 全6事件の登録、事件ごとの内心・会話、解答を分けてロード。load.tsの第1事件エクスポートは互換維持。
- GameProvider: 選択事件を受け取り、事件IDの保存キー・ロック・採点条件を使う。切替時にproviderを作り直す。保存不能で進行があるときは切替前の保存を必須とし、メモリ上の進行の無断破棄を避ける。未着手なら保存領域がなくても他事件を開始できる。
- 旧第1事件のハッシュとセーブ形式を維持。追加事件は #case02/investigation/topology などのハッシュを使用。
- JSON: 53資料、93内心、導入各8発言、提出後会話、ヒント、辞典、6段階解説、個別選択の説明を原稿どおり保持。
- Evidence.observedAtLabel: 時間区間・小数秒・事前資料などの元の表記を優先表示。機械用ISO代表値を新たな観測と誤表示しない。
- topologyLayouts.ts: 6件の専用SVG配置。機器記号、境界、ポート、IF、通常通信と所属/資料の関係を分ける。遮断箇所や推理の正解を図へ追加しない。
- Dialogue: 一発言ずつ読み進め、全文も開ける。調査開始を会話読了で制限しない。

## 検証

- シナリオ契約・型チェック・本番ビルド：成功。PWA圧縮資産約715.5 KiB。
- 単体テスト81件：成功。正解証拠の全別集合・部分点・0点・危険操作、JSONと完成稿の全文一致、事件別保存、旧URL互換など。
- PC Chromiumの機能E2E26件：成功。追加5本の全資料→提出→解説→再読込み、会話、事件間保存、全6事件のオフライン資産、更新、既存事件の回帰。
- スマホ相当Chromium/WebKitの構成図E2E12件：成功。幅360/390/430、図の文字の見切れ、画面内の全体表示、拡大スクロール、全機器の詳細。
- [構成図サンプル](screenshots/episodes/index.html)：390×844px、全6件を目視確認。

ユーザーの指示により、追加事件のスマホ実機での通しプレイはユーザーが担当。エミュレーションの確認を実機確認と扱わない。

実行コマンド例：

```sh
npm test
npm run build
node node_modules/playwright/cli.js test maps.spec.ts --output=test-results/maps --reporter=line
node node_modules/playwright/cli.js test --project=chromium-desktop --grep-invert=phone --output=test-results/desktop --reporter=line
node node_modules/tsx/dist/cli.mjs scripts/capture-topologies.ts
```

古いtest-resultsに残る無関係の大きなファイルの削除待ちを避け、今回の出力先を個別に指定している。テスト結果ディレクトリはGit対象外。
