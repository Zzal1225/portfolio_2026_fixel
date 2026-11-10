/**
 * 화면 비교(기획서 step2: PC 1280·모바일 390). 기준 스크린샷과 픽셀을 비교해 레이아웃·그림이 깨지면 실패한다.
 *
 * 기준 스크린샷은 리눅스 CI에서만 만든다: 글꼴 렌더링이 OS마다 달라 윈도에서 찍은 기준은 리눅스에서 항상 어긋난다.
 *  - 만들기/갱신: GitHub Actions "Update visual snapshots"(수동 실행) → e2e/__screenshots__/ 커밋
 *  - 비교: 기준이 있으면 CI가 VISUAL=1로 이 파일을 돈다. 로컬은 VISUAL=1을 줄 때만(기본 건너뜀).
 *
 * 흔들림 줄이기: CSS 애니메이션 끔(animations: 'disabled'), 인트로는 SKIP으로 끝 상태, 지도 그림은 유휴 로드라 잠깐 기다림.
 * WebKit은 제외(같은 화면을 두 엔진으로 비교할 이득보다 흔들림 비용이 큼).
 */
import { expect, test, type Page } from '@playwright/test';

test.skip(!process.env.VISUAL, '화면 비교는 VISUAL=1일 때만(기준 스크린샷은 리눅스 CI에서 생성)');
test.skip(({ browserName }) => browserName === 'webkit', '화면 비교는 크로미움만');

async function ready(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // 지도 그림(requestIdleCallback, 최대 2초)
}

const SHOT = { animations: 'disabled', maxDiffPixelRatio: 0.01 } as const;

test('트랙 화면(인트로 끝)', async ({ page }) => {
  await ready(page);
  await expect(page).toHaveScreenshot('track.png', SHOT);
});

test('창: PROJECT1', async ({ page }) => {
  await ready(page);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open PROJECT1' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot('window-project1.png', SHOT);
});

test('큰 지도 창', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Open track map' }).locator('visible=true').click();
  await expect(page.getByRole('dialog', { name: 'MAP' })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot('map.png', SHOT);
});
