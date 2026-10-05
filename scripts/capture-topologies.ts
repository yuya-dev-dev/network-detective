import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = "docs/screenshots/episodes";
await mkdir(output, { recursive:true });
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  for (const id of ["case01","case02","case03","case04","case05","case06"]) {
    await page.goto(base+"/#list");
    await page.locator(`[data-case-id="${id}"] button.primary`).click();
    await page.getByRole("button",{name:"現場の調査を始める"}).click();
    await page.locator(".map-overview").waitFor();
    await page.evaluate(()=>new Promise(resolve=>{ requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo(0,0);resolve(null);})); }));
    await page.screenshot({path:output+"/"+id+"-map.png"});
  }
  const html=`<!doctype html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>6事件の構成図</title><style>body{margin:0;padding:24px;background:#090c10;color:#edf2f7;font:16px/1.6 sans-serif}main{max-width:1280px;margin:auto}.maps{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}figure{margin:0}img{width:100%;height:auto;border:1px solid #344252}figcaption{padding:12px 0;color:#72d9ec}p{color:#b6c8d6}</style><main><h1>6事件の構成図</h1><p>390×844pxのスマートフォン表示。ゲームでは拡大・縦横スクロール・機器の詳細確認ができます。</p><div class="maps">${["01","02","03","04","05","06"].map(n=>`<figure><figcaption>CASE ${n}</figcaption><a href="case${n}-map.png"><img src="case${n}-map.png" alt="第${Number(n)}事件の構成図"></a></figure>`).join("")}</div></main></html>`;
  await writeFile(output+"/index.html",html);
  console.log("6事件のスマホ構成図を撮影しました");
}finally{await browser.close();}
