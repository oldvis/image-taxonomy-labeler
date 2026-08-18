import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const labelDir = path.join(rootDir, 'apps/label')
const compareDir = path.join(rootDir, 'apps/compare')
const labelVite = path.join(labelDir, 'node_modules', '.bin', 'vite')
const compareVite = path.join(compareDir, 'node_modules', '.bin', 'vite')

const localHosts = '127.0.0.1,localhost,[::1]'
for (const key of ['NO_PROXY', 'no_proxy'] as const) {
  const current = process.env[key]
  process.env[key] = current ? `${current},${localHosts}` : localHosts
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 300_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'label',
      testMatch: '**/label-latency.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3333',
      },
    },
    {
      name: 'compare',
      testMatch: '**/compare-*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3334',
      },
    },
  ],
  webServer: [
    {
      command: `"${labelVite}" --host 127.0.0.1 --port 3333`,
      cwd: labelDir,
      url: 'http://127.0.0.1:3333',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { ...process.env, VITE_USE_SERVICES: 'false' },
    },
    {
      command: `"${compareVite}" --host 127.0.0.1 --port 3334`,
      cwd: compareDir,
      url: 'http://127.0.0.1:3334',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { ...process.env, VITE_USE_SERVICES: 'false' },
    },
  ],
})
