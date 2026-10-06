# SEC04 港湾夜勤、検品前の完了印

**作者用完成稿・ネタバレあり。** プレイヤー向け依頼・会話・資料と作者向け真相・採点を分ける。feedbackと因果解説は提出後に表示し、候補の内部ID・正誤・作者役割は公開しない。証拠EIDと必要件数は参照できる。今回の制作は文書のみで、実装・正本・配信へ登録しない。

## 作者向け：基本metadata

```yaml
id: SEC04
title: 港湾夜勤、検品前の完了印
mode: security
type: security
difficulty: 3
estimatedMinutes: 24
evidenceCount: 13
noiseCount: 2
snapshotAt: 2026-10-05T18:45:00+09:00
auditRange: 2026-10-05T18:00:00+09:00/2026-10-05T18:45:00+09:00
timezone: Asia/Tokyo
```

各値は架空の表示用識別子。SHA256は64桁の照合値を全文表示する。攻撃コード・実行コマンド・秘密鍵は載せない。menu modeとScenario.typeを混同せず、コードや保存形式は変更しない。

## プレイヤー向け：依頼と導入

### 依頼

港湾の夜勤検品所で、担当者がまだ確認していない票に完了の印が付きました。問題の端末は直前に自動更新を終え、別端末の作業は正常です。貨物は出荷保留にしています。確認していない荷を確認済みとして流さず、手作業の受付や正常な検品を続けられる対処を調べてください。完了欄は担当者の検品フォーム確認で変わり、自動更新は承認された出所・commit・builder・digestに一致する成果物を受け入れる必要があります。台帳、受入、展開、実行、業務監査を読み、起きた変更と影響範囲を報告してください。署名検証と記録を残し、隔離した正常版の確認を経て票と業務を戻す計画をお願いします。

### 人物と声

- 鵜飼：夜勤の検品担当。T74で票I74を扱う。確認していない荷に自分の確認を付けたことにされたくない。言葉は短く、見た事実と行っていない作業をはっきり区切る。
- 滝野：配車調整兼端末運用担当。待つ便へ、待つ理由と再開条件を伝えたい。先を急ぐが、票の印だけで貨物を出すことはしない。
- 調査員：プレイヤー本人。実体と出所、実行と業務結果を分けて読む。一人称の内心を画面下部へ表示する。

### 導入会話（10発話）

鵜飼「I74はまだ検品フォームで確認していません。それなのに完了になった。ここは、はっきりさせたいです」

滝野「T74は18:05に更新を終えています。別のT75は正常に作業中です」

鵜飼「未確認のまま、確認したことにはできません。貨物は保留にしました」

調査員「票を変えた操作と、担当者の確認記録を分けて読みます」

滝野「待つなら待つと伝えます。ただ、全部の端末を止める前に、影響の範囲を知りたい」

鵜飼「手作業で受けることはできます。正常に進んでいる仕事まで、印の問題と一緒にしないでください」

調査員「受入から端末まで、同じものがどう記録されたか確かめます」

滝野「承認台帳と配布の記録を保全しました。戻せる成果物も、隔離して検証できる条件を残しています」

鵜飼「票を戻すときも、担当が見たことは残してください。見ていない分を埋めたくないです」

調査員「正常な検品を維持し、票を是正する手順まで報告します」

### 開始前・開始時の内心

- 待機：（完了の印は、次の仕事を動かす。私は画面の一文字を軽く扱わず、担当が確かめたこととの対応を読み取りたい。）
- 依頼確認：（鵜飼さんは、確認していないと短く言った。私は忙しさのせいと片付けず、何がその印を付けたか記録から辿ろう。）
- 調査開始：（保留には理由が要るし、再開にも条件が要る。私は急ぐ人の声を覚えながら、止める範囲を記録より広くしないで調べよう。）

## プレイヤー向け：正常要件と製品の前提

検品票の完了欄は担当者が検品フォームで確認したときだけ変わる。自動更新は、承認済みrelease manifestのsource repository・commit・builder・digestに一致するartifactだけを受け入れる。署名検証を維持し、依存一覧と展開先台帳で影響範囲を追う。手作業の検品受付は維持でき、古い既知正常artifactは隔離検証後に戻せる。

架空の署名付きprovenanceは、artifactと出所情報の改変検知・署名者識別を保証する。署名された内容が業務の承認releaseであることまで保証しない。BUILD74は複数顧客・複数repoを扱う正規共用ビルド基盤で、正規鍵で署名された未承認repoの出力も存在し得る。基盤や署名鍵の盗難を前提にしない。

SBOMは含まれる依存と版の一覧で、無害や侵害を認定する書類ではない。端末のロードmoduleは実行instanceとmodule digestで対応させ、PIDだけやPIDの再利用を根拠にしない。

