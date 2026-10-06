import { expect, test } from "@playwright/test";
import { noOverflow } from "../helpers/play";

for (const width of [360, 390, 430]) {
  test(
    "theme switch stays readable at " +
      width +
      "px and preserves investigation",
    async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(
        page.getByRole("button", { name: /BGM|効果音/ }),
      ).toHaveCount(0);
      await noOverflow(page);
      await page
        .getByRole("button", { name: "ホワイトモードに切り替える" })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "white");
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      await noOverflow(page);
      if (width === 390)
        await page.screenshot({ path: "test-results/theme-title-white.png" });
      await page.reload();
      await expect(
        page.getByRole("button", { name: "ダークモードに切り替える" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
        .click();
      await noOverflow(page);
      await page
        .locator('[data-case-id="case01"]')
        .getByRole("button", { name: "依頼を開く" })
        .click();
      await page.getByRole("button", { name: "現場の調査を始める" }).click();
      await noOverflow(page);
      await expect(page.locator(".map-node-title").first()).toHaveCSS(
        "fill",
        "rgb(21, 47, 67)",
      );
      if (width === 390)
        await page.screenshot({ path: "test-results/theme-map-white.png" });
      await page.getByRole("button", { name: "用語辞典", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCSS(
        "background-color",
        "rgb(248, 250, 252)",
      );
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "閉じる", exact: true })
        .last()
        .click();
      await page
        .getByRole("navigation", { name: "調査タブ" })
        .getByRole("button", { name: "証拠", exact: true })
        .click();
      await page.getByRole("checkbox").first().check();
      await page
        .getByRole("button", { name: "ダークモードに切り替える" })
        .click();
      await expect(page.getByRole("checkbox").first()).toBeChecked();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page
        .getByRole("navigation", { name: "調査タブ" })
        .getByRole("button", { name: "構成", exact: true })
        .click();
      await noOverflow(page);
      if (width === 390)
        await page.screenshot({ path: "test-results/theme-map-dark.png" });
      await page
        .getByRole("button", { name: "事件一覧へ", exact: true })
        .click();
      await page.getByRole("button", { name: "タイトルへ戻る" }).click();
      if (width === 390)
        await page.screenshot({ path: "test-results/theme-title-dark.png" });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    },
  );
}

test("blocked storage keeps the selected theme usable in memory", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "ホワイトモードに切り替える" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "white");
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ダークモードに切り替える" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
