import { expect, test, type Page } from "@playwright/test";
import {
  playableScenario as scenario,
  getSolution,
} from "../../src/scenario/load";
import { correctReport } from "../helpers/report";
import type { Report } from "../../src/game/types";
import { storageKey } from "../../src/storage/localStorage";
const key = storageKey(scenario.id);
import {
  tab,
  start,
  readAll,
  fill,
  submit,
  noOverflow,
  openReportGroup,
} from "../helpers/play";
test("complete mobile investigation, hints, explanation links and separate retry records", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await start(page);
  await noOverflow(page);
  await expect(
    page.getByText(getSolution().causalChain[3].text, { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "用語辞典" }).click();
  await expect(page.getByRole("dialog", { name: "用語辞典" })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "ヒント 0/3" }).click();
  for (let level = 1; level <= 3; level++) {
    await page
      .getByRole("button", { name: `第${level}段階のヒントを開く` })
      .click();
    await expect(
      page.getByRole("heading", { name: `第${level}段階`, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  await readAll(page);
  await noOverflow(page);
  await tab(page, "仮説").click();
  const card = page.locator(".paper-card").filter({
    has: page.getByRole("heading", {
      name: scenario.hypotheses[0].label,
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "有力", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "有力", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await card.locator("summary").click();
  const link = card.getByRole("combobox").first();
  await link.selectOption("support");
  await expect(link).toHaveValue("support");
  await fill(page, correctReport());
  await noOverflow(page);
  await submit(page);
  await expect(page.locator(".result-banner h1")).toHaveText("解決");
  await expect(page.locator(".score")).toHaveText("100/100");
  await expect(page.getByText("ヒント使用：第3段階まで")).toBeVisible();
  await page.reload();
  await expect(page.locator(".score")).toHaveText("100/100");
  await page.locator(".evidence-refs button").first().click();
  await expect(page.getByText("解説から証拠を確認中 · 閲覧のみ")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /確認済み/ })).toHaveCount(0);
  await page.getByRole("button", { name: "解説へ戻る" }).click();
  await page.goto("/#investigation/report");
  await expect(page.locator(".result-banner")).toBeVisible();
  await expect(tab(page, "報告")).toHaveCount(0);
  await page.getByRole("button", { name: "別の試行で再挑戦" }).click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  const second = {
    ...correctReport(),
    causeId: scenario.hypotheses[0].id,
    claims: correctReport().claims.map((claim) => ({
      ...claim,
      evidenceIds: ["E08"],
    })),
  };
  await readAll(page);
  await fill(page, second);
  await submit(page);
  await expect(page.locator(".result-banner h1")).toHaveText(
    "調査完了・再検討あり",
  );
  await page
    .getByRole("button", { name: "事件一覧へ", exact: true })
    .last()
    .click();
  await expect(page.getByText("初回 100点", { exact: true })).toBeVisible();
  await expect(page.getByText("2回の報告", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({ path: info.outputPath("completed-list.png") });
});
test("draft, confirmation checks and hypothesis notes survive browser back and reload", async ({
  page,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  await page.locator('[data-evidence-id="E01"]').click();
  await page
    .getByRole("checkbox", { name: "E01を確認済みにする", exact: true })
    .check();
  await expect(
    page.getByRole("checkbox", { name: "E01を確認済みにする", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "証拠一覧へ戻る" }).click();
  await tab(page, "報告").click();
  const input = page.locator('input[name="causeId"]').first();
  await openReportGroup(page, "causeId");
  await input.check();
  await expect(input).toBeChecked();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "資料と診断", exact: true }),
  ).toBeVisible();
  await tab(page, "報告").click();
  await expect(input).toBeChecked();
  await page.reload();
  await expect(input).toBeChecked();
  await tab(page, "証拠").click();
  await page
    .getByRole("button", { name: "確認済み（1）", exact: true })
    .click();
  await expect(page.locator(".evidence-card")).toHaveCount(1);
});
test("expanded panels and tab scroll positions remain intact", async ({
  page,
}) => {
  await start(page);
  await page.getByText("構成と通信経路を文字で読む", { exact: true }).click();
  await page.getByText("正常要件と調査の前提", { exact: true }).click();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  const before = await page.evaluate(() => window.scrollY);
  await tab(page, "証拠").click();
  await tab(page, "構成").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  await expect(page.locator("details[open]")).toHaveCount(2);
  const bounds = await page
    .locator(".map-panel svg text")
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const b = (n as SVGGraphicsElement).getBBox();
        const width = ((n as SVGGraphicsElement).ownerSVGElement as SVGSVGElement).viewBox.baseVal.width;
        return b.x >= 0 && b.x + b.width <= width;
      }),
    );
  expect(bounds.every(Boolean)).toBe(true);
});
test("phone widths stay readable with a bottom internal-monologue panel", async ({
  page,
}, info) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await noOverflow(page);
    await expect(
      page.getByRole("button", { name: "捜査を始める", exact: true }),
    ).toBeVisible();
    const image = page.locator(".title-background");
    expect(
      await image.evaluate(
        (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`title-${width}.png`) });
    await page
      .getByRole("button", { name: "捜査を始める", exact: true })
      .click();
    await expect(page.locator(".inner-voice")).toBeVisible();
    expect(
      await page
        .locator(".inner-voice p")
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath(`list-${width}.png`) });
  }
  await start(page);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("investigation-430.png") });
  const sizes = await tab(page, "構成").evaluate((e) => ({
    width: e.getBoundingClientRect().width,
    height: e.getBoundingClientRect().height,
  }));
  expect(sizes.width).toBeGreaterThanOrEqual(44);
  expect(sizes.height).toBeGreaterThanOrEqual(44);
  await tab(page, "証拠").click();
  for (const id of ["E03", "E04", "E05"]) {
    await page.locator(`[data-evidence-id="${id}"]`).click();
    await noOverflow(page);
    if (id === "E04") {
      await page.getByRole("button", { name: "行の詳細", exact: true }).click();
      await expect(page.locator(".log-details article")).toHaveCount(2);
    }
    await page.getByRole("button", { name: "証拠一覧へ戻る" }).click();
  }
});
test("broken saves and storage failure are recoverable", async ({ page }) => {
  await page.goto("/#list");
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), key);
  await page.reload();
  await expect(
    page.getByText(
      "セーブデータを読み込めませんでした。新しい試行を開始してください。",
    ),
  ).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await page.reload();
  await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await expect(page.getByText("保存不可", { exact: true })).toBeVisible();
  await tab(page, "証拠").click();
  await expect(page.locator(".evidence-card")).toHaveCount(8);
});
test("topology overview fits above the dock and expands without losing nodes", async ({
  page,
}) => {
  await start(page);
  for (const [width, height] of [
    [360, 640],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const map = document
            .querySelector(".map-overview")!
            .getBoundingClientRect();
          const actions = document
            .querySelector(".map-actions")!
            .getBoundingClientRect();
          const dock = document
            .querySelector(".game-dock")!
            .getBoundingClientRect();
          const header = document
            .querySelector(".app-header")!
            .getBoundingClientRect();
          const nodes = [
            ...document.querySelectorAll(".map-overview g[role=button]"),
          ];
          return (
            map.top >= header.bottom &&
            actions.bottom <= dock.top &&
            nodes.length === 6 &&
            nodes.every((node) => node.getBoundingClientRect().height >= 44)
          );
        }),
      )
      .toBe(true);
    await noOverflow(page);
  }
  await page
    .getByRole("button", { name: "拡大して見る ↗", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "構成図を拡大",
    exact: true,
  });
  await expect(dialog.locator("g[role=button]")).toHaveCount(6);
  await dialog
    .getByRole("button", { name: "構成図を拡大", exact: true })
    .click();
  await expect(dialog.getByText("175%", { exact: true })).toBeVisible();
  const region = dialog.getByRole("region", { name: "拡大構成図" });
  expect(await region.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(
    true,
  );
  await dialog
    .getByRole("button", {
      name: `${scenario.topology.nodes[5].label}の詳細`,
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole("heading", {
      name: scenario.topology.nodes[5].label,
      exact: true,
    }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  await expect(page.locator(".map-overview")).toBeVisible();
});
test("browser back closes topology and report dialogs without blocking tabs", async ({
  page,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  for (const name of [
    "拡大して見る ↗",
    `${scenario.topology.nodes[0].label}の詳細`,
  ]) {
    await tab(page, "構成").click();
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("dialog:modal")).toHaveCount(1);
    await page.goBack();
    await expect(page.locator("dialog:modal")).toHaveCount(0);
    await expect(page.locator(".evidence-card")).toHaveCount(8);
  }
  await readAll(page);
  await fill(page, correctReport());
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await expect(page.locator("dialog:modal")).toHaveCount(1);
  await page.goBack();
  await expect(page.locator("dialog:modal")).toHaveCount(0);
  await tab(page, "報告").click();
  await expect(page.locator("dialog:modal")).toHaveCount(0);
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("report overview exposes missing input and keeps selections across tabs", async ({
  page,
}) => {
  await start(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await tab(page, "報告").click();
  await expect(page.locator(".report-group")).toHaveCount(6);
  await expect(page.locator(".report-group[open]")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .querySelector(".report-page > .primary")!
            .getBoundingClientRect().bottom <=
          document.querySelector(".game-dock")!.getBoundingClientRect().top,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await expect(
    page.locator('.report-group[data-report-field="scopeId"]'),
  ).toHaveAttribute("open", "");
  const input = page.locator('input[name="scopeId"]').first();
  await input.check();
  const summary = page.locator(
    '.report-group[data-report-field="scopeId"] summary',
  );
  await expect(summary).toContainText(
    scenario.reportOptions.scopeOptions[0].label,
  );
  await tab(page, "証拠").click();
  await tab(page, "報告").click();
  await expect(input).toBeChecked();
  await expect(
    page.locator('.report-group[data-report-field="scopeId"]'),
  ).toHaveAttribute("open", "");
});
test("a critical selection never succeeds and adds no hidden penalty", async ({
  page,
}) => {
  await start(page);
  await readAll(page);
  await fill(page, {
    ...correctReport(),
    repairId: getSolution().criticalOptionIds[0],
  });
  await submit(page);
  await expect(page.locator(".result-banner h1")).toHaveText(
    "調査完了・再検討あり",
  );
  await expect(page.locator(".score")).toHaveText("90/100");
  await expect(page.locator(".critical-notice")).toBeVisible();
});
test("other tabs cannot overwrite a submitted attempt or the first record", async ({
  page,
  context,
}) => {
  await start(page);
  await readAll(page);
  await fill(page, correctReport());
  const other = await context.newPage();
  await other.goto("/#investigation/report");
  await expect(tab(other, "報告")).toBeVisible();
  await submit(page);
  await expect(other.locator(".result-banner")).toBeVisible();
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  await other.goto("/#investigation/report");
  await expect(other.locator(".result-banner")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).records.length,
        key,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).records[0].result,
      key,
    ),
  ).toEqual(stored.records[0].result);
});
test("simultaneous submissions are serialized across tabs", async ({
  page,
  context,
}) => {
  await start(page);
  await readAll(page);
  await fill(page, correctReport());
  const other = await context.newPage();
  await other.goto("/#investigation/report");
  await Promise.all([
    page.getByRole("button", { name: "報告内容を確認する" }).click(),
    other.getByRole("button", { name: "報告内容を確認する" }).click(),
  ]);
  // Hold the shared lock until both tabs have queued their real submit handlers.
  // Otherwise the first submit correctly removes the second tab's dialog before a click.
  await page.evaluate((key) => {
    const control = window as typeof window & {
      lockHeld?: boolean;
      releaseLock?: () => void;
    };
    void navigator.locks.request(
      key,
      () =>
        new Promise<void>((resolve) => {
          control.releaseLock = resolve;
          control.lockHeld = true;
        }),
    );
  }, key);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { lockHeld?: boolean }).lockHeld,
      ),
    )
    .toBe(true);
  await Promise.all([
    page
      .getByRole("dialog")
      .getByRole("button", { name: "この報告を提出する" })
      .click(),
    other
      .getByRole("dialog")
      .getByRole("button", { name: "この報告を提出する" })
      .click(),
  ]);
  await expect(page.locator(".result-banner")).toBeVisible();
  await expect(other.locator(".result-banner")).toBeVisible();
  await page.evaluate(() =>
    (window as typeof window & { releaseLock?: () => void }).releaseLock!(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).activeAttempt.phase,
        key,
      ),
    )
    .toBe("completed");
  const value = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(value.records).toHaveLength(1);
  expect(value.activeAttempt.result).toEqual(value.records[0].result);
});

