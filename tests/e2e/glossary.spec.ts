import { expect, test } from "@playwright/test";
import { noOverflow, start } from "../helpers/play";

for (const theme of ["dark", "white"] as const) {
  test(
    "study reference searches ports and security without altering progress: " +
      theme,
    async ({ page }, info) => {
      await page.setViewportSize({
        width: theme === "dark" ? 360 : 430,
        height: 844,
      });
      await start(page);
      if (theme === "white")
        await page
          .getByRole("button", { name: "ホワイトモードに切り替える" })
          .click();
      await expect.poll(() => page.evaluate(() => localStorage.getItem("network-detective:save:case01"))).not.toBeNull();
      const before = await page.evaluate(() =>
        Object.entries(localStorage).filter(([key]) => key.startsWith("network-detective:")),
      );
      await page.getByRole("button", { name: "用語辞典", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "用語辞典" });
      const search = dialog.getByRole("searchbox", {
        name: "用語・番号を検索",
      });
      await expect(dialog.getByText("TCP/21", { exact: true })).toBeVisible();
      await search.fill("ftp");
      await expect(dialog.getByText("TCP/20", { exact: true })).toBeVisible();
      await expect(dialog.getByText(/パッシブ方式では/)).toBeVisible();
      await search.fill("１６２");
      await expect(
        dialog.getByText("SNMP 通知", { exact: true }),
      ).toBeVisible();
      await expect(dialog.getByText("UDP/162", { exact: true })).toBeVisible();
      await search.fill("最小権限");
      await expect(
        dialog.getByText("最小権限の原則", { exact: true }),
      ).toBeVisible();
      await search.fill("ディジタルフォレンジックス");
      await expect(
        dialog.getByText("デジタルフォレンジック", { exact: true }),
      ).toBeVisible();
      await search.fill("存在しない用語XYZ");
      await expect(dialog.getByText(/一致する用語がありません/)).toBeVisible();
      await dialog
        .getByRole("button", { name: "セキュリティ", exact: true })
        .click();
      await expect(search).toHaveValue("");
      await expect(dialog.getByText("多層防御", { exact: true })).toBeVisible();
      await noOverflow(page);
      expect(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath("glossary-" + theme + ".png"),
      });
      await dialog
        .getByRole("button", { name: "この事件", exact: true })
        .click();
      await expect(dialog.locator("dt").first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          Object.entries(localStorage).filter(([key]) => key.startsWith("network-detective:")),
        ),
      ).toEqual(before);
    },
  );
}

test("study reference remains available without a network connection", async ({
  page,
  context,
}) => {
  await page.goto("/#list/basic");
  await context.setOffline(true);
  try {
    await page.getByRole("button", { name: "用語辞典", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "用語辞典" });
    await dialog.getByRole("searchbox").fill("UDP/161");
    await expect(
      dialog.getByText("SNMP 問い合わせ", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("searchbox").fill("CSRF");
    await expect(
      dialog.getByText("クロスサイトリクエストフォージェリ（CSRF）", {
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