18:00〜18:45のmanifest・gate・端末監査は全件、JST同期。全13資料は最初から任意順。診断は同型隔離環境と合成票のみ。本番を操作する診断は行わない。

資料時刻（observedAt）は、その資料の状態・範囲を観測した時刻。全件資料は収録終端、複数イベントは最後のイベント以後を示す。個別の出来事の時刻は本文に残し、「取得」は資料を調査へ揃えた時刻を示す。

## プレイヤー向け：構成図と文字説明

### ノード

|nodeId|概要ラベル|詳細・アドレス|境界|
|---|---|---|---|
|N_APPROVE|承認台帳|10.74.10.14|組織内承認|
|N_SOURCE|正規source|repo.port.example.test / 192.0.2.74|正規source公開領域|
|N_FORK|別source|fork-lab.example.test / 203.0.113.74|別source領域|
|N_BUILD|共用ビルド|build.shared.example.test / 198.51.100.74|共用ビルド・配布|
|N_REG|成果物保管|registry.shared.example.test / 198.51.100.75|共用ビルド・配布|
|N_GATE|更新受入|10.74.20.14|組織内受入|
|N_TERM|検品端末|T74 / 10.74.30.24|業務端末|
|N_FORM|検品処理|10.74.40.14|非公開業務|
|N_LOG|監査保管|10.74.50.14|監査|
|N_LAB|合成票試験|10.74.60.14|隔離試験|

### 矢印と凡例

|linkId|向き|通信・用途|線種|
|---|---|---|---|
|L01|N_SOURCE→N_BUILD|HTTPS/TCP443、正規source取得|実データ流の実線|
|L02|N_FORK→N_BUILD|HTTPS/TCP443、別source取得|実データ流の実線|
|L03|N_BUILD→N_REG|HTTPS/TCP443、artifact/provenance|実データ流の実線|
|L04|N_REG→N_GATE|HTTPS/TCP443、成果物取得|実データ流の実線|
|L05|N_APPROVE→N_GATE|HTTPS/TCP443、承認照合の業務関係|照合の破線|
|L06|N_GATE→N_TERM|HTTPS/TCP443、端末配布|実データ流の実線|
|L07|N_TERM→N_FORM|HTTPS/TCP443、検品業務|実データ流の実線|
|L08|N_TERM→N_LOG|HTTPS/TCP443、端末監査|監査の点線|
|L09|N_GATE→N_LOG|HTTPS/TCP443、受入監査|監査の点線|
|L10|N_REG→N_LAB|HTTPS/TCP443、隔離取得|試験の細線|

source取得・成果物取得の矢印はデータの渡る向き。承認照合のL05は業務上必要な関係で、現在照合が稼働しているかは証拠で読む。N_FORKから端末へ直接の通信線はない。署名はartifact/provenanceの検証関係として別凡例にし、承認照合線とは区別する。

小画面は成果物保管→更新受入→検品端末→検品処理を縦型にし、source・共用ビルド・承認台帳・試験・監査は短いラベルで置く。拡大と文字説明でdigest、境界、取得関係を読む。観測点はgate、端末の展開/実行、業務要求/フォーム監査。

## プレイヤー向け：全証拠本文

### E01 夜勤の検品報告

```yaml
kind: report
acquisition: document
nodeIds: [N_TERM]
source: 夜勤担当の報告保全
observedAt: 2026-10-05T18:25:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

T74で票I74が担当確認前にcompleteとなった。T74の自動更新完了は18:05。別端末T75の現行作業は正常。I74の貨物は出荷保留。

この報告だけで更新物の内容や、すべての端末の影響を確定しない。

内心：（鵜飼さんの「まだ見ていない」は短いが重い。その人の仕事を済んだことにする印を、私は急いで正しいと受け取れない。）

### E02 承認manifest REL74

```yaml
kind: config
acquisition: document
nodeIds: [N_APPROVE]
source: 正常要件・全承認manifest
observedAt: 2026-10-05T18:00:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
release=REL74
package=gate-label v2.6
source_repository=https://repo.port.example.test/gate-label
commit=COM74
builder=BUILD74
artifact_SHA256=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7
業務条件：検品票の完了には担当の検品フォーム確認が必要
```

単に同じpackage・版名を表示するだけでは、このmanifestへの一致を示さない。

内心：（承認という言葉には、照合する値が付いている。私は版の名前だけで覚えず、どの出所と実体を認めた台帳か読もう。）

### E03 DL74の受入記録

```yaml
kind: log
acquisition: document
nodeIds: [N_GATE]
source: 更新gateの全受入監査
observedAt: 2026-10-05T18:45:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
受入イベント時刻=18:04 / 収録範囲=18:00〜18:45
download=DL74
package=gate-label v2.6
artifact_SHA256=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
provenance_subject=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
signature_key=BUILD74 signature=valid
source=https://fork-lab.example.test/gate-label
commit=FORK74 decision=accepted
checked=[signature,subject_digest]
expected_source_check=not_configured
expected_commit_check=not_configured
expected_artifact_check=not_configured
```

受け入れた値と実施した検査を示す。公開資料に原因や重要度を断定する注釈は付けない。

内心：（受け入れたという結果の前に、何を確かめたかが並ぶ。私は有効の一語で読み終わらず、検査の対象まで目を通そう。）

### E04 DL74受入物の保全provenanceと共用ビルド

```yaml
kind: config
acquisition: document
nodeIds: [N_GATE, N_BUILD, N_REG]
source: DL74受入物と添付provenanceの保全控え
observedAt: 2026-10-05T18:04:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
download=DL74
received_artifact_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
subject_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
builder.id=BUILD74
source=fork-lab.example.test/gate-label
commit=FORK74 run=B74
signature_valid=true