test("evidence-list checks are independent of opening and survive reload", async ({
  page,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  const evidence = scenario.evidence[0];
  const checkbox = page.getByRole("checkbox", {
    name: `${evidence.id}を確認済みにする`,
    exact: true,
  });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(
    page.getByRole("heading", { name: "資料と診断", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("閲覧 0/8", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).activeAttempt
            .pinnedEvidenceIds,
        key,
      ),
    )
    .toEqual([evidence.id]);
  await page.reload();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText("閲覧 0/8", { exact: true })).toBeVisible();
  const target = await checkbox.locator("..").boundingBox();
  expect(target!.width).toBeGreaterThanOrEqual(44);
  expect(target!.height).toBeGreaterThanOrEqual(44);
  await page.locator(`[data-evidence-id="${evidence.id}"]`).click();
  await expect(checkbox).toBeChecked();
  await expect(
    page.getByRole("heading", { name: evidence.title, exact: true }),
  ).toBeVisible();
  await checkbox.uncheck();
  await page.getByRole("button", { name: "証拠一覧へ戻る" }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByText("閲覧 1/8", { exact: true })).toBeVisible();
  await page.reload();
  await expect(checkbox).not.toBeChecked();
});

test("concurrent confirmation checks set ON once across tabs instead of toggling twice", async ({
  page,
  context,
}) => {
  await start(page);
  await tab(page, "証拠").click();
  const evidence = scenario.evidence[0];
  const other = await context.newPage();
  await other.goto("/#investigation/evidence");
  const first = page.getByRole("checkbox", {
    name: `${evidence.id}を確認済みにする`,
    exact: true,
  });
  const second = other.getByRole("checkbox", {
    name: `${evidence.id}を確認済みにする`,
    exact: true,
  });
  await expect(first).not.toBeChecked();
  await expect(second).not.toBeChecked();
  await page.evaluate((key) => {
    const control = window as typeof window & {
      lockHeld?: boolean;
      releaseLock?: () => void;
    };
    void navigator.locks.request(
      key,
      () =>
        new Promise<void>((resolve) => {
          control.releaseLock = resolve;
          control.lockHeld = true;
        }),
    );
  }, key);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { lockHeld?: boolean }).lockHeld,
      ),
    )
    .toBe(true);
  try {
    await Promise.all([first.check(), second.check()]);
    await expect(first).toBeChecked();
    await expect(second).toBeChecked();
  } finally {
    await page.evaluate(() =>
      (window as typeof window & { releaseLock?: () => void }).releaseLock!(),
    );
  }
  // Wait behind both real checkbox writes before reloading either tab.
  await page.evaluate((key) => navigator.locks.request(key, () => {}), key);
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).activeAttempt
            .pinnedEvidenceIds,
        key,
      ),
    )
    .toEqual([evidence.id]);
  await other.reload();
  await expect(second).toBeChecked();
  await expect(first).toBeChecked();
  await expect(page.getByText("閲覧 0/8", { exact: true })).toBeVisible();
  await second.uncheck();
  await expect(first).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).activeAttempt
            .pinnedEvidenceIds,
        key,
      ),
    )
    .toEqual([]);
});

