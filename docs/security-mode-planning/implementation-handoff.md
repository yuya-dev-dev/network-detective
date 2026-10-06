# 次回実装への引継ぎ

2026-10-06。今回の成果物は原稿。コード・登録・保存・配信は変更していない。各完成稿には作者向け真相があるので、プレイヤーは開かずREADMEを使う。

## 既存型への対応

制作上の記法を以下へ移す。名前の読み替えであり、新しい採点ルールや保存形式ではない。

|原稿項目|既存の格納先|移行時の注意|
|---|---|---|
|基本metadata|Scenario.id/title/type/difficulty/estimatedMinutes|SEC番号は仮。正式IDとrevisionは登録時に決める。modeは将来メニュー分類でtypeとは別|
|snapshotAt|Scenario.context.snapshotTime|auditRange/timezoneはcontext.assumptionsへ。snapshot以前に観測・取得した固定資料|
|依頼・正常要件・前提|Scenario.brief/context.baseline/context.assumptions|公知の正常要件を採点でも既知として扱う。作者真相を混ぜない|
|node/link/境界/観測点|Scenario.topologyと図のレイアウト定義|境界・線種・通信方向の意味はSVGと文字説明の両方へ。長い照合値は詳細表示|
|証拠metadata/本文|Evidenceおよびcontent.blocks|取得日時は本文、observedAtは資料の状態/範囲の観測日時。全件なら収録終端、複数イベントなら最後のイベント以後、元イベント時刻は本文。text/table/logへ全文を移す|
|原因・仮説|hypotheses/causeOptions|両方で同じIDとする。掲載順と内部IDで正誤を公開しない|
|全候補・必要数|reportOptions各配列/ClaimOption.requiredEvidenceCount|labelは短い要約、descriptionは条件を省かず保持。必須3主張と各必要数を表示|
|requiredAnySets|requiredEvidenceSets|集合間OR・集合内AND、各集合長は必要数と一致|
|allowedSupporting|allowedSupportingEvidenceIds|部分点の補助証拠。必須要素との重複不要|
|contradictory|contradictoryEvidenceIds|正常対照や無関係を矛盾へ変更しない|
|solution scope/cause/repair/prevention/verification|Solutionの各〜Id|criticalOptionsはcriticalOptionIds。正主張のルールだけをclaimRulesへ|
|個別feedback/6段階解説|optionFeedback/hypothesisFeedback/causalChain|textとevidenceIdsを対応。誤主張にはclaimRulesを設けずfeedbackを用意|
|用語辞典/任意ヒント|glossary/hints|正解を通常内心へ移さない。ヒントは任意で3段階|
|会話・内心・人物|Narrative|待機→roomThought、依頼確認→requestThought、開始→startThought、4タブ→tabs、各資料→evidenceThoughts、提出前→reportThought。導入/結果/再挑戦も既存欄へ|

## 実装を指示された後の順序

1. タイトルのベーシック/ネットワーク/セキュリティ入口と既存6本の所属を、保存互換を保って設計する。ネットワーク側に未制作事件を追加しない。
2. SEC01から5本をScenarioとNarrativeへ移し、本文・証拠・正誤候補・必要数・代替集合を完成稿と突き合わせる。正式ID/revisionとregistryへの登録を揃える。
3. 事件ごとのSVG図を作る。概要は小画面の一枚で関係を掴める配置とし、詳細を拡大して読めるようにする。見かけだけの機器を増やさない。
4. 正解100点、代替集合、部分点、無関係追加、誤主張、critical、解決閾値を既存採点で検証し、参照・件数・保存の回帰を確認する。
5. スマホ幅では図の表示をこちらが確認する。ゲーム全工程のスマホ通し確認はユーザー担当という既存方針で進める。必要なレビュー、Git反映、所有者限定配信はその実装タスクの範囲で行う。

今回は型変換やJSON生成も行わず、原稿レビューだけを完了する。人物の追加証言、隠れ証拠の解禁、異なる真因、厳密な難度昇順、オンライン採点は足さない。