REL74から生成した正規成果物もregistryで保全：
digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7
```

DL74で受け入れた実体と添付provenanceの対応を、18:04の受入後に保全した控え。BUILD74はrepo.portとfork-labの双方をビルドする正規共用サービス。同じbuilderによる署名であっても、sourceやcommitが同じとは限らない。誰が別sourceを作成したか、署名鍵が盗まれたかはこの資料で確定しない。

内心：（同じ作り手の札でも、持ち込まれた材料は違うことがある。私は署名者の名前と出所を、同じ欄のように扱わず読もう。）

### E05 展開台帳と実行instance

```yaml
kind: log
acquisition: document
nodeIds: [N_TERM]
source: 対象2端末の全展開台帳
observedAt: 2026-10-05T18:45:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
terminal=T74 download=DL74
installed_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
runtime_module=gate-label
exec_instance=EX74
module_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
started=18:06:00

terminal=T75
installed_digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7
```

18:06に記録した展開・実行情報を、18:00〜18:45の対象2端末の全台帳として確認した資料。展開した実体とロードmoduleをdigestで表示し、実行の区間はEX74で識別する。PIDだけで対応を決めない。

内心：（端末の名前と、そこで動く実体の札が残っている。私は入った版の印象だけで先へ進まず、展開から実行まで対応を読もう。）

### E06 module実行と票更新の相関

```yaml
kind: log
acquisition: document
nodeIds: [N_TERM, N_FORM]
source: 実行module計測・業務要求監査
observedAt: 2026-10-05T18:20:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
instance=EX74
module_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
op=set_status ticket=I74 value=complete request=Q74

server_request=Q74 actor=svc-label terminal=T74 ticket=I74
before=pending after=complete
confirmation_form_id=none
```

このmoduleがQ74を生成したことを計測した記録。actorはサービス主体svc-labelで、実ユーザー主体として表示しない。配布元のdownload識別子はこの資料にはない。

内心：（同じ要求の札が、端末と業務処理をつないでいる。私は誰かが押した姿を勝手に足さず、計測された動作を読み取ろう。）

### E07 業務監査の完全範囲

```yaml
kind: log
acquisition: document
nodeIds: [N_FORM]
source: 票のフォーム・状態更新・出荷監査
observedAt: 2026-10-05T18:45:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
18:00〜18:45 / I74
担当フォーム確認：0件
状態更新：Q74のみ
出荷request：0件
hold=true

T75 / I75：正規担当form=F75でcomplete
```

svc-labelは印字サービス用途で、正常業務は完了更新を要求しない。ただし、この業務APIはそのサービス主体からの更新を受理する既存製品仕様である。サービスの利用可能範囲は更新前から存在し、独立の新しい設定変更として扱わない。

内心：（票の印の後にも、出荷までの状態がある。私は完了を見て運ばれたと決めず、担当の確認と保留の記録を読み分けよう。）

### E08 合成票による挙動対照

```yaml
kind: test
acquisition: diagnostic
nodeIds: [N_LAB]
source: 同型隔離端末・合成票の固定試験
observedAt: 2026-10-05T18:35:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
試験B
digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
作業者フォーム確認=0
合成票X74 status=complete request=TEST74
EX_TEST74の同moduleが要求を生成

試験A
digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7
作業者フォーム確認=0 → pending維持
印字=success
```

本番票を変更せず、合成票のみで実体ごとの挙動を比較する。一般の脆弱性の有無を認定する試験ではない。

内心：（印字ができることと、票の状態が変わることは別に試している。私は合成票の動作を、本番の出荷結果へ置き換えないでおこう。）

### E09 SBOMとasset表

```yaml
kind: config
acquisition: document
nodeIds: [N_REG, N_TERM]
source: 依存一覧・展開asset台帳
observedAt: 2026-10-05T18:07:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
artifact=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4
components：gate-label v2.6 / draw-core v1.9
runtime=T74 role=print

