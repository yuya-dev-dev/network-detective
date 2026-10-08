import { expect, test, type Page } from "@playwright/test";

type AudioWindow = Window & {
  testContexts?: AudioContext[];
  testSource?: AudioBufferSourceNode;
  clickCount?: number;
  testSources?: AudioBufferSourceNode[];
  testOscillators?: OscillatorNode[];
  releaseTitle?: () => void;
};
async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    const OriginalContext = window.AudioContext;
    if (!OriginalContext) return;
    const state = window as AudioWindow;
    state.testContexts = [];
    state.clickCount = 0;
    state.testSources = [];
    state.testOscillators = [];
    window.AudioContext = class extends OriginalContext {
      constructor() {
        super();
        state.testContexts!.push(this);
      }
      createBufferSource() {
        const source = super.createBufferSource();
        state.testSource = source;
        state.testSources!.push(source);
        return source;
      }
      createOscillator() {
        state.clickCount!++;
        const node = super.createOscillator();
        state.testOscillators!.push(node);
        return node;
      }
    };
  });
}
async function requireAudio(page: Page) {
  test.skip(
    await page.evaluate(() => typeof AudioContext !== "function"),
    "Windows WebKit lacks AudioContext; unsupported audio is tested separately.",
  );
}
async function playing(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = window as AudioWindow;
        const context = state.testContexts?.at(-1);
        return (
          context?.state === "running" &&
          context.currentTime > 0 &&
          state.testSource?.context === context &&
          (state.testSource?.buffer?.duration ?? 0) > 60
        );
      }),
    )
    .toBe(true);
}
async function clickCount(page: Page) {
  return page.evaluate(() => (window as AudioWindow).clickCount ?? 0);
}

test("a stage redirect during playback restores title music without another gesture", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  await requireAudio(page);
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await playing(page);
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testSources!.length),
    )
    .toBe(2);
  await page.getByRole("button", { name: "事件一覧へ" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testSources!.length),
    )
    .toBe(3);
  await page.evaluate(() => {
    location.hash = "#case12/brief";
  });
  await expect(page).toHaveURL(/#list\/network$/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const sources = (window as AudioWindow).testSources!;
        return (
          sources.length > 3 && sources.at(-1)!.buffer === sources[0].buffer
        );
      }),
    )
    .toBe(true);
  await playing(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(1);
});

test("a redirected stage URL uses title music until a stage is selected", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/#case12/brief");
  await requireAudio(page);
  await expect(page).toHaveURL(/#list\/network$/);
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page
    .getByRole("button", { name: "ホワイトモードに切り替える" })
    .click();
  await playing(page);
  expect(requested.some((url) => url.endsWith("/audio/title.mp3"))).toBe(true);
  expect(
    requested.some((url) => url.endsWith("/audio/investigation.mp3")),
  ).toBe(false);
});

test("mode and stage choices chime; choosing a stage switches music and tabs preserve it", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  await requireAudio(page);
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await playing(page);
  expect(
    await page.evaluate(() =>
      (window as AudioWindow).testOscillators!.map(
        (node) => node.frequency.value,
      ),
    ),
  ).toEqual([1108, 1662, 3055]);
  const switchRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/audio/")) switchRequests.push(request.url());
  });
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testSources!.length),
    )
    .toBe(2);
  await playing(page);
  expect(
    switchRequests.some((url) => url.endsWith("/audio/investigation.mp3")),
  ).toBe(true);
  expect(await clickCount(page)).toBe(6);
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await page
    .getByRole("navigation", { name: "調査タブ" })
    .getByRole("button", { name: "証拠", exact: true })
    .click();
  expect(await clickCount(page)).toBe(8);
  expect(
    await page.evaluate(() => (window as AudioWindow).testSources!.length),
  ).toBe(2);
  await page.getByRole("button", { name: "事件一覧へ" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testSources!.length),
    )
    .toBe(3);
  expect(
    await page.evaluate(() => {
      const sources = (window as AudioWindow).testSources!;
      return (
        sources[0].buffer === sources[2].buffer &&
        sources[0].buffer !== sources[1].buffer
      );
    }),
  ).toBe(true);
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "続きから調査する" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testSources!.length),
    )
    .toBe(4);
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(1);
});

test("stage selection during title decoding never starts the obsolete title track", async ({
  page,
}) => {
  await observeAudio(page);
  await page.addInitScript(() => {
    const decode = AudioContext.prototype.decodeAudioData;
    let first = true;
    AudioContext.prototype.decodeAudioData = async function (
      data: ArrayBuffer,
    ) {
      const buffer = await decode.call(this, data);
      if (first) {
        first = false;
        await new Promise<void>((resolve) => {
          Object.assign(window, { releaseTitle: resolve });
        });
      }
      return buffer;
    };
  });
  await page.goto("/");
  await requireAudio(page);
  await page
    .getByRole("button", { name: "ネットワークモードを選ぶ", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => "releaseTitle" in window))
    .toBe(true);
  await page
    .locator('[data-case-id="case12"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await page.evaluate(() => (window as AudioWindow).releaseTitle!());
  await playing(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testSources!.length),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => (window as AudioWindow).testSource!.buffer!.duration,
    ),
  ).toBeLessThan(61.5);
});

