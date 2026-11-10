/**
 * E2E 설정. step1은 크로미움 하나(PC 1280×720), WebKit·모바일·화면 비교는 step2(기획서 기능 범위).
 * 서버는 프로덕션 빌드(next start)로 띄운다: dev 서버는 느리고 실제 배포와 동작이 다르다.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-pc',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