T75 artifact=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7
同じpackage版表記でも別artifact

draw-core advisory=DC-19
対象版：v1.8以下
両artifactのdraw-core v1.9：対象外
```

依存と版は実体を読むための台帳で、この一覧だけでI74を変更した実行者は決まらない。

内心：（見覚えのある警告名に、目が止まりそうになる。私は一覧の用途を忘れず、対象版と端末の札を落ち着いて読み取ろう。）

### E10 稼働gate policyと受入試験

```yaml
kind: config
acquisition: document
nodeIds: [N_GATE]
source: gate稼働policy・固定受入比較
observedAt: 2026-10-05T18:36:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

```text
稼働設定：18:02の保存値
verify signature_key=BUILD74
digest matches provenance
source allowlist=disabled
release manifest digest pin=disabled

固定受入比較：18:36採取
同じpolicyの固定受入試験：
REL74 artifact A=accepted
FORK74 artifact B=accepted

source/commit/digest照合の合成検査：
artifact A=accepted
artifact B=rejected
```

ここでAはREL74のa7反復digest、BはFORK74のb4反復digestとして、E02〜E04と同じ実体を表す。合成検査は本番gateを修復した後のログではない。

内心：（通す条件には、設定と試験の両方が残っている。私は受け入れた結果だけを承認と読まず、どの値を検査する条件か確かめよう。）

### E11 復旧と業務継続の制約

```yaml
kind: config
acquisition: document
nodeIds: [N_TERM, N_LAB]
source: 保全・封じ込め・復旧可能条件
observedAt: 2026-10-05T18:40:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

保全後、T74への配布と印字serviceを停止し、業務APIへのそのservice要求を遮断できる。正常T75と手作業検品は維持できる。正規artifact Aは隔離試験を経て復元可能。

端末だけを戻しても、自動更新gateを止めなければBが再配布される恐れがある。票I74は担当者の確認で正しい状態へ是正する必要がある。この資料は制約と計画で、実施結果は含まない。

内心：（戻せるという条件があっても、まだ戻したことにはならない。私は配布と業務の両方を見て、再開までに必要な仕事を残そう。）

### E12 気象モニターの欠測

```yaml
kind: alert
acquisition: document
nodeIds: [N_LOG]
source: 別回線の気象モニター記録
observedAt: 2026-10-05T17:05:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

風速表示が17:00に欠測し、17:05に回復。気象モニターは別回線で、検品票や成果物配布の依存先ではない。

内心：（港の画面の警告でも、全部が同じ系統とは限らない。私は風の話へ気を取られすぎず、対象と回復時刻を記録で確かめよう。）

### E13 休憩室掲示アプリの更新予定

```yaml
kind: config
acquisition: document
nodeIds: [N_REG]
source: 前日の別アプリ更新予定
observedAt: 2026-10-04T16:00:00+09:00
```

取得：2026-10-05T18:45:00+09:00。保全済み資料として提示。

休憩室掲示アプリbreak-board v4.0の更新予定。対象はT_BREAKだけ。gate-labelの配布と検品APIは別系統で、今回の調査時間にこのアプリの展開はない。

内心：（更新という言葉が並ぶと、同じ作業へまとめたくなる。私は端末とアプリの名前を読み、今日のどの記録かを分けておこう。）

## プレイヤー向け：画面内心と支援

### 4タブ・提出前

- 構成：（台帳から現場まで、渡るものと照合する関係がある。私は線の種類を読み、別sourceが端末へ直に入ったと思い込まないでおこう。）
- 証拠：（同じ版の文字でも、同じ実体とはまだ言えない。私は長い値を面倒と飛ばさず、記録に付いた札として対応を確かめよう。）
- 仮説：（怪しいという印象だけで、票を変えた説明になるだろうか。私は出所の話と実行の記録を分け、根拠で言える範囲を整えよう。）
- 報告：（待つ便には、再開の条件も伝える必要がある。私は直す設定だけで終わらず、担当の検品と正常な作業を戻す手順を書こう。）
- 提出前：（全端末が同じことになったと、記録より広く書いていないだろうか。私は票と出荷の状態を読み直し、保全の工程も残そう。）

### 任意ヒント

1. packageや版名の次に、実体を識別するdigestを確認する。署名の有効性と業務承認は別の条件。
2. DL74・EX74・Q74を、受入・展開・実行・票更新の記録で照合する。実行instanceとmodule digestを一緒に読む。
3. 承認manifest、実provenance、gateが実施する検査を比べる。正常artifactの隔離対照と、フォーム・出荷の全件範囲も確認する。

### 一般用語辞典

