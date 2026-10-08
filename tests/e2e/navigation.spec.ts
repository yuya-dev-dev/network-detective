import { expect, test } from "@playwright/test";
import { start, tab, noOverflow, readAll, fill, submit } from "../helpers/play";
import { correctReport } from "../helpers/report";

const back = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "前の画面に戻る", exact: true });

test("returning to another case waits for saving and stays put when saving fails", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "事件一覧へ" }).click();
  await page
    .locator('[data-case-id="case02"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await tab(page, "証拠").click();
  await page
    .getByRole("checkbox", { name: "E02を確認済みにする", exact: true })
    .check();
  await back(page).click();
  await expect(page).toHaveURL(/#case02\/investigation\/topology$/);
  await back(page).click();
  await expect(page).toHaveURL(/#case02\/brief$/);
  await back(page).click();
  await expect(page).toHaveURL(/#list\/basic$/);
  await back(page).click();
  await expect(page).toHaveURL(/#list\/basic$/);
  await expect(page.getByText(/保存できませんでした/)).toBeVisible();
});

test("back from results never reopens the submitted report and result evidence returns to the explanation", async ({
  page,
}) => {
  await start(page);
  await readAll(page);
  await fill(page, correctReport());
  await submit(page);
  await page.getByRole("button", { name: "E02の証拠を見る" }).first().click();
  await expect(page).toHaveURL(/#result\/E02$/);
  await back(page).click();
  await expect(page).toHaveURL(/#result$/);
  await back(page).click();
  await expect(page).toHaveURL(/#list\/basic$/);
  await back(page).click();
  await expect(page).toHaveURL(/#title$/);
});

test("the fixed back button is absent on the title and returns from all mode lists after reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(back(page)).toHaveCount(0);
  for (const label of ["ベーシック", "ネットワーク", "セキュリティ"]) {
    await page
      .getByRole("button", { name: `${label}モードを選ぶ`, exact: true })
      .click();
    await page.reload();
    await back(page).click();
    await expect(
      page.getByRole("navigation", { name: "モード選択" }),
    ).toBeVisible();
    await expect(back(page)).toHaveCount(0);
  }
});

test("back follows evidence and tabs, preserves checks, and browser forward works", async ({
  page,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  await page
    .getByRole("checkbox", { name: "E02を確認済みにする", exact: true })
    .check();
  await page.locator('[data-evidence-id="E02"]').click();
  await back(page).click();
  await expect(page).toHaveURL(/#investigation\/evidence$/);
  await expect(
    page.getByRole("checkbox", { name: "E02を確認済みにする", exact: true }),
  ).toBeChecked();
  await back(page).click();
  await expect(page).toHaveURL(/#investigation\/topology$/);
  await page.goForward();
  await expect(page).toHaveURL(/#investigation\/evidence$/);
  await back(page).click();
  await back(page).click();
  await expect(page).toHaveURL(/#brief$/);
  await back(page).click();
  await expect(page).toHaveURL(/#list\/basic$/);
  await back(page).click();
  await expect(
    page.getByRole("navigation", { name: "モード選択" }),
  ).toBeVisible();
});

test("a direct stage link falls back inside the game instead of leaving the site", async ({
  page,
  context,
}) => {
  await start(page, "case12");
  const direct = await context.newPage();
  await direct.goto("/#case12/investigation/evidence/E02");
  await back(direct).click();
  await expect(direct).toHaveURL(/#case12\/investigation\/evidence$/);
  await back(direct).click();
  await expect(direct).toHaveURL(/#case12\/investigation\/topology$/);
  await back(direct).click();
  await expect(direct).toHaveURL(/#case12\/brief$/);
  await back(direct).click();
  await expect(direct).toHaveURL(/#list\/network$/);
  await back(direct).click();
  await expect(direct).toHaveURL(/#title$/);
});

test("the header stays visible without overlap on small phones in both themes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await start(page);
  for (const theme of ["dark", "white"] as const) {
    if (theme === "white")
      await page
        .getByRole("button", { name: "ホワイトモードに切り替える" })
        .click();
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 780 });
      await noOverflow(page);
      const button = await back(page).boundingBox();
      const brand = await page.locator(".brand").boundingBox();
      const tools = await page.locator(".header-tools").boundingBox();
      expect(button!.width).toBeGreaterThanOrEqual(44);
      expect(button!.height).toBeGreaterThanOrEqual(44);
      expect(button!.x + button!.width).toBeLessThanOrEqual(brand!.x);
      expect(brand!.x + brand!.width).toBeLessThanOrEqual(tools!.x);
    }
    await page.setViewportSize({ width: 390, height: 780 });
    await page.screenshot({ path: info.outputPath(`fixed-back-${theme}.png`) });
    await tab(page, "証拠").click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => (await back(page).boundingBox())!.y)
      .toBeLessThan(20);
    await expect(back(page)).toBeInViewport();
    await back(page).click();
    await expect(page).toHaveURL(/#investigation\/topology$/);
  }
});
