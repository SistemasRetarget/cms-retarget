import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /(articles|categories|sources|landing-pages|users)\.spec\.ts/,
  fullyParallel: true,
  workers: 4,
  timeout: 30_000,
  reporter: [["list"], ["json", { outputFile: "test-results/prod-results.json" }]],
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:3000",
    trace: "off",
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
});