|用語|説明|
|---|---|
|artifact|ビルド等で生成され、配布・実行する成果物|
|digest|データの内容を照合するための値。同じ版名と同じ内容は区別する|
|SHA256|内容の照合値を計算するハッシュ関数の一つ。通常は64桁の16進表記を使う|
|コード署名|署名者との対応と成果物等の改変を検証する仕組み。業務用途の承認とは別の判断|
|provenance|成果物の出所、材料、ビルド主体等の来歴を示す情報|
|source repository|ビルドに用いるソースを保管する場所|
|commit|repository内の変更状態を識別する値|
|builder|ビルドを実施する基盤・主体|
|release manifest|配布を承認した成果物等の条件・識別値を記録する台帳|
|SBOM|含まれるソフトウェア部品と版などの一覧。侵害や無害を直接認定する資料ではない|
|実行instance|一回の実行を区別する識別単位。PIDの数字だけとは区別する|
|封じ込め|影響が続いたり広がったりする操作・通信・配布を必要な範囲で制限すること|
|最小権限|仕事に必要な操作・対象に権限を限定する考え方|

辞典から本件の正解や満点集合を教えない。実体を受け入れた原因と、権限の一般的な防止課題は混同しない。

## プレイヤー向け：結果と再挑戦

### 解決判定後（5発話）

鵜飼「確認していない票を、確認したことにせず戻せます。是正するときは担当として確かめます」

滝野「正常な作業を残し、この計画で配布と端末を封じ込めます。待つ理由も伝えます」

調査員「保全してから戻し、実行する実体と業務の挙動を確認してください。出荷承認も担当の確認を経ます」

鵜飼「印字が出るだけでは、検品を済ませたことにはしません」

滝野「本番の対応はこれからです。再開条件を確かめ、結果を記録に残します」

解決内心：（完了の印へ、担当の確認を戻す手順が書けた。私は便を急いで出す言葉より、正常に再開する条件を現場へ渡そう。）

### 再検討判定後（5発話）

鵜飼「I74は保留です。担当確認していないことは、報告から落とさないでください」

滝野「受け入れた成果物と端末の記録は残しています。消して配り直す作業はしません」

調査員「出所と実体、実行と票の変更を読み直します。署名の結果だけで承認した説明にしないようにします」

滝野「T75と手作業を残す条件も、計画へ入れてください」

調査員「影響の範囲と再開確認を揃え、報告を組み直します」

再検討内心：（長い値より見慣れた版名に頼ったかもしれない。私は記録の札へ戻り、まだ結べていない来歴と動作を確かめ直そう。）

再挑戦内心：（夜勤の仕事は続いている。私は待つ時間に焦って根拠を飛ばさず、保全された台帳と実行の記録をもう一度読み始めよう。）

## 作者向け：真相と未確認の境界

単一根本原因は受入gateが承認source/commit/artifact digestを照合せず、builder署名とsubject digest一致だけで別出所成果物Bを受け入れたこと。正規共用BUILD74は別repoの出力も署名でき、署名validを業務承認とみなせない。DL74で受け入れたBがT74へ展開され、EX74の同digest moduleがQ74を生成し、担当フォームなしでI74をcompleteにした。

印字サービスの広い既存権限は製品の前提。gateの未承認実体受入と別の新しい原因にして二重回答を要求しない。他moduleでも可能な権限リスクは最小権限化・挙動回帰の防止課題として示す。取込と実行は一つの同じartifactであり、別の隠れ侵入経路を追加しない。

確認した影響は票の無承認状態変更と出荷保留。FORK74作成者・動機、他日時の被害、署名鍵の侵害、外部漏えいは未確認。怪しい宛先や脆弱版の存在だけで侵害を確定しない。

## 作者向け：全報告候補と個別feedback

仮説と原因の内部IDは同じ。候補は正誤を混在し同程度の短文で表示する。ID・正誤・掲載順で正答を教えない。feedbackは提出後にEID付きで表示する。

### 範囲（10点）

|内部ID|候補本文|得点|critical|個別feedback|
|---|---|---:|---|---|
|S_T74|T74の未承認artifactがI74を担当フォームなしにcompleteへ変更し、貨物は出荷保留の範囲とする|10|false|展開BとEX74がQ74の生成に対応する（E05/E06）。I74の確認0、更新Q74のみ、出荷0/hold=trueで、物理出荷とは区別できる（E07）|
|S_ALL|港内の全端末で全検品票が改変されたと捉え、正常作業の票も含めて全系統の状態変更被害として報告する|0|false|対象2端末の展開はT74=B/T75=A（E05）。T75のI75は正規担当確認による完了で（E07）、全端末・全票の改変へ広げる根拠がない|
|S_LEAK|票の完了更新を外部への荷主データ流出の実証と捉え、外部に送信・取得された被害として報告する|0|false|確認した操作はQ74の票状態更新と出荷保留（E06/E07）。外部漏えいを実証する通信・取得記録はなく、状態変更から流出を断定している|

