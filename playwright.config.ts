import { defineConfig, devices } from "@playwright/test";

// First run: `pnpm exec playwright install chromium` (downloads the test browser).
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: { command: "node node_modules/next/dist/bin/next dev --turbopack -p 3000", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
