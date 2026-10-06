# SEC04 技術引継ぎ：更新した夜だけ、検品票が先に閉じる

作者用・真相あり。主担当確定版。security / 難度3 / 24分 / 13証拠・ノイズ2。港湾夜勤検品所。アプリ更新を入口に、署名/出所/実行/業務影響を別々に照合する。脆弱版があるだけ、怪しい宛先へ接続しただけで侵害確定にしない。

## 正常要件・技術前提

検品票の完了欄は担当者が検品フォームで確認したときだけ変わる。自動更新は承認済release manifestのsource repository/commit/builder/digestに一致するartifactのみ。署名検証を維持、依存一覧と展開先台帳で影響範囲を追える。検品の手作業受付は維持できる。古い既知正常artifactは隔離検証後に戻せる。
架空の署名付きprovenance：署名はartifactと出所情報の改変検知/署名者の識別を保証し、署名者が生成した内容が業務承認済みであるとは保証しない。ビルド基盤BUILD74は複数顧客/複数repoをビルドする正規共用基盤。正規鍵で署名された未承認repoの出力も存在し得る。基盤/署名鍵の盗難は今回証拠では断定しない。根本原因は受入gateがsource/commit照合をせずbuilder署名だけを承認と扱ったこと。取込・端末実行は一つの同じartifact。SBOMは含まれる依存と版を記録するが、無害/侵害を認定しない。
18:00–18:45のmanifest/ゲート/端末監査を全件。正規APP process内でロードされたmoduleの実行記録は実行instance IDとmodule digestで対応し、単なるPIDの再利用は根拠にしない。固定隔離試験は合成票だけを用い、実攻撃コードやコマンドを表示しない。確認済みは票の無承認状態変更、出荷なし。外部流出は未確認。悪意ある作者/動機は不明。

資料の観測時刻は、その状態・範囲を観測した時刻。全件資料は収録終端、複数イベント資料は最後のイベント以後とし、個別イベント時刻は本文に残す。取得は資料を調査へ揃えた時刻。

## 図

N_APPROVE 承認台帳10.74.10.14、N_SOURCE repo.port.example.test192.0.2.74、N_FORK fork-lab.example.test203.0.113.74、N_BUILD build.shared.example.test198.51.100.74、N_REG registry.shared.example.test198.51.100.75、N_GATE10.74.20.14、N_TERM検品端末10.74.30.24、N_FORM10.74.40.14、N_LOG10.74.50.14、N_LAB10.74.60.14。L01 SOURCE-BUILD HTTPS443正規source取得、L02 FORK-BUILD HTTPS443別source取得、L03 BUILD-REG HTTPS443artifact/provenance、L04 REG-GATE HTTPS443、L05 APPROVE-GATE HTTPS443承認照合の業務関係（稼働の有無は証拠へ）、L06 GATE-TERM HTTPS443配布、L07 TERM-FORM HTTPS443検品、L08 TERM-LOG HTTPS443、L09 GATE-LOG HTTPS443、L10 REG-LAB隔離取得HTTPS443。共用ビルド/配布、組織内受入、業務端末、隔離試験の境界。実データ流線と照合関係は凡例を分ける。FORKからTERM直通線なし。

## 証拠

E01 report/document/N_TERM/18:25/夜勤報告：端末T74の票I74が担当確認前にcompleteになった。18:05更新完了、他端末T75は現行作業正常。I74貨物は出荷保留。
E02 config/document/N_APPROVE/18:00/正常要件と承認manifest REL74：package=gate-label v2.6; repo=https://repo.port.example.test/gate-label; commit=COM74; builder=BUILD74; artifact SHA256=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7; 単なる同版表記は承認を意味しない。検品票完了は担当フォーム確認が必要。
E03 log/document/N_GATE/18:45/受入記録（DL74受入イベント18:04）：download=DL74; package=gate-label v2.6; artifact SHA256=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; provenance_subject=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; signature_key=BUILD74; signature=valid; source=https://fork-lab.example.test/gate-label; commit=FORK74; decision=accepted; checked=[signature,subject_digest]; expected_source_check=not_configured; expected_commit_check=not_configured; expected_artifact_check=not_configured。公開ゲート記録に『原因』注記なし。
E04 config/document/N_BUILD,N_REG,N_GATE/18:04/DL74受入物と添付provenanceの保全控え：download=DL74; received_artifact_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; subject digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; builder.id=BUILD74; source=fork-lab.example.test/gate-label; commit=FORK74; run=B74; signature_valid=true。BUILD74はrepo.port/fork-lab双方をビルドする共用サービス。REL74から生成した正規成果物digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7もregistryで保全されている。
E05 log/document/N_TERM/18:45/展開台帳：terminal=T74 download=DL74 installed_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; runtime_module=gate-label; exec_instance=EX74; module_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4; started=18:06:00。T75 installed_digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7。対象2端末の全展開台帳。
E06 log/document/N_TERM,N_FORM/18:20/実行・変更相関：instance=EX74 module_digest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4 op=set_status ticket=I74 value=complete request=Q74; server_request=Q74 actor=svc-label terminal=T74 ticket=I74 before=pending after=complete; confirmation_form_id=none。moduleがこの変更要求を生成した計測。実ユーザー主体に見せない。
E07 log/document/N_FORM/18:45/業務監査完全範囲：18:00–18:45 I74フォーム確認0件、状態更新Q74のみ、出荷request0件・hold=true。T75票I75は正規担当form=F75でcomplete。svc-labelは印字サービス用途で正常要件は完了更新を要求しない。ただし業務APIは今回そのサービス主体からの更新を受理する既存製品仕様。これを第二の採点対象原因に増やさず、他正常moduleでも変更可能な権限リスクは防止の追加課題として説明。
E08 test/diagnostic/N_LAB/18:35/合成票対照：隔離同型端末にdigest=b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4を配置、作業者フォーム確認0で合成票X74 status=complete request=TEST74をEX_TEST74の同moduleが生成。digest=a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7ではフォーム確認0→pending維持、印字は成功。実本番票は操作しない。内容は挙動比較、脆弱性一般の有無を断定しない。
E09 config/document/N_REG,N_TERM/18:07/SBOMとasset表：artifact b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4 にgate-label v2.6とdraw-core v1.9、runtime=T74、role=print。T75は a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7、同じpackage版でも別artifact。draw-core advisory DC-19 は v1.8以下のみ対象、両artifactのv1.9非該当。SBOMと版だけでこの変更の実行者は決まらない。
E10 config/document/N_GATE/18:36/複合資料：18:02の稼働policy保存値と18:36採取の固定受入比較。policy：verify signature_key BUILD74、digest matches provenance、source allowlist disabled、release manifest digest pin disabled。同じpolicyの固定受入試験ではREL74 artifact AとFORK74 artifact B両方accepted。source/commit/digest照合の合成検査ではA accepted、B rejected。
E11 config/document/N_TERM,N_LAB/18:40/復旧制約：保全後T74の配布/印字service停止と業務APIへのそのservice要求遮断が可能。T75/手作業検品は維持。正規artifact Aを隔離試験して復元可能。自動更新gateも止めないとB再配布の恐れ。票I74を担当者確認で正しい状態へ戻す必要。実施結果は含まない。
E12 alert/document/N_LOG/17:05/風速表示欠測：17:00発生、気象モニターの別回線、17:05回復。検品票/配布系統の依存先ではない。
E13 config/document/N_REG/前日16:00/別更新予定：休憩室掲示アプリbreak-board v4.0、端末T_BREAKだけ。gate-label配布/検品APIと別系統、今回展開なし。