### 原因・仮説（30点）

|内部ID|候補本文|得点|critical|個別feedback|
|---|---|---:|---|---|
|H_GATE|承認source・commit・digestを確認しない受入gateが、署名された別出所artifactを更新物として配布した|30|false|REL74の期待値とDL74又は保全provenanceが異なる（E02/E03/E04）。gateは署名とsubjectだけを検査し、承認source/commit/digestを照合しない（E03/E10）|
|H_EDIT|担当者が正常な検品フォームを使ってI74の完了を確認し、その正規入力が画面の状態を変更した|0|false|Q74はEX74のmoduleが生成し、confirmation_form_id=none（E06）。I74の全期間フォーム確認は0件（E07）。正規担当入力ではない|
|H_TRANSIT|受信後の通信改変で成果物の署名が壊れ、壊れた更新物が端末で票を変更した|0|false|受入artifactとprovenance_subjectは同digestで、署名はvalid（E03/E04）。署名が壊れた通信改変という説明に一致せず、承認との不一致は別問題|
|H_DRAW|draw-coreの既知脆弱性DC-19が使われ、その部品の問題でI74の完了状態が更新された|0|false|DC-19の対象はv1.8以下で両artifactのv1.9は対象外（E09）。Q74はgate-labelの計測実行に対応し（E06）、実体ごとの挙動対照もある（E08）|
|H_DB|DBが端末からの変更要求とは無関係に、自発的にI74の状態をcompleteへ更新した|0|false|端末moduleのQ74とサーバのQ74が一致する（E06）。期間内の状態更新はQ74だけ（E07）。要求と無関係な自発更新という説明にはならない|

### 主張（3枚必須・各10点）

|内部ID|候補本文|必要数|個別feedback|
|---|---|---:|---|
|C_MISMATCH|REL74が承認したsource・commit・digestと、受入DL74のartifact情報が不一致である|2|承認期待値E02を、今回値E03又は同じartifactのprovenance E04と比較する。gate設定E10だけではREL74の全期待値と今回値の比較が不足|
|C_EXEC|T74へ配布したartifact Bが、EX74でI74の完了変更要求を生成した|2|DL74からT74への展開とEX74を示すE05を、同instance/digestのQ74生成E06へ結ぶ。実行だけでは配布の来歴を示さず、隔離E08だけでは本番の対応は未完成|
|C_HOLD|18:00〜18:45の全業務監査で、I74の更新はQ74のみ、担当フォーム確認0件、出荷0件・保留と確認できる|1|E07が期間全体のフォーム・更新・出荷の全業務監査を示すため一枚で成立する。申告E01とmodule計測E06は補助で、E01+E06ではこの全期間の監査を提示していないため5点|
|F_SIGN|成果物の署名がvalidなら、組織が承認したreleaseと同じものとして配布してよい|1|承認値と署名validの別source/digestが一致しない（E02/E03）。正規共用builderの署名が業務承認を代替するわけではない（E04）|
|F_VERSION|SBOMのpackage版名が同じなら、端末で動くartifactも同一実体と判断できる|2|同じ版表記でもT74とT75のdigestは異なる（E05/E09）。依存一覧・版名だけで内容同一は示せない|
|F_EXFIL|検品票がcompleteへ変わった事実だけで、荷主データの外部漏えいが確定する|1|E06/E07は票の更新と業務状態を示す。外部送信や取得を示さず、完了更新だけで流出を確定できない|

### 修復（10点）

|内部ID|候補本文|得点|critical|個別feedback|
|---|---|---:|---|---|
|R_QUAR|配布物・provenance・監査・端末状態を保全しT74と配布を封じ込め、業務APIへの該当service要求を遮断する。承認照合を復旧しAを隔離検証して戻し、I74を担当確認で是正、T75と手作業を維持する|10|false|端末とgateの両方を封じ込め、再配布を防ぐ必要がある（E10/E11）。正常Aの対照と業務継続条件を使い（E08/E11）、I74の状態を担当確認で是正する。作業は実施予定|
|R_SIGN|BUILD74の署名がvalidであることを再確認し、現在の成果物Bを更新物として再配布する。source・commit・承認digestとの照合は増やさず、端末の再更新で業務を戻す|0|false|Bの署名はすでにvalidでもREL74と不一致（E02/E03）。署名再確認だけで受入条件は直らず、同じ挙動のBを再配布する（E08/E10）|
|R_WIPE|保全前に全端末を初期化し、受入・実行・票変更の監査を消去して一斉に更新し直す。正常端末の状態も破棄し、記録を残さないことを復旧の条件にする|0|true|配布から実行・業務更新への立証記録と正常状態を失う危険操作（E03〜E07）。E11の保全後・対象限定の封じ込め条件にも反し、gateの不一致を直さない|

