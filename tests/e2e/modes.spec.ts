import { expect, test } from "@playwright/test";
import { start, tab, openReportGroup } from "../helpers/play";
import { storageKey } from "../../src/storage/localStorage";

test("three title entrances isolate episode lists and retain navigation on reload", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "モード選択" }).getByRole("button"),
  ).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("title.png") });
  for (const [mode, label, count] of [
    ["basic", "ベーシック", 6],
    ["network", "ネットワーク", 5],
    ["security", "セキュリティ", 5],
  ] as const) {
    await page
      .getByRole("button", { name: `${label}モードを選ぶ`, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#list/${mode}$`));
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".case-card")).toHaveCount(count);
    await page.reload();
    await expect(page.locator(".case-card")).toHaveCount(count);
    if (!count)
      await expect(page.locator(".mode-empty")).toContainText("今後追加");
    await page.getByRole("button", { name: "事件一覧へ", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#list/${mode}$`));
    await page.getByRole("button", { name: "タイトルへ戻る" }).click();
  }
  await page.goBack();
  await expect(page).toHaveURL(/#list\/security$/);
  await expect(page.locator('[data-case-id="case01"]')).toHaveCount(0);
});

test("basic and security investigation drafts survive mode switches without sharing state", async ({
  page,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  await page
    .getByRole("checkbox", { name: "E01を確認済みにする", exact: true })
    .check();
  await tab(page, "報告").click();
  await openReportGroup(page, "scopeId");
  await page.locator('input[name="scopeId"]').first().check();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) ?? "{}").activeAttempt
            ?.reportDraft.scopeId,
        storageKey("case01"),
      ),
    )
    .toBe(await page.locator('input[name="scopeId"]').first().inputValue());
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    storageKey("case01"),
  );
  await page.getByRole("button", { name: "事件一覧へ", exact: true }).click();
  await page.getByRole("button", { name: "タイトルへ戻る" }).click();
  await page
    .getByRole("button", { name: "セキュリティモードを選ぶ", exact: true })
    .click();
  await page
    .locator('[data-case-id="case07"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await tab(page, "証拠").click();
  await expect(
    page.getByRole("checkbox", { name: "E01を確認済みにする", exact: true }),
  ).not.toBeChecked();
  await page
    .getByRole("checkbox", { name: "E02を確認済みにする", exact: true })
    .check();
  await tab(page, "報告").click();
  await openReportGroup(page, "scopeId");
  await page.locator('input[name="scopeId"]').last().check();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) ?? "{}").activeAttempt
            ?.reportDraft.scopeId,
        storageKey("case07"),
      ),
    )
    .toBe(await page.locator('input[name="scopeId"]').last().inputValue());
  const securityBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    storageKey("case07"),
  );
  await page.getByRole("button", { name: "事件一覧へ", exact: true }).click();
  await page.getByRole("button", { name: "タイトルへ戻る" }).click();
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "続きから調査する" })
    .click();
  await tab(page, "報告").click();
  await openReportGroup(page, "scopeId");
  await expect(page.locator('input[name="scopeId"]').first()).toBeChecked();
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      storageKey("case01"),
    ),
  ).toBe(before);
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      storageKey("case07"),
    ),
  ).toBe(securityBefore);
  await page.goto("/#case07/investigation/evidence");
  await expect(
    page.getByRole("checkbox", { name: "E02を確認済みにする", exact: true }),
  ).toBeChecked();
});

test("a fresh security bookmark falls back to its own mode and legacy routes remain valid", async ({
  page,
}) => {
  await page.goto("/#case11/investigation/topology");
  await expect(page).toHaveURL(/#list\/security$/);
  await expect(page.locator(".case-card")).toHaveCount(5);
  await page.goto("/#investigation/topology");
  await expect(page).toHaveURL(/#list\/basic$/);
  await expect(page.locator(".case-card")).toHaveCount(6);
});
