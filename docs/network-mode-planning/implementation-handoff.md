# 次回のネットワーク編実装への引継ぎ

2026-10-07。作者向け、真相・採点資料への参照を含む。今回は原稿のみで実装やJSON変換をしていない。scenarios/net01–05.mdを一冊ずつ独立完成稿として使い、technicalの仕様とレビュー記録を併せて照合する。

## 現在の実装への対応

既にタイトルはベーシック/ネットワーク/セキュリティの3入口を持つ。この5本はネットワークへ所属させる。入口の作り直しや新しい採点モデルは不要。現時点で登録ID/case番号を予約しない。既存11本のID・保存・採点を維持し、正式ID/revisionとregistry/modesを実装時にそろえる。

|原稿の項目|現行の格納先/注意|
|---|---|
|metadata|Scenario.id/title/type/difficulty/estimatedMinutes。type=network。modeはsrc/scenario/modes.tsのメニュー分類|
|正常要件/前提/snapshot|context.baseline/assumptions/snapshotTime。標準原理と架空製品条件を両方公開。調査開始2026-10-07T10:30:00+09:00|
|依頼/人物/会話/内心|Narrative.brief/characters/introDialogue/resultDialogue、roomThought/requestThought/startThought/tabs/evidenceThoughts/reportThought/resultThoughts/retryThoughtへ。公開の『開始前』をroomThought/requestThoughtに合わせて分ける際もヒントを増やさない|
|図の構造|topology.nodes/linksと既存topologyLayouts。短いラベル/詳細アドレス/境界/IF/方向/P点/凡例/文字説明を合わせる|
|Evidence本文|content.blocksのtext/table/logへ**全文**を移す。長いログを概括文だけへ縮めない。source/observedAt/acquisition/nodeIdsを保持|
|原稿kindの意味分類|既存kindはreport/log/config/test/alertだけ。document→report、configuration/routing-table→config、change-record→log、packet-capture/http-trace/access-log/firewall-log/counter→log、dns-result/connectivity/service-check/measurement→test。型の新設不要。分類を変えても本文と取得法は変えない|
|原因/仮説|hypotheses/causeOptionsで同じIDを使う。仮説分類だけで正誤を自動表示しない|
|報告候補|各reportOptionsへ。公開候補の短いlabelと条件を含むdescriptionを用意し、正答だけ長文にならない配置を検証|
|必要数/満点集合|ClaimOption.requiredEvidenceCount、Solution.claimRules.requiredEvidenceSets。原稿requiredAnySetsは同じOR/ANDの記法|
|補助/矛盾|allowedSupportingEvidenceIds/contradictoryEvidenceIds。正常対照を矛盾へ変えない。NET04のC1は4通りの満点集合を保持する。既存engineの満点優先・部分点・矛盾優先をそのまま使う|
|正解/critical/解説|scopeId/causeId/repairId/preventionId/verificationId/criticalOptionIds、causalChain/hypothesisFeedback/optionFeedback/evidenceRolesへ。各解説のEIDを保持|
|辞典/任意ヒント|glossary/hints。通常内心へヒントや作者の役割を移さない。必要3主張/全候補必要数を現在のフォームで示す|

原稿中の作者への編集指示（『掲載順は整理用』『kindは実装時対応』『図を作る』『取得時刻の解釈』『正誤を隠す』等）はゲームの公開本文へコピーしない。公開されるのは業務要件、製品前提、採取条件、図の文字経路、証拠原事実、人物の言葉、候補本文である。採点内部ID、満点集合、feedback、証拠役割、正誤は提出前に混ぜない。

修復はまだ実施していない報告段階。結果dialogueやcausalChainは固定の設定変更前診断を修復後成功へ読み替えない。証拠の閲覧や確認済みチェック、仮説メモ、ヒント利用を得点へ足さない。

## 実装を指示された後の具体的な順序

1. NET01から順に原稿をScenarioとNarrativeへ移す。正式ID/revisionとnetwork所属を登録し、既存11本を変更しない。
2. 事件単位で本文、全10証拠、node/link、IF/IP、hypothesesとcause、全候補、必要数/代替集合/補助/criticalを照合する。
3. SVG図を作る。NET04の左右2枝、NET05の共有回線と内部2キューは特に配置を確認。概要は小画面で一枚の関係が掴める縦型、詳細を拡大で読む。故障箇所を表示しない。
4. 既存validatorと採点の検証を行う。各100点、全代替集合、単独/部分/無関係/余剰非矛盾/誤主張/critical/80点・主張20点の解決閾値を確認。
5. 読了チェック、提出/結果/やり直し、各事件保存復元、mode一覧、BGM/効果音/テーマ/PWAの既存回帰を確認。音やテーマ機能を再実装しない。
6. スマホ幅ではこちらが5枚のネットワーク図を確認する。ゲーム全工程のスマホ通し検証はユーザーが担当するという既存方針を保持。必要なレビューとGit反映、所有者限定配信はその実装タスクとして行う。

## 原稿段階と実装段階の境界

今回のレビュー/文書検査は実装済み画面や実機動作の試験ではない。SVG資産、Scenario/Narrative JSON、正式登録、保存移行、配信は未着手。新しいUI機能、オンライン採点、事件中の設定操作、隠れ証拠、複数真因や新採点ルールは要求しない。
