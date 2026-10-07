import { expect, test } from "@playwright/test";
import c12 from "../../src/data/case12.json" with { type: "json" };
import c13 from "../../src/data/case13.json" with { type: "json" };
import c14 from "../../src/data/case14.json" with { type: "json" };
import c15 from "../../src/data/case15.json" with { type: "json" };
import c16 from "../../src/data/case16.json" with { type: "json" };
import type { Scenario } from "../../src/scenario/types";
import { assertScenario } from "../../src/scenario/validate";
import { tab, readAll, fill, submit } from "../helpers/play";
import { correctReport } from "../helpers/report";
const scenarios: Scenario[] = [c12, c13, c14, c15, c16].map((value) => {
  assertScenario(value);
  return value;
});

for (const scenario of scenarios)
  test(`${scenario.id} complete network investigation, report and saved result`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#list/network");
    await expect(page.locator(".case-card")).toHaveCount(5);
    if (scenario.id === "case16") {
      await expect(
        page.getByRole("status").filter({ hasText: "オフライン準備完了" }),
      ).toBeVisible();
      await page.context().setOffline(true);
    }
    await page
      .locator(`[data-case-id="${scenario.id}"]`)
      .getByRole("button", { name: "依頼を開く" })
      .click();
    const intro = page.getByRole("region", { name: "依頼人との会話" });
    await expect(intro.locator(".conversation-controls")).toContainText(
      "1 / 10",
    );
    for (let i = 0; i < 9; i++)
      await intro.getByRole("button", { name: "次の発言" }).click();
    await expect(intro.locator(".conversation-controls")).toContainText(
      "10 / 10",
    );
    await page.getByRole("button", { name: "現場の調査を始める" }).click();
    await expect(tab(page, "構成")).toBeVisible();
    await expect(
      page.getByText(scenario.solution.causalChain[0].text, { exact: true }),
    ).not.toBeVisible();
    await readAll(page, scenario);
    await fill(page, correctReport(scenario.solution), scenario);
    await page.reload();
    await expect(
      page.locator(
        `input[name="causeId"][value="${scenario.solution.causeId}"]`,
      ),
    ).toBeChecked();
    await submit(page);
    await expect(page.locator(".score")).toHaveText("100/100");
    await expect(page.locator(".result-banner h1")).toHaveText("解決");
    await expect(
      page.getByRole("region", { name: "報告後の会話" }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".score")).toHaveText("100/100");
    await page.locator(".evidence-refs button").first().click();
    await expect(
      page.getByText("解説から証拠を確認中 · 閲覧のみ"),
    ).toBeVisible();
    await page.getByRole("button", { name: "解説へ戻る" }).click();
    await page
      .getByRole("button", { name: "事件一覧へ", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(/#list\/network$/);
    await expect(page.locator(".case-card")).toHaveCount(5);
    await expect(
      page.locator(`[data-case-id="${scenario.id}"] .record-summary`),
    ).toContainText("初回 100点");
    expect(errors).toEqual([]);
  });
