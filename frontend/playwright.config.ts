import { defineConfig } from "@playwright/test"

const origin = "http://127.0.0.1:18543"
const apiUrl = process.env.HOSPITAL_QA_DEMO_API ?? origin
const suite = process.env.HOSPITAL_QA_DEMO_API ? "demonstracao" : "smoke"

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 25_000,
  testMatch: suite === "smoke" ? ["smoke.spec.ts", "paineis.spec.ts"] : "demonstracao.spec.ts",
  outputDir: "test-results/" + suite,
  reporter: [["list"], ["json", { outputFile: "test-results/" + suite + ".json" }]],
  use: {
    baseURL: origin,
    channel: process.env.HOSPITAL_QA_BROWSER ?? "msedge",
    timezoneId: "America/Sao_Paulo",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 18543",
    url: origin,
    reuseExistingServer: false,
    env: {
      VITE_API_BASE_URL: apiUrl,
      VITE_WS_URL: apiUrl.replace(/^http/, "ws") + "/ws",
    },
  },
})