### 再発防止（10点）

|内部ID|候補本文|得点|critical|個別feedback|
|---|---|---:|---|---|
|P_SOURCE|承認source・commit・builder・digestを照合し、変更を複数者で承認する。SBOMと展開台帳を管理し、service権限の最小化とrelease挙動の回帰試験を継続する|10|false|承認実体と出所をgateで照合する（E02/E10）。依存・展開・実行の台帳と挙動対照も確認する（E05/E08/E09）。広いservice権限は更新前からの条件で、同じ条件でもA/Bの挙動が異なる。再発防止ではその権限も最小化する（E07/E08）|
|P_SBOM|SBOMを生成して依存と版名を記録し、その一覧が作られた成果物は自動承認する。出所・commit・承認digestは比較せず、部品一覧の有無で更新を許可する|0|false|SBOMがあるBでも今回の変更が起きている（E06/E09）。依存一覧は業務承認を証明せず、出所・実体の照合が不足する（E02/E10）|
|P_OFF|署名検証を恒久的に停止し、検証エラーで作業が止まらない更新運用にする。出所や実体の確認も署名を使わず、届いた成果物をそのまま配布する|0|true|改変検知と署名者識別を捨てる危険操作。必要なのは署名検証の維持と承認条件の追加照合であり（E02/E10）、検証停止では受入の不備を防げない|

### 確認（10点）

|内部ID|候補本文|得点|critical|個別feedback|
|---|---|---:|---|---|
|V_RELEASE|gateでB拒否/A許可、T74実行digest A、フォームなし完了更新0と正規確認成功を確認する。I74の是正と出荷承認、T75維持、該当serviceの不正要求拒否も確認する|10|false|受入の拒否/許可、端末実体、業務挙動を分けて確認する（E08/E10/E11）。I74は担当確認と出荷承認を経る。固定資料から実施済みとはしない|
|V_HASH|registry内の成果物Bのhashがprovenanceのsubjectと一致することを確認する。その一致を復旧完了とし、承認manifestや端末の実体、票の確認動作は追加で試さない|0|false|Bは元からsubject digestが一致して受け入れられている（E03）。一致は承認REL74との一致や正常な検品を示さず、gate・端末・業務の確認が不足（E02/E08/E10）|
|V_PRINT|印字serviceで紙の出力が得られれば復旧完了とし、票の完了欄や担当確認、配布の拒否条件は確認しない。印字成功を正常検品と同じ判定として作業を再開する|0|false|印字の成否とフォームなし状態更新は別の試験項目（E08）。印字だけでは承認外Bの拒否、I74是正、担当確認と出荷承認を確認できない（E10/E11）|

## 作者向け：採点集合・解決条件

```text
solution:
  scope: S_T74
  cause: H_GATE
  claims: [C_MISMATCH,C_EXEC,C_HOLD]
  repair: R_QUAR
  prevention: P_SOURCE
  verification: V_RELEASE
criticalOptions: [R_WIPE,P_OFF]

C_MISMATCH:
  requiredEvidenceCount: 2
  requiredAnySets: [[E02,E03],[E02,E04]]
  allowedSupporting: [E10]
  contradictory: []
C_EXEC:
  requiredEvidenceCount: 2
  requiredAnySets: [[E05,E06]]
  allowedSupporting: [E08]
  contradictory: []
C_HOLD:
  requiredEvidenceCount: 1
  requiredAnySets: [[E07]]
  allowedSupporting: [E01,E06]
  contradictory: []
F_SIGN: requiredEvidenceCount=1 / false claim / score=0
F_VERSION: requiredEvidenceCount=2 / false claim / score=0
F_EXFIL: requiredEvidenceCount=1 / false claim / score=0
```

配点は範囲10・原因30・主張3枚×10・修復10・再発防止10・確認10＝100。主張3枚必須、各1〜2件の根拠。必要数2に満たない1件でも提出可能。補助を含めカードごとの合計は最大2件。

集合間OR・集合内ANDを満たし、矛盾がなければ10点。必須要素の一部又はallowedSupportingだけなら5点。矛盾を含む、無関係だけ、誤主張は0点。矛盾を優先するが正主張はすべてcontradictory=[]。ノイズや正常対照を矛盾へ便宜的に分類しない。

満点集合と無関係な根拠を同時に選んでも、非矛盾で計2件以内は10点。C_HOLDは一枚満点なので追加一枚可。他の満点集合は二枚で三枚目不可。例：C_MISMATCHのE02+E03又はE02+E04は10点、E02だけ又はE10だけは5点、E12だけは0点。C_EXECのE05+E06は10点、E08だけは5点。C_HOLDのE07又はE07+E12は10点、E01だけ又はE01+E06は5点。補助ペアは申告とmodule計測であり、主張が要求する18:00〜18:45の全業務監査を示さない。F_SIGNにE03を付けても0点。