test("default music and clicks start on interaction, stay across cases, stop on departure and work offline", async ({
  page,
  context,
}) => {
  await observeAudio(page);
  await page.goto("/");
  await requireAudio(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts?.length),
  ).toBe(0);
  await expect(page.getByRole("button", { name: /BGM|効果音/ })).toHaveCount(0);
  await expect(
    page.getByText("オフライン準備完了", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await playing(page);
  expect(await clickCount(page)).toBe(3);
  expect(
    await page.evaluate(() => (window as AudioWindow).testSource!.loop),
  ).toBe(true);
  await expect(
    page.getByText("オフライン準備完了", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "タイトルへ戻る" }).click();
  await page
    .getByRole("button", { name: "セキュリティモードを選ぶ", exact: true })
    .click();
  await page
    .locator('[data-case-id="case07"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await playing(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testContexts!.at(-1)!.state),
    )
    .toBe("closed");
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(1);
  await page
    .getByRole("button", { name: "ホワイトモードに切り替える" })
    .click();
  await playing(page);
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(2);
  await page.evaluate(() =>
    (window as AudioWindow).testContexts!.at(-1)!.suspend(),
  );
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testContexts!.at(-1)!.state),
    )
    .toBe("closed");
  await context.setOffline(true);
  await page.reload();
  expect(
    await page.evaluate(() => (window as AudioWindow).testContexts!.length),
  ).toBe(0);
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/audio/investigation.mp3"),
  );
  await page.getByRole("button", { name: "ダークモードに切り替える" }).click();
  expect((await response).fromServiceWorker()).toBe(true);
  await playing(page);
});

test("audio rejection keeps interaction working and retries on the next gesture", async ({
  page,
}) => {
  await observeAudio(page);
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume;
    let first = true;
    AudioContext.prototype.resume = function () {
      if (first) {
        first = false;
        return Promise.reject(
          new DOMException("Playback denied", "NotAllowedError"),
        );
      }
      return resume.call(this);
    };
  });
  await page.goto("/");
  await requireAudio(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as AudioWindow).testContexts!.at(-1)!.state),
    )
    .toBe("closed");
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await playing(page);
  expect(errors).toEqual([]);
});

test("missing audio support does not prevent theme switching or investigation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    }),
  );
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
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await expect(
    page.getByRole("navigation", { name: "調査タブ" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("missing music leaves click feedback available without blocking navigation", async ({
  page,
}) => {
  await observeAudio(page);
  await page.route("**/audio/*.mp3", (route) => route.fulfill({ status: 404 }));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await requireAudio(page);
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  expect(await clickCount(page)).toBe(3);
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  expect(await clickCount(page)).toBe(6);
  expect(errors).toEqual([]);
});

test("keyboard, dialog and check controls play one click; disabled actions stay silent", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/");
  await requireAudio(page);
  const theme = page.getByRole("button", {
    name: "ホワイトモードに切り替える",
  });
  await theme.focus();
  await page.keyboard.press("Enter");
  expect(await clickCount(page)).toBe(1);
  await page
    .getByRole("button", { name: "ベーシックモードを選ぶ", exact: true })
    .click();
  await page
    .locator('[data-case-id="case01"]')
    .getByRole("button", { name: "依頼を開く" })
    .click();
  await page.getByRole("button", { name: "現場の調査を始める" }).click();
  await page.getByRole("button", { name: "用語辞典", exact: true }).click();
  let count = await clickCount(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  expect(await clickCount(page)).toBe(count + 1);
  const node = page.locator('[data-node-id="N_SALES"]').first();
  await node.focus();
  count = await clickCount(page);
  await page.keyboard.press("Enter");
  expect(await clickCount(page)).toBe(count + 1);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .last()
    .click();
  await page
    .getByRole("navigation", { name: "調査タブ" })
    .getByRole("button", { name: "証拠", exact: true })
    .click();
  count = await clickCount(page);
  await page.getByRole("checkbox").first().check();
  expect(await clickCount(page)).toBe(count + 1);
  await page.getByRole("button", { name: "ヒント 0/3" }).click();
  for (let level = 1; level <= 3; level++)
    await page
      .getByRole("button", { name: "第" + level + "段階のヒントを開く" })
      .click();
  const disabled = page.getByRole("button", {
    name: "すべてのヒントを開きました",
  });
  await expect(disabled).toBeDisabled();
  count = await clickCount(page);
  const box = await disabled.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  expect(await clickCount(page)).toBe(count);
});
