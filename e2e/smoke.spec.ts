/**
 * step1 완료 조건 E2E(기획서 "완료 조건"의 앞부분):
 *  1. 첫 방문: 인트로 → SKIP → 트랙 → 메뉴 클릭 → 창 열림 → ESC로 닫힘
 *  2. 키보드만으로 6개 창을 모두 열고 닫기
 *  3. axe 위반 0(트랙 화면·창 화면)
 *  4. 재방문은 신호등 없이 바로 인사, reduced-motion은 인트로 생략
 *
 * 메뉴 클릭 후 창은 "캐릭터가 달려간 뒤" 열린다(useRunner 작성 후). 그래서 창이 보일 때까지 넉넉히 기다린다.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const MENU = ['ABOUT', 'CAREER', 'PROJECT 1', 'PROJECT 2', 'EDUCATION', 'RESUME'];
const OPEN_TIMEOUT = 8_000;

async function skipIntro(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
}

test('첫 방문: 인트로 → SKIP → 메뉴 → 창 → ESC', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip intro' }).click();

  const menu = page.getByRole('navigation', { name: 'Menu' });
  await menu.getByRole('button', { name: 'Open CAREER' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT });
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('CAREER');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('키보드만으로 6개 창을 모두 열고 닫는다', async ({ page }) => {
  await skipIntro(page);
  for (const name of MENU) {
    const button = page.getByRole('navigation', { name: 'Menu' }).getByRole('button', {
      name: `Open ${name}`,
    });
    await button.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { level: 2 })).toContainText(name, {
      timeout: OPEN_TIMEOUT,
    });
    // 열리면 닫기 버튼에 포커스(포커스 트랩 안)
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('ABOUT 탭은 화살표 키로 PROFILE ↔ SKILLS', async ({ page }) => {
  await skipIntro(page);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open ABOUT' })
    .click();
  const profile = page.getByRole('tab', { name: 'PROFILE' });
  await expect(profile).toBeVisible({ timeout: OPEN_TIMEOUT });
  await profile.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'SKILLS' })).toHaveAttribute('aria-selected', 'true');
});

test('axe: 트랙 화면과 창에 위반이 없다', async ({ page }) => {
  await skipIntro(page);
  const track = await new AxeBuilder({ page }).analyze();
  expect(track.violations).toEqual([]);

  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open PROJECT 1' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT });
  const dialog = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(dialog.violations).toEqual([]);
});

test('재방문은 신호등 없이 인사부터, introSeen 저장', async ({ page }) => {
  await skipIntro(page);
  expect(await page.evaluate(() => localStorage.getItem('introSeen'))).toBe('1');
  await page.reload();
  await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
});

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('신호등·한 바퀴 없이 인사 말풍선이 입력 전까지 고정', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
    await page.waitForTimeout(3000); // 평소 인사(2.5초)보다 길게 기다려도 그대로
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeHidden();
  });
});

test('키보드로 달려가 반응 구역에서 Enter로 창을 연다', async ({ page }) => {
  await skipIntro(page);
  // 인트로가 끝난 자리(출발선 +80px)에서 ← 를 누르고 있으면 시계 방향으로 RESUME(접수 테이블)에 닿는다
  await page.keyboard.down('ArrowLeft');
  await expect(page.getByText('Press Enter to open RESUME')).toBeAttached({ timeout: 6_000 });
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('RESUME');
});

test('메뉴를 누르면 캐릭터가 달려간 뒤 창이 열린다(바로 열리지 않음)', async ({ page }) => {
  await skipIntro(page);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open EDUCATION' })
    .click();
  // 달리는 동안에는 창이 없다
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT });
});
