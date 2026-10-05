import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  timeout: 60_000,
  workers: 1,
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium-desktop", testIgnore: "maps.spec.ts", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
    {
      name: "chromium-mobile",
      testIgnore: "episodes.spec.ts",
      use: { ...devices["Pixel 7"], browserName: "chromium" },
    },
    {
      name: "webkit-mobile",
      testIgnore: "episodes.spec.ts",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
});
