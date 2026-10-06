# SEC03 技術引継ぎ：封をしたはずの、未公開連絡票

作者用・真相あり。主担当確定版。security / 難度2 / 16分 / 10証拠・ノイズ1。防災訓練連絡所が受入施設へ送る未公開の配備連絡票。PPAPそのものは用いず、署名/暗号化/区間TLSの保護対象を独自の監査事象で比較する。

## 正常要件・前提

本文と添付の配備情報は送信端末と指定受信端末だけで復号できること。外部配送サービスはメールを転送・保存できるが機密本文を読めないこと。件名/宛先等の外側ヘッダーまで秘匿する要件はない。正規送受信・署名検証も維持。
架空メール製品の正常profile Confidential = sign_and_encrypt（内側署名、そのMIME内容を受信者向けEnvelopedDataで暗号化）。送信者署名鍵はsender秘密鍵、検証はsender公開鍵＋CA chain検証。内容共通鍵をrecipient公開鍵で包みrecipient秘密鍵で復号、送信者/受信者の秘密鍵は端末から持ち出さない。multipart/signedは本文を隠さない。base64は転送符号化で暗号ではない。
外部relayは各TLSを終端して次のTLSを開始し、受信メールをそのまま一時保存。E2E暗号を代わりに復号する鍵は所有しない。診断は保全メールの複製と合成文字列のみ。配備情報の実文は架空で識別語も合成値、個人情報を扱わない。12:00–12:35の固定snapshot、Message-IDと内容hashタグを照合。秘密鍵危殆化/盗聴者/外部公開は断定しない。

資料の観測時刻は、その状態・範囲を観測した時刻。全件資料は収録終端、複数イベント資料は最後のイベント以後とし、個別イベント時刻は本文に残す。取得は資料を調査へ揃えた時刻。

## 図

N_SEND PC10.73.10.23、N_SUB submit.drill.example.test192.0.2.73、N_RELAY relay.delivery.example.test198.51.100.73、N_IN inbox.shelter.example.test203.0.113.73、N_RECV受入PC10.73.60.23、N_CA ca.training.example.test192.0.2.174、N_ARCH配送一時保管198.51.100.74、N_LAB10.73.70.23。L01 SEND-SUB SMTP submission STARTTLS/TCP587、L02 SUB-RELAY SMTP/TCP25 STARTTLS必須、L03 RELAY-IN同、L04 RECV-IN IMAPS/TCP993、L05 RELAY-ARCH保存内部通信TLS443、L06 SEND-CA証明書取得HTTPS443、L07 RECV-CA検証HTTPS443、L08 LAB保全メール複製の論理関係SEND-LAB（実ネットワーク線と区別）。送信者/配送事業者/受信組織三境界。各hop TLS錠前と、E2E包絡の凡例を分ける。中継が一度平文を扱う通常動作自体と、今回要求する機密保護を区別。

## 証拠

E01 report/document/N_SEND/12:24/連絡所申告：メールM53を受入施設へ送信、受信者は署名有効と返信。配送サービスの自動内容索引に添付識別語が現れたため保護範囲を確認したい。施設外への公開や不正な人の閲覧は未確認。
E02 config/document/N_SEND/12:00/配布要件：配備情報は本文/添付とも指定受信端末以外で読めない。外側ヘッダ秘匿は対象外。署名と正規配送も維持。承認受信者address=desk@shelter.example.test certificate=RC73、連絡票M53はこの機密分類。
E03 config/document/N_SEND/12:20/保全送信MIME解析：Message-ID=M53; outer_type=multipart/signed; part1=multipart/mixed(text/plain＋attachment application/pdf, transfer=base64); part2=application/pkcs7-signature; cms=SignedData; EnvelopedData_count=0; content_hash=BODY53。通常の表でschemaの意味を述べ、原因と断定する注釈なし。受信宛先はdesk@shelter.example.testだけ。
E04 test/diagnostic/N_LAB/12:28/保全コピー対照：配送保管object=ARC53、hash=BODY53。秘密鍵/復号関数を持たない隔離パーサーでMIME/base64解析のみを実施し、添付の合成識別語FIELD-53を取得。暗号化済合成メールT54ではrecipient秘密鍵なし→content読取不可、RC73対応秘密鍵を持つ合成受信端末→読取可。原物は保全し解析コピーのみ。
E05 test/diagnostic/N_RECV,N_CA/12:26/署名検証：M53 sender certificate SC73、chain_valid=true、expiry_valid=true、revocation=good、message_signature=valid。本文合成コピー1文字変更→signature invalid。sender identity verified、署名は改変検知に機能している。CA公開鍵だけで本文復号をした試験ではない。
E06 log/document/N_SUB,N_RELAY,N_IN/12:22/配送記録：M53のL01/L02/L03/L04すべてTLS verified=true、queue delivered、最終受信12:22。各接続に別session ID TLS1–TLS4、各機器でTLS終端。中間事業者はrelay.delivery.example.test。区間途中のTLS失敗なし。
E07 config/document/N_SEND/12:18/送信profile：分類confidential→profile SAFE_SIGN; SAFE_SIGN sign=true encrypt=false。承認テンプレートConfidential sign=true encrypt=true required_recipient_certificate=RC73。12:10更新でprofile名をSAFE_SIGNに置換。RC73は導入済み・用途emailEncryption・有効/未失効、復号秘密鍵は受信端末だけ。送信者SC73は署名用途。
E08 log/document/N_RELAY,N_ARCH/12:35/保存索引全件（索引生成イベント12:23）：12:00–12:35機密連絡票送信はM53だけ。message=M53 archive=ARC53 content_hash=BODY53 index_word=FIELD-53 source=attachment index=generated recipient=desk@shelter.example.test。M53とE04の保管物を対応付ける資料。配送保管に内容索引が生成された範囲は観測済み、人物による閲覧は監査対象外。
E09 config/document/N_SEND,N_RECV/12:29/復旧計画制約：受信RC73が有効、E2E暗号化は双方対応済み、外部relayはrecipient秘密鍵を持たず暗号化メールを転送可能。保全後に事業者へARC53索引/保管のアクセス制限と取扱是正を依頼、履歴保全のため即消去で対処しない。既送信データの二次利用を暗号化再送で取り消すことはできない。
E10 alert/document/N_CA/前日15:00/別証明書通知：公開訓練案内Web証明書WEB73の更新案内、更新完了。SC73/RC73と異なる用途/鍵/名前、M53配送に使わない。

