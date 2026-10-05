# 確定5稿の実装対応表（作者・開発者用）

2026-10-05。MVP完成後のユーザー指示によって、独立選定・完成稿レビュー済みの5案を実装する。GAME_DESIGN.mdの未完成第2・第3事件案とは別の採用であり、それらを置き換えて正本を改変するものではない。既存case01の文章・証拠・原因・採点は維持する。

## 採用稿とデータ

|確定稿|新しい事件ID|Scenario|Narrative|タイプ/難度|資料数|固有内心数|固定取得時点（JST）|
|---|---|---|---|---|---:|---:|---|
|P01|case02|src/data/case02.json|src/data/narratives/case02.json|network/2|9|17|2026-10-01 20:10|
|P07|case03|src/data/case03.json|src/data/narratives/case03.json|hybrid/2|10|18|2026-10-01 09:20|
|P03|case04|src/data/case04.json|src/data/narratives/case04.json|network/3|11|19|2026-10-01 14:10|
|P08|case05|src/data/case05.json|src/data/narratives/case05.json|hybrid/3|11|19|2026-10-01 09:20|
|P09|case06|src/data/case06.json|src/data/narratives/case06.json|security/3|12|20|2026-10-01 08:30|

難度は題材と推理負荷の表示で、厳密な昇順条件ではない。合計53資料・93固有内心。全資料・診断の存在を開始時から公開する。各稿の8発言の導入・3人の人物説明・解決/再検討各3発言もそのまま格納する。

## 文章と採点の写像

- 依頼本文はScenario.briefとNarrative.briefへ同文で格納。
- 正常要件・経路・通信仕様・固定スナップショットの全内容はcontextへ保持。特にFW方向/戻り状態、同端末IF比較、対象ACL、専用接続/非共有、共通ストア・編集IDの仕様を省かない。
- 各資料の全文はcontent.blocksのtext/logに格納する。ログの順序・数値・識別子・時刻・小数秒を維持し、資料の内心だけをNarrative.evidenceThoughtsへ分離。
- observedAtLabelは稿の括弧内表記をそのまま格納する。区間、小数秒、事前有効、前日、前月、事前仕様の精度をプレイヤーに見せる。observedAtは機械用の代表ISOであり、単点の実測時刻を新たに確定する意味ではない。日付だけの記録は日付の開始を代表値とし、事前仕様は固定取得時点を代表値とする。表示はobservedAtLabelを優先する。
- 候補本文はdescriptionに全文を格納、labelは意味を変えない短い見出し。内部IDは稿と同じ。主張は元の文言をlabel/descriptionへ同文で保持し、requiredEvidenceCountも全正誤候補で保持する。表示で同文を二重に出す場合はUI側で同文descriptionを省いてよい。
- 正答だけが同じ掲載位置に来ないよう候補順を混在化。採点では順序を使用しない。
- solutionの必須OR集合・補助集合・矛盾[]・critical集合をそのまま保持。全15正主張は1又は2資料で満点に達する。満点集合と矛盾なしを満たせば無関係追加も合計2資料以内は10点、部分支持5点、無関係のみ/誤主張0点。
- 100点内訳と解決条件は共通採点ロジックを使用する。追加事件専用の点数や減点は作らない。
- 提出後の説明は元稿の全文を順序どおり6段階に区切ってcausalChainへ保持。作者の未確定段落も第6段階へ原文追記し、確認できない範囲を失わない。新たな観測事実や復旧済み結果を足さない。誤答個別理由は原文をoptionFeedbackとhypothesisFeedbackへ保持。主張正答には成立する全OR集合を示すフィードバックを用意する。作者用役割はsolution.evidenceRolesにだけ置く。
- 3段階ヒントと辞典定義は稿のまま。通常内心からヒントや正解判定を出さない。

Narrativeは既存keysを残し、characters[{name,description}]、introDialogue[{speaker,text}]、resultDialogue{solved:[],reconsider:[]}を追加。導入内心はrequestThoughtへ、構成/証拠/仮説/報告はtabsへ、提出前はreportThoughtへ、結果の2内心はresultThoughtsへ写像する。roomThought/startThoughtは導入内心、retryThoughtは再検討内心を再利用するため固有内心数は増えない。

## 図の技術契約

機器・IP・ノード参照・リンク参照は各Scenario.topologyに定義。配置/領域/折線/アイコン/線種は親実装担当のsrc/ui/topologyLayouts.tsで管理する。型へ余分な配置メタは追加しない。単なる見栄えのため未観測の機器・IP・通信経路・第二原因を追加しない。