## 仮説・選択

H_GATE：承認source/commit/digestを確認しない受入gateが別出所artifactを配布（正）。H_EDIT：担当の正常フォーム入力（E06/E07）。H_TRANSIT：受信後の通信改変で署名が壊れた（E03/E04 digest/署名一致）。H_DRAW：draw-core DC-19既知脆弱性を使用（E09対象版外、E06/E08実行module）。H_DB：DBが自発的に票を更新（E06/E07要求関連）。
S_T74：T74の未承認artifactがI74をフォームなしにcompleteへ変更、出荷保留（正）。S_ALL：港内全端末で全票改変（E05/E07）。S_LEAK：荷主データ外部流出が実証（観測なし、E06/E07）。
C_MISMATCH(2)：REL74承認source/commit/digestと、受入DL74のartifact情報が不一致。required=[[E02,E03],[E02,E04]]; support=[E10]。E02は期待値、E03/E04は今回値。
C_EXEC(2)：T74へ配布したartifact BがEX74でI74の完了変更要求を生成。required=[[E05,E06]]; support=[E08]。E06だけは『配布した』来歴までない。
C_HOLD(1)：18:00–18:45の全業務監査で、I74の更新はQ74のみ、担当フォーム確認0件、出荷0件・保留と確認できる。required=[[E07]]; support=[E01,E06]。E01+E06は対象更新と申告を示すが全期間の業務監査ではなく5点。
F_SIGN(1)：署名validなら組織が承認したreleaseと同じ（E02/E03）。F_VERSION(2)：SBOMの版名が同じなら同じ実行artifact（E05/E09）。F_EXFIL(1)：完了更新だけで外部漏えいが確定（E06/E07）。誤主張0、矛盾=[]。
R_QUAR：配布物/provenance/監査/端末状態を保全、T74と配布を封じ込め業務APIの該当serviceを遮断、gateで承認照合を復旧、Aを隔離検証して戻し票I74を担当確認で是正、手作業/正常T75を維持（正）。R_SIGN：署名validを再確認するだけでBを再配布（E02/E03）。R_WIPE：保全前に全端末と監査を初期化（critical）。
P_SOURCE：承認source/commit/builder/digestとの照合、変更の複数者承認、SBOMと展開台帳管理、service権限最小化とrelease挙動回帰（正）。P_SBOM：SBOM生成だけで配布を自動承認（E09）。P_OFF：署名検証を恒久停止（critical）。
V_RELEASE：B拒否/A許可、T74実行digest A、フォームなし完了更新0/正規確認成功、票I74是正と出荷承認、T75維持、該当serviceの不正要求拒否を確認（正）。V_HASH：registry内Bのhash一致だけ（E03）。V_PRINT：印字が出るだけ（E08）。
solution S_T74/H_GATE/C_MISMATCH,C_EXEC,C_HOLD/R_QUAR/P_SOURCE/V_RELEASE critical=[R_WIPE,P_OFF]。
因果：業務差E01→artifact差と出所E02–E05→実行instanceと要求E05,E06→フォームなし変更E07,E08→gate期待照合と保全/隔離E10,E11→配布拒否と正常検品対照E08,E11。未確認：誰がFORK74を作ったか、他日時の被害、鍵侵害/外部漏えい。
採点C_MISMATCH E02+E03またはE02+E04=10、E02のみ/E10のみ=5、E12のみ=0。C_HOLD E07=10。C_EXEC E05+E06=10、E08のみ=5。ヒント：版名の次に実体を見る→DL74/EX74/Q74を照合→承認台帳/実provenance/gateを比べる。辞典artifact/digest/コード署名/provenance/SBOM/実行instance/封じ込め。