原因・修復・確認正解、主張根拠20点以上、総点80点以上、criticalなしで解決。R_WIPE/P_OFFだけcritical=true、他はfalse。隠れ減点や新しい証拠解禁はない。結果会話は実施予定の手順を渡す段階で、架空の復旧後ログを足さない。

## 採点後に表示する6段階解説

### 1 症状

T74のI74が担当確認前にcompleteになり、直前には自動更新が完了しています。別T75は正常で、I74の貨物は保留です（E01）。更新の時刻だけで原因を決めず、配布された実体と業務の変更を照合します。

### 2 確認した事実

承認REL74は正規repo/COM74/BUILD74とa7反復digestの成果物です（E02）。DL74の受入物はfork-lab/FORK74/b4反復digestで、署名はBUILD74によりvalidです（E03/E04）。それがT74へ展開されEX74でロードされ（E05）、同instance/digestのmoduleがQ74を生成してI74をcompleteへ変えています（E06）。

### 3 残る原因

18:00〜18:45の全業務監査では、I74のフォーム確認0件、更新Q74のみ、出荷0件・保留と確認できます（E07）。担当申告とmodule計測は参考ですが、それらだけではこの全期間の監査を示しません（E01/E06）。署名が壊れた通信改変ではなく（E03/E04）、draw-coreのDC-19対象版でもありません（E09）。DBの自発変更でもなく要求Q74に対応します（E06）。隔離合成票はBでフォームなし更新、Aではpending維持と正常印字を示します（E08）。

### 4 要件と実設定の不一致

承認された出所・commit・builder・digestに一致するartifactだけを受け入れる要件に対し（E02）、gateはbuilder署名とsubject digest一致しか確認していません。承認source/commit/artifact照合は未設定です（E03/E10）。共用builderは別repoも正規に署名できるため、署名validを業務承認として別実体Bを受け入れたことが根本原因です（E04）。広いservice権限は更新前から存在し、同じ権限条件でも正常AとBでは挙動が異なります。再発防止ではこの権限も必要な操作へ限定します（E07/E08）。

### 5 対策

配布物、provenance、監査、端末状態を保全し、T74と自動配布を封じ込めます。業務APIへの該当service要求を遮断し、承認照合をgateへ戻します。Aを隔離検証して復元し、I74を担当確認で正しい状態へ是正します。T75と手作業検品は維持します（E08/E10/E11）。端末だけ戻してgateを残すとB再配布の恐れがあります（E11）。

### 6 確認

今後の作業後は、B拒否/A許可、T74の実行digest A、フォームなし完了更新0、正規担当確認成功を確認します。I74の是正と出荷承認、T75の正常継続、該当serviceの不正要求拒否も確かめます（E08/E10/E11）。署名やregistry内hashの一致、印字だけで完了とはしません。確認した範囲は票の状態変更で、作者の身元や外部漏えいは未確認です。

## 作者向け：全証拠の役割

|EID|役割と限界|
|---|---|
|E01|夜勤症状・更新時刻・正常端末・保留の申告。C_HOLD補助で、期間全業務監査ではない|
|E02|承認source/commit/builder/digestと業務要件。C_MISMATCH期待値|
|E03|DL74の実体・受入検査・valid署名。C_MISMATCH今回値|
|E04|DL74受入物と添付provenanceの対応控え、共用builder、正規A保全。C_MISMATCHの代替今回値|
|E05|DL74→T74の展開、EX74とmodule digest。C_EXECの来歴側|
|E06|EX74が生成したQ74と業務更新の計測。C_EXEC実行側、C_HOLD補助で、期間全業務監査ではない|
|E07|18:00〜18:45の全業務監査。I74の更新Q74のみ、フォーム0、出荷0・保留のC_HOLD一枚立証。広い既存権限は防止課題|
|E08|合成票のB/A挙動対照。C_EXEC補助、本番修復結果ではない|
|E09|依存・asset・advisory範囲。版名同一説/既知脆弱性説の反証|
|E10|gateの現在値と固定比較。C_MISMATCH補助、根本原因の受入条件|
|E11|保全後の封じ込め・復元・業務維持制約。実施結果は含まない|
|E12|別回線・早い時刻の気象欠測。検品/配布に依存しないノイズ|
|E13|前日の別アプリ・別端末更新予定。今回展開なしのノイズ|

作者役割を通常の内心へ出さない。途中会話は他資料既読を前提にせず、新人物の隠れ証言・分岐解禁・新しい侵入事実を追加しない。
