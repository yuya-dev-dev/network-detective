import { expect, test, type Page } from "@playwright/test";
type AudioWindow = Window & {
  testContext?: AudioContext;
  testSource?: AudioBufferSourceNode;
};
async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext;
    if (!OriginalContext) return;
    window.AudioContext = class extends OriginalContext {
      constructor() {
        super();
        (window as AudioWindow).testContext = this;
      }
      createBufferSource() {
        const source = super.createBufferSource();
        (window as AudioWindow).testSource = source;
        return source;
      }
    };
  });
}
async function playing(page: Page) {
  await expect(
    page.getByRole("button", { name: "BGMをOFFにする" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window as AudioWindow;
        return (
          state.testContext?.state === "running" &&
          state.testContext.currentTime > 0 &&
          (state.testSource?.buffer?.duration ?? 0) > 60
        );
      }),
    )
    .toBe(true);
}
async function stopped(page: Page) {
  await expect(
    page.getByRole("button", { name: "BGMをONにする" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() => page.evaluate(() => (window as AudioWindow).testContext?.state))
    .toBe("closed");
}
test("generated MP3 plays only on request, survives navigation, stops on departure, and is cached", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  test.skip(
    await page.evaluate(() => typeof AudioContext !== "function"),
    "Windows WebKit lacks AudioContext; real Safari media remains an additional device check.",
  );
  await expect(
    page.getByRole("button", { name: "BGMをONにする" }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    await page.evaluate(() => (window as AudioWindow).testContext),
  ).toBeUndefined();
  await page.getByRole("button", { name: "捜査を始める", exact: true }).click();
  await expect(
    page.getByText("オフライン準備完了", { exact: true }),
  ).toBeVisible();
  await page.reload();
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/audio/investigation.mp3"),
  );
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  expect((await response).fromServiceWorker()).toBe(true);
  await playing(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testSource!.loop),
  ).toBe(true);
  await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
  await playing(page);
  await page.getByRole("button", { name: "BGMをOFFにする" }).click();
  await stopped(page);
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  await playing(page);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await stopped(page);
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await stopped(page);
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  await playing(page);
  await page.evaluate(() => (window as AudioWindow).testContext!.suspend());
  await stopped(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "BGMをONにする" }),
  ).toHaveAttribute("aria-pressed", "false");
});
test("audio playback rejection leaves the game usable and allows manual retry", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  test.skip(
    await page.evaluate(() => typeof AudioContext !== "function"),
    "Windows WebKit lacks AudioContext; unsupported audio is tested separately.",
  );
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume;
    let rejectFirst = true;
    AudioContext.prototype.resume = function () {
      if (rejectFirst) {
        rejectFirst = false;
        return Promise.reject(
          new DOMException("Playback denied", "NotAllowedError"),
        );
      }
      return resume.call(this);
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  await expect(
    page.getByRole("button", { name: "BGMをONにする" }),
  ).toHaveAttribute("title", /もう一度タップ/);
  await page.getByRole("button", { name: "捜査を始める", exact: true }).click();
  await expect(page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" })).toBeVisible();
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  await playing(page);
});
test("missing audio support does not prevent playing the game", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "BGMをONにする" }).click();
  await expect(
    page.getByRole("button", { name: "BGMをONにする" }),
  ).toHaveAttribute("title", /もう一度タップ/);
  await page.getByRole("button", { name: "捜査を始める", exact: true }).click();
  await page.locator('[data-case-id="case01"]').getByRole("button", { name: "依頼を開く" }).click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await expect(
    page.getByRole("navigation", { name: "調査タブ" }),
  ).toBeVisible();
});
