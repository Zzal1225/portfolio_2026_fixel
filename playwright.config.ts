/**
 * E2E 설정: 크로미움 PC(1280×720), WebKit PC(사파리 엔진, 기획서 완료 조건), 크로미움 모바일(390×844, 터치).
 * 화면 비교(스크린샷 기준선)는 OS마다 글꼴 렌더링이 달라 CI(리눅스)에서 기준선을 만든 뒤 붙인다.
 * 서버는 프로덕션 빌드(next start)로 띄운다: dev 서버는 느리고 실제 배포와 동작이 다르다.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;
/** E2E_BASE_URL을 주면 배포 주소를 대상으로 돈다(로컬 서버를 띄우지 않음). 예: E2E_BASE_URL=https://portfolio2026fixel.vercel.app */
const REMOTE = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: REMOTE ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-pc',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'webkit-pc',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: REMOTE
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
