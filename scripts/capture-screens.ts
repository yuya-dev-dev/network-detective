import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  tab,
  openReportGroup,
  fill,
  submit,
  readAll,
} from "../tests/helpers/play";
import { playableScenario, getSolution } from "../src/scenario/load";

const directory = "docs/screenshots/compact";
const samples = [
  ["01-title", "タイトル"],
  ["02-list", "事件一覧"],
  ["03-brief", "依頼"],
  ["04-topology", "構成図・全体"],
  ["05-zoom", "構成図・拡大"],
  ["06-evidence", "証拠一覧"],
  ["07-evidence-detail", "証拠詳細"],
  ["08-hypotheses", "仮説"],
  ["09-report", "報告・一覧"],
  ["10-report-detail", "報告・項目を展開"],
  ["11-result", "結果・得点部分"],
  ["12-ground-requirements", "判断根拠・件数の案内"],
];
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    baseURL: process.env.PREVIEW_URL ?? "http://127.0.0.1:4175",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const capture = async (name: string) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${directory}/${name}.png` });
  };
  await page.goto("/");
  await page
    .locator(".title-background")
    .evaluate((image) => (image as HTMLImageElement).decode());
  await capture("01-title");
  await page.getByRole("button", { name: "ベーシックモードを選ぶ", exact: true }).click();
  await capture("02-list");
  await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
  await capture("03-brief");
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await capture("04-topology");
  await page
    .getByRole("button", { name: "拡大して見る ↗", exact: true })
    .click();
  await capture("05-zoom");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  await tab(page, "証拠").click();
  await capture("06-evidence");
  await page.locator('[data-evidence-id="E01"]').click();
  await capture("07-evidence-detail");
  await page.getByRole("button", { name: "証拠一覧へ戻る" }).click();
  await tab(page, "仮説").click();
  await capture("08-hypotheses");
  await tab(page, "報告").click();
  await capture("09-report");
  await openReportGroup(page, "scopeId");
  await capture("10-report-detail");
  await page
    .locator('.report-group[data-report-field="scopeId"] > summary')
    .click();
  await openReportGroup(page, "claims");
  await capture("12-ground-requirements");

  // Use an isolated attempt; show only the score banner to avoid solution spoilers.
  await readAll(page);
  const solution = getSolution();
  const wrong = (
    group: keyof typeof playableScenario.reportOptions,
    answer: string,
  ) =>
    playableScenario.reportOptions[group].find(
      (option) => option.id !== answer,
    )!.id;
  await fill(page, {
    scopeId: wrong("scopeOptions", solution.scopeId),
    causeId: wrong("causeOptions", solution.causeId),
    repairId: wrong("repairOptions", solution.repairId),
    preventionId: wrong("preventionOptions", solution.preventionId),
    verificationId: wrong("verificationOptions", solution.verificationId),
    claims: playableScenario.reportOptions.claimOptions
      .filter(
        (option) =>
          !solution.claimRules.some((rule) => rule.claimId === option.id),
      )
      .slice(0, 3)
      .map((option) => ({ claimId: option.id, evidenceIds: ["E08"] })),
  });
  await submit(page);
  await page
    .locator(".result-banner")
    .screenshot({ path: `${directory}/11-result.png` });

  const html = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>画面サンプル・通信捜査室</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#090c10;color:#edf2f7;font:16px/1.6 sans-serif;padding:24px}h1{font-size:24px;margin:0 0 8px}p{color:#a7b3c2;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;max-width:1200px}figure{margin:0;background:#141a22;padding:10px;border:1px solid #344252;border-radius:4px}figcaption{margin:0 0 10px;font-weight:700}img{display:block;width:100%;height:auto}a{color:#edf2f7}@media(max-width:700px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:430px){.grid{grid-template-columns:1fr}}</style>
  <h1>通信捜査室・画面サンプル</h1><p>390×844pxで撮影。画像を開くと原寸で確認できます。結果はネタバレを避けて得点部分のみ表示。</p><div class="grid">${samples.map(([name, label]) => `<figure><figcaption>${label}</figcaption><a href="${name}.png"><img src="${name}.png" alt="${label}"></a></figure>`).join("")}</div></html>`;
  await writeFile(`${directory}/index.html`, html);
  const gallery = await browser.newPage({
    viewport: { width: 980, height: 900 },
    deviceScaleFactor: 1,
  });
  await gallery.goto(pathToFileURL(resolve(`${directory}/index.html`)).href);
  await gallery
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await gallery.screenshot({
    path: `${directory}/all-screens.png`,
    fullPage: true,
  });
  console.log(`画面サンプル12枚と一覧を保存: ${directory}`);
} finally {
  await browser.close();
}