test("report requires three claims, explains evidence counts and preserves partial credit", async ({
  page,
}) => {
  await start(page);
  await readAll(page);
  const complete = correctReport();
  await fill(page, { ...complete, claims: [] });
  const summary = page.locator('[data-report-field="claims"] > summary');
  await expect(summary).toContainText("主張3枚を選択 · 0/3枚");
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "判断根拠の主張を3枚選んでください",
  );
  await expect(page.locator("dialog:modal")).toHaveCount(0);
  for (const option of scenario.reportOptions.claimOptions) {
    const card = page.locator(".claim-option").filter({
      has: page.getByText(option.label, { exact: true }),
    });
    await expect(card.locator(".claim-requirement")).toHaveText(
      `必要な証拠：${option.requiredEvidenceCount}件`,
    );
  }
  const partialOption = scenario.reportOptions.claimOptions.find(
    (option) =>
      option.requiredEvidenceCount === 2 &&
      complete.claims.some((claim) => claim.claimId === option.id),
  )!;
  const remaining = complete.claims.filter(
    (claim) => claim.claimId !== partialOption.id,
  );
  await fill(page, { ...complete, claims: remaining });
  await expect(summary).toContainText("2/3枚");
  await page.getByRole("button", { name: "報告内容を確認する" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "判断根拠の主張を3枚選んでください",
  );
  await expect(page.locator("dialog:modal")).toHaveCount(0);
  const partial = complete.claims.find(
    (claim) => claim.claimId === partialOption.id,
  )!;
  await fill(page, {
    ...complete,
    claims: [{ ...partial, evidenceIds: partial.evidenceIds.slice(0, 1) }],
  });
  await expect(summary).toContainText("3/3枚");
  const partialCard = page.locator(".claim-option").filter({
    has: page.getByText(partialOption.label, { exact: true }),
  });
  await expect(partialCard).toContainText("証拠が不足しています");
  for (const option of scenario.reportOptions.claimOptions.filter(
    (option) => !complete.claims.some((claim) => claim.claimId === option.id),
  )) {
    await expect(
      page
        .locator(".claim-option")
        .filter({
          has: page.getByText(option.label, { exact: true }),
        })
        .locator('input[type="checkbox"]')
        .first(),
    ).toBeDisabled();
  }
  const supportingRule = getSolution().claimRules.find(
    (rule) =>
      remaining.some((claim) => claim.claimId === rule.claimId) &&
      rule.allowedSupportingEvidenceIds.length > 0,
  )!;
  const supportingOption = scenario.reportOptions.claimOptions.find(
    (option) => option.id === supportingRule.claimId,
  )!;
  const supportingCard = page.locator(".claim-option").filter({
    has: page.getByText(supportingOption.label, { exact: true }),
  });
  await supportingCard
    .locator(".check-row")
    .filter({ hasText: supportingRule.allowedSupportingEvidenceIds[0] })
    .locator("input")
    .check();
  await expect(supportingCard.locator(".check-row input:checked")).toHaveCount(
    2,
  );
  await expect(supportingCard.locator(".check-row input:disabled")).toHaveCount(
    scenario.evidence.length - 2,
  );
  await page.getByText("判断根拠の採点基準", { exact: true }).click();
  await expect(page.locator(".grading-guide")).toContainText("5点");
  await expect(page.locator(".grading-guide")).toContainText(
    "件数を満たすだけでは得点になりません",
  );
  await submit(page);
  await expect(page.locator(".score")).toHaveText("95/100");
  const result = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).records[0].result,
    key,
  );
  expect(
    result.claimScores.find(
      (claim: { claimId: string }) => claim.claimId === partialOption.id,
    ),
  ).toMatchObject({ points: 5, reason: "partial" });
});