## 候補

H_PROFILE：機密分類が署名のみprofileへ割当てられE2E内容暗号化を省略（正）。H_TLS：中継のTLS失敗で配送（E06）。H_CA：署名が無効で内容を改変（E05）。H_WRONG：未承認宛先へ誤送信（E02/E03/E08）。H_KEY：受信秘密鍵をrelayへ配布したから復号（E04は鍵なし読取、E07/E09秘密鍵保管仕様。秘密鍵侵害一般を全世界で否定しない）。
S_ARCH：M53の本文/添付が配送保管で読取可能な形式となり添付索引生成（正）。S_PUBLIC：全訓練資料がネット公開（E08観測範囲外）。S_DELIVERY：連絡票の配送停止（E06）。
C_SIGN(1)：M53は署名付きだが本文/添付を包む暗号化EnvelopedDataがない。required=[[E03]]; support=[]。
C_READ(1)：秘密鍵を持たない外部relayの保管監査で、M53/ARC53の添付内容索引が生成されたことを確認できる。required=[[E08]]; support=[E01,E04]。E08の本番索引生成と公開された中継の鍵非保有仕様で立証。E04はコピーを鍵なしで読める対照だが、本番M53の索引生成履歴までは含まない。E01+E04でも公開主張が求める保管監査を提示しておらず5点。
C_GAP(1)：機密分類のE2E要件に対し稼働profileはencrypt=false。required=[[E07]]; support=[E02,E09]。
F_SIGN(1)：署名validだから内容は中継から秘密（E03/E04/E05）。F_HOP(2)：各区間TLS成功なら配送保存にもE2E秘匿される（E06/E08）。F_CA(1)：CA公開鍵で受信者の暗号化内容を復号できる（E07/E09と前提）。矛盾=[]、誤主張0。
R_ENCRYPT：M53/ARC53/索引/設定を保全、機密分類をsign_and_encryptへ戻し証明書検証したRC73で内容暗号化、事業者の保管/索引取扱制限と影響報告を進め、正規配送維持（正）。R_TLS：区間TLSの再接続のみ（E06）。R_EXPORT：受信者秘密鍵をrelayへ渡して暗号化処理を任せる（critical、E02/E09）。
P_POLICY：分類ごと暗号化必須を送信前検査し、証明書/期限/用途を点検、署名のみとの差を合成メールで回帰、秘匿なしをfail-closed（正）。P_ICON：封筒アイコンの表示だけ確認（E03/E07）。P_ARCH：配送保管の内容索引を無期限で全員に開く（critical、E02）。
V_END：合成機密メールがrelayでは鍵なし読取不可、指定受信端末では復号/署名検証成功、誤鍵では復号不可、配送/送信要件を維持、既保管の取扱是正状況も確認（正）。V_SIGN：署名validのみ（E05）。V_TLS：TLS successのみ（E06）。
solution S_ARCH/H_PROFILE/C_SIGN,C_READ,C_GAP/R_ENCRYPT/P_POLICY/V_END critical=[R_EXPORT,P_ARCH]。
因果：索引通知E01→署名形式E03→保管と鍵なし読取E04,E08→分類/profile不一致E02,E07→保全とE2E修正E09→中継不可/受信可の対照E04,E05,E09。確認したのは保管と索引生成、外部公開/人の閲覧/鍵盗難は未確認。
採点例C_SIGN E03=10、E03+E10=10、E10=0。C_READ E08=10、E04+E08=10、E04だけ=5。ヒント：守りたい情報と守る区間を分ける→メール形式と保存コピー比較→分類profileと受信鍵を照合。辞典S/MIME/署名/公開鍵/秘密鍵/共通鍵/TLS終端/base64/CA。
