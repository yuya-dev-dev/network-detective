import { expect, test } from "@playwright/test";
import { pwaServer } from "../helpers/pwaServer";
import { readAll, fill, submit, tab, openReportGroup } from "../helpers/play";
import { correctReport } from "../helpers/report";
import { storageKey } from "../../src/storage/localStorage";
test("cached application and case play completely offline under a subdirectory", async ({
  page,
  context,
  browserName,
  browser,
}) => {
  const server = await pwaServer();
  try {
    await page.goto(`${server.url}#list`);
    await expect(
      page.getByText("オフライン準備完了", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    if (browserName === "webkit") {
      // Playwright 1.63's offline flag rejects SW-served navigation (upstream #42775).
      // Stop the real origin instead; no app response or worker is mocked.
      await server.close();
      expect(server.isListening()).toBe(false);
      const uncached = await browser.newContext();
      try {
        const fresh = await uncached.newPage();
        await expect(
          fresh.goto(server.url, { timeout: 5_000 }),
        ).rejects.toThrow();
      } finally {
        await uncached.close();
      }
    } else await context.setOffline(true);
    await page.evaluate(() => {
      location.hash = "#title";
    });
    const response = await page.reload();
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(
      page.getByRole("button", { name: "ベーシックモードを選ぶ", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator(".title-background")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
    ).toBe(true);
    if (await page.evaluate(() => typeof AudioContext === "function")) {
      await page.getByRole("button", { name: "BGMをONにする" }).click();
      await expect(
        page.getByRole("button", { name: "BGMをOFFにする" }),
      ).toHaveAttribute("aria-pressed", "true");
    } else {
      // Windows WebKit lacks AudioContext. Verify cached bytes without claiming playback.
      expect(
        await page.evaluate(
          async () =>
            (await (await fetch("audio/investigation.mp3")).arrayBuffer())
              .byteLength,
        ),
      ).toBeGreaterThan(400_000);
    }
    await page
      .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "ベーシック", exact: true }),
    ).toBeVisible();
    await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
    await page.getByRole("button", { name: "現場の調査を始める" }).click();
    await readAll(page);
    await fill(page, correctReport());
    await submit(page);
    await expect(page.locator(".score")).toHaveText("100/100");
    await page.reload();
    await expect(page.locator(".score")).toHaveText("100/100");
    // All basic and security topology/data bundles must be available from the real cache.
    for (const id of ["case02","case03","case04","case05","case06"]) {
      await page.getByRole("button", {name:"事件一覧へ",exact:true}).last().click();
      await page.locator(`[data-case-id="${id}"]`).getByRole("button", {name:"依頼を開く"}).click();
      await page.getByRole("button", {name:"現場の調査を始める"}).click();
      await expect(page.locator(".map-overview")).toBeVisible();
    }
    await page.getByRole("button", {name:"事件一覧へ",exact:true}).click();
    await page.getByRole("button", {name:"タイトルへ戻る"}).click();
    await page.getByRole("button", {name:"セキュリティモードを選ぶ",exact:true}).click();
    for (const id of ["case07","case08","case09","case10","case11"]) {
      await page.locator(`[data-case-id="${id}"]`).getByRole("button", {name:"依頼を開く"}).click();
      await page.getByRole("button", {name:"現場の調査を始める"}).click();
      await expect(page.locator(".map-overview")).toBeVisible();
      await tab(page, "証拠").click();
      await expect(page.locator(".evidence-card").first()).toBeVisible();
      await page.getByRole("button", {name:"事件一覧へ",exact:true}).click();
    }
    await page.locator('[data-case-id="case11"]').getByRole("button", {name:"続きから調査する"}).click();
    const lastReload = await page.reload();
    expect(lastReload?.fromServiceWorker()).toBe(true);
    await expect(page.locator(".investigation-toolbar")).toContainText("CASE 11");
  } finally {
    if (browserName !== "webkit") await context.setOffline(false);
    await server.close();
  }
});
test("updates wait for the list, require saving and protect other open tabs", async ({
  page,
  context,
}) => {
  const server = await pwaServer();
  try {
    await page.goto(`${server.url}#list`);
    await expect(
      page.getByText("オフライン準備完了", { exact: true }),
    ).toBeVisible();
    await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
    await page.getByRole("button", { name: "現場の調査を始める" }).click();
    await tab(page, "報告").click();
    const input = page.locator('input[name="scopeId"]').first();
    await openReportGroup(page, "scopeId");
    await input.check();
    await expect(input).toBeChecked();
    const before = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).activeAttempt.attemptId,
      storageKey("case01"),
    );
    server.update();
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg!.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: "保存して更新する", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-generation", "1");
    const other = await context.newPage();
    await other.goto(`${server.url}#list`);
    await expect(
      other.getByRole("heading", { name: "ベーシック", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "事件一覧へ", exact: true }).click();
    await page
      .getByRole("button", { name: "保存して更新する", exact: true })
      .click();
    await expect(
      page.getByText(
        "更新する前に、このゲームを開いている他のタブやウィンドウを閉じてください。",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-generation", "1");
    await other.close();
    await page
      .getByRole("button", { name: "保存して更新する", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-generation", "2");
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).activeAttempt.attemptId,
        storageKey("case01"),
      ),
    ).toBe(before);
    await page.getByRole("button", { name: "続きから調査する" }).click();
    await tab(page, "報告").click();
    await expect(input).toBeChecked();
  } finally {
    await server.close();
  }
});
test("saving failure disables update application", async ({ page }) => {
  const server = await pwaServer();
  try {
    await page.goto(`${server.url}#list`);
    await expect(
      page.getByText("オフライン準備完了", { exact: true }),
    ).toBeVisible();
    server.update();
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    await expect(
      page.getByRole("button", { name: "保存して更新する", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("full", "QuotaExceededError");
      };
    });
    await page
      .getByRole("button", { name: "保存して更新する", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "保存して更新する", exact: true }),
    ).toBeDisabled();
    await expect(page.locator("html")).toHaveAttribute("data-generation", "1");
  } finally {
    await server.close();
  }
});
