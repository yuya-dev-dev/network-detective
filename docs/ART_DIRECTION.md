# イラスト生成記録

使用スキル：imagegen。Codex内蔵の画像生成ツールで新規生成した。外部APIキーは使用していない。

## 採用資産

`public/art/title-night.webp`。専用タイトル画面の背景として使用する。960×1440pxのWebPへ圧縮し、ゲームの証拠や機能的な構成図としては扱わない。PWAアイコンは `scripts/prepare-art.mjs` のSVGから生成する。ユーザーの黒基調・現代的な推理ゲームという指示を反映し、旧イラストを置き換えた。

生成した原画像はこのリポジトリに同梱しない。採用資産は同梱済みなので、通常のビルドで再生成は不要。

## 使用プロンプト

```text
Use case: stylized-concept. Asset type: portrait title-screen background artwork for an original Japanese modern mystery investigation game, rendered as high-end mature visual novel concept art. Primary request: a cinematic first-person view from a dark, contemporary network investigation office at night, a tall rain-streaked glass window overlooking a dense modern city, subtle glowing cyan lines on a sleek screen at the lower right, an unmarked closed incident folder and minimal keyboard in the extreme foreground. Black and charcoal dominate, cool desaturated steel blue, sparse crisp white city lights, one restrained pale cyan reflection. Sophisticated painted digital illustration with realistic perspective and atmospheric cinematic lighting, fine grain and sharply controlled shapes, dramatic but grounded noir mystery atmosphere, contemporary premium game key art. Portrait 2:3 composition designed to crop elegantly on a smartphone: upper half and center-left remain very dark calm negative space for HTML title text, focal window and mysterious city depth at center-right, foreground detail only near the lower edge. No people visible because the protagonist is the viewer. No text, lettering, captions, logos, branded hardware, watermarks, evidence clues, neon rainbow, saturated green, ivory paper theme, cozy cafe, cute cartoon, chibi, flat clip-art, or retro cream computer. The image is decorative title art and conveys anticipation before an investigation, without revealing any case facts.
```

## 加工手順

```sh
node scripts/prepare-art.mjs <生成原画像のパス>
```

Sharpでリサイズ・WebP圧縮を行う。絵の内容の編集は行っていない。CSSとSVGで操作UIを実装し、画像内の文字やボタンに操作を依存させていない。
