import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const viteBin = path.join(rootDir, 'node_modules', '.bin', 'vite')

const localHosts = '127.0.0.1,localhost,[::1]'
for (const key of ['NO_PROXY', 'no_proxy'] as const) {
  const current = process.env[key]
  process.env[key] = current ? `${current},${localHosts}` : localHosts
}

export default defineConfig({
  testDir: './e2e',
  testIgnore: process.env.DOCS_SCREENSHOT ? [] : ['**/docs-screenshot.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 180_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 2 } },
  ],
  webServer: process.env.DOCS_SCREENSHOT
    ? {
        command: `"${viteBin}" --host 127.0.0.1 --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          VITE_USE_SERVICES: 'true',
        },
      }
    : undefined,
})
