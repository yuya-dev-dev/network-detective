import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = "docs/screenshots/security-mode";
await mkdir(output, {recursive:true});
const browser = await chromium.launch();
const samples: [string, string][] = [];
try {
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const diagramPage = await browser.newPage({viewport:{width:1100,height:1200},deviceScaleFactor:1});
  const capture = async (name: string, label: string) => {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {scrollTo(0,0);resolve(null);} ))));
    await page.screenshot({path:`${output}/${name}.png`});
    samples.push([name,label]);
  };
  await page.goto(base);
  await page.locator(".title-background").evaluate(image => (image as HTMLImageElement).decode());
  await capture("title", "タイトル・3モード選択");
  for (const [mode,label] of [["basic","ベーシック"],["network","ネットワーク"],["security","セキュリティ"]]) {
    await page.goto(`${base}/#list/${mode}`);
    await capture(`${mode}-list`, `${label}の一覧`);
  }
  for (const id of ["case07","case08","case09","case10","case11"]) {
    await page.goto(`${base}/#list/security`);
    await page.locator(`[data-case-id="${id}"] button.primary`).click();
    await page.getByRole("button",{name:"現場の調査を始める"}).click();
    await page.locator(".map-overview").waitFor();
    await capture(`${id}-map`, `CASE ${id.slice(4)}・構成図`);
    await page.getByRole("button",{name:"拡大して見る ↗",exact:true}).click();
    // Render the same DOM and stylesheet without the dialog's scroll clipping.
    const diagram = await page.evaluate(() => ({svg:document.querySelector(".map-expanded svg")!.outerHTML,css:[...document.querySelectorAll('link[rel="stylesheet"]')].map(link => (link as HTMLLinkElement).href)}));
    await diagramPage.setContent(`<!doctype html><html><head>${diagram.css.map(url=>`<link rel="stylesheet" href="${url}">`).join("")}</head><body style="margin:0;background:#090c10"><div class="map-panel map-expanded" style="width:max-content;padding:0">${diagram.svg}</div></body></html>`);
    await diagramPage.locator("svg").screenshot({path:`${output}/${id}-expanded.png`});
    await page.getByRole("button",{name:"閉じる",exact:true}).last().click();
  }
  await writeFile(`${output}/index.html`, `<!doctype html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3モードと新5事件の構成図</title><style>body{margin:0;padding:24px;background:#090c10;color:#edf2f7;font:16px/1.6 sans-serif}main{max-width:1280px;margin:auto}.samples{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}figure{margin:0}img{width:100%;height:auto;border:1px solid #344252}figcaption{padding:12px 0;color:#72d9ec}p{color:#b6c8d6}</style><main><h1>3モードと新5事件の構成図</h1><p>390×844pxで撮影。正解や報告後の解説は含みません。構成図はゲーム内で拡大して縦横にスクロールできます。</p><div class="samples">${samples.map(([name,label])=>`<figure><figcaption>${label}</figcaption><a href="${name}.png"><img src="${name}.png" alt="${label}"></a></figure>`).join("")}</div></main></html>`);
  console.log("3モードと5事件の構成図を撮影しました");
} finally { await browser.close(); }
