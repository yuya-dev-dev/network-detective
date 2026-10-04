import { expect, type Page } from "@playwright/test";
import { playableScenario as scenario } from "../../src/scenario/load";
import type { Report } from "../../src/game/types";
export const tab = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "調査タブ" })
    .getByRole("button", { name, exact: true });
export async function openReportGroup(page: Page, field: string) {
  const group = page.locator(`.report-group[data-report-field="${field}"]`);
  if (!(await group.evaluate((e: HTMLDetailsElement) => e.open)))
    await group.locator("summary").click();
}
export async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を始める", exact: true }).click();
  await page.getByRole("button", { name: "依頼を開く" }).click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await expect(tab(page, "構成")).toBeVisible();
}
export async function readAll(page: Page) {
  await tab(page, "証拠").click();
  await expect(page.locator(".evidence-card")).toHaveCount(8);
  for (const e of [...scenario.evidence].reverse()) {
    await page.locator(`[data-evidence-id="${e.id}"]`).click();
    await expect(
      page.getByRole("heading", { name: e.title, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "証拠一覧へ戻る" }).click();
  }
  await expect(page.getByText("閲覧 8/8", { exact: true })).toBeVisible();
}
export async function fill(page: Page, report: Report) {
  await tab(page, "報告").click();
  for (const field of [
    "scopeId",
    "causeId",
    "repairId",
    "preventionId",
    "verificationId",
  ] as const) {
    await openReportGroup(page, field);
    const input = page.locator(
      `input[name="${field}"][value="${report[field]}"]`,
    );
    await input.check();
    await expect(input).toBeChecked();
  }
  for (const claim of report.claims) {
    await openReportGroup(page, "claims");
    const label = scenario.reportOptions.claimOptions.find(
      (o) => o.id === claim.claimId,
    )!.label;
    const card = page
      .locator(".claim-option")
      .filter({ has: page.getByText(label, { exact: true }) });
    const selector = card.locator('input[type="checkbox"]').first();
    await selector.check();
    await expect(selector).toBeChecked();
    for (const id of claim.evidenceIds) {
      const input = card
        .locator(".check-row")
        .filter({ hasText: id })
        .locator("input");
      await input.check();
      await expect(input).toBeChecked();
    }
  }
}
export async function submit(page: Page) {
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "この報告を提出する" })
    .click();
  await expect(page.locator(".result-banner")).toBeVisible();
}
export async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