|事件|ノードID|リンクID・意味|
|---|---|---|
|case02|N_A,N_B,N_DNS,N_OLD,N_NEW,N_STORE|L_A_DNS/L_B_DNSは名前解決。L_A_OLD/L_B_NEW/L_A_NEWは保存接続の経路。L_OLD_STORE/L_NEW_STOREは同じ共通ストアへの参照|
|case03|N_EXTERNAL,N_MX,N_MTA,N_INTERNAL,N_REMOTE,N_RECEIVE|L_EXTERNAL_MX/L_RECEIVE_MXは外部25受信。L_NAT_MTAは宛先NATのみ。L_INTERNAL_MTAは正規送信。L_MTA_REMOTEは相手への配送と応答|
|case04|N_CLIENT,N_VPN_SITE,N_G,N_FW,N_SERVER|L_CLIENT_SITE/L_VPN/L_G_FW/L_FW_SERVERが連続経路。素材データは逆向き、通知はG→FW→サーバ。直結の代替リンクは追加しない|
|case05|N_CLIENT,N_VPN_IF,N_VPN,N_TEST_IF,N_L3,N_PORTAL,N_IDP|L_CLIENT_VPN_IF/L_CLIENT_TEST_IFは同端末IFの所属関係。L_VPN_IF/L_VPN_PORTALとL_TEST_L3/L_L3_PORTALが別経路。L_CLIENT_IDPは認証記録の関係で、未定義の物理直通路を意味しない|
|case06|N_ED1,N_NAS,N_RC1,N_V07|L_ED1_NAS/L_RC1_NASはNAS通信。L_V07_RC1は別保管からの復元関係であり恒常ネットワーク接続ではない|

図で遮断箇所・正解・証拠の役割を色分けしない。通信線、名前解決、認証関係、IF所属、復元関係を凡例と線種でも区別する。双方向の通信と、転送方向の説明を混同しない。

- case02：DNS問い合わせを保存データの中継経路にしない。新旧は独立DBとして描かず、共通ストアへ並列接続。図からQ11/W11の時点対応を新たに確定しない。
- case03：公開IPはDNAT口、内部MTAと区別。送信元保持。受信25と認証587、中継認可の役割を混ぜない。
- case04：拠点VPN終端の未記載IPを捏造しない。戻りデータとGの通知は実経路に沿って別の矢印/説明にする。
- case05：同じ試験端末の2IFを別端末に変えない。正常図はVPN割当範囲を示し、V31/.50.23の正規実割当や現有効性は資料へ集約。S17登録主体U17/Aの公開対応は保持する。
- case06：U21のグループ所属は資料へ集約。V07の以後接続なしを常設通信線へ変えない。NAS内パスを独立サーバへ描き替えない。

## データ固有検証

tests/unit/new-cases-data.test.tsは、現行assertScenarioとgradeReportを使用しながら、確定した契約を独立の期待値で検証する。

1. 53証拠の全ID・資料全文・観測表示・取得種別・依頼・全候補本文を元稿と照合。
2. 93内心・人物・全導入/締め台詞・全文の6段階説明・全誤答理由・3ヒント・辞典を元稿と照合。
3. 全正主張の必須OR集合/補助/矛盾・誤主張必要数・criticalを固定期待値と照合。
4. 全有効別集合で100点/解決、単独必須+無関係でも100点、部分支持5点、無関係/誤主張0点、原因だけ30点で再検討、危険選択90点で解決不可を実採点関数で検証。

各事件完成時の5テスト、全5事件完成後の計26テストは通過（2026-10-05）。全体typecheckの初回は親のTopology改修中のprops不整合1件で未通過だったが、修正後の再実行は通過した。新データ/テストからの型エラーはない。親の共通実装完成後にbuild/通しUI確認と図の技術再レビューを行う。この時点の26テストはデータと採点の実行検証であり、全アプリの実機/オフライン通しプレイ完了を意味しない。

## 共通UI・図の技術再レビュー

親担当のregistry、選択事件別GameProvider、Narrative検証、台詞UI、観測区間表示、ResultViewを読取り確認した。選択事件IDを保存・ロック・採点に渡し、providerを事件IDで再作成し、旧case01経路を保つ設計は成立する。資料EIDは事件内ローカルであり、内心・用語・結果の参照は選択事件から取得する。作者用solutionは調査コンポーネントのScenarioから分離される。

図の初回指摘は、case06の別保管参照E07→E08、case04のサーバが領域外、case03相手MXの下端見切れと外部領域、case05のIdPが同端末領域内の4点。親による修正後を再読し、全6事件のノード/IP/経路・双方向・関係線・領域は技術的に適合した。遮断/正解の強調や未観測の機器・IPはない。この読取り確認だけではピクセル上の見切れや実機タップ可否は確定しない。

別途、ReportFormの同文主張label/description二重表示、保存失敗時の未着手事件切替、EvidenceViewのkey=value以外の行へ『記録なし』と断定するfallbackを親へ通知した。親による同文description省略、未着手・記録0の事件はflush失敗に妨げられず切替可能にする条件、抽出不能時は原文参照とする文言を再読し、すべて反映を確認した。共通UIについて未解消の技術指摘はない。田中はそのファイルを変更していない。

## 担当境界（範囲の記録）

田中：新規case02〜case06のScenario/Narrative、データ固有テスト、本対応表。親担当：共通型/検証/複数事件ロード/UI/図/状態・保存/ビルド検証。case01、GAME_DESIGN、Git、配信の変更は田中の作業に含めない。
