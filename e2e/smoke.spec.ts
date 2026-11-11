/**
 * 완료 조건 E2E(기획서 "완료 조건"):
 *  1. 첫 방문: 인트로 → SKIP → 트랙 → 메뉴 클릭 → (달려간 뒤) 창 열림 → ESC로 닫힘
 *  2. 키보드만으로 6개 창을 모두 열고 닫기
 *  3. axe 위반 0(트랙 화면·창 화면)
 *  4. 재방문도 인트로를 처음부터(SKIP 가능), reduced-motion은 인트로 생략
 *  5. 자유 이동(11-10 시안 채택): 방향키로 달려가 반응 구역에서 Enter, 지도 창, 모바일 ◀ ▶
 *
 * 메뉴 클릭 후 창은 "캐릭터가 달려간 뒤" 열린다. 그래서 창이 보일 때까지 넉넉히 기다린다.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const MENU = ['ABOUT ME', 'CAREER', 'PROJECT1', 'PROJECT2', 'SKILL', 'RESUME'];
const OPEN_TIMEOUT = 8_000;

/** SKIP → 인트로 끝 상태(시안: 바로 플레이 준비). HUD 등장 애니메이션까지 끝난 뒤 돌려준다 */
async function skipIntro(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
}

/** 반복하지 않는 애니메이션(HUD 등장·창 열림)이 끝날 때까지. 투명도 중간에 axe가 대비를 재면 실제보다 낮게 나온다 */
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((x) => x.effect?.getTiming().iterations !== Infinity)
        .map((x) => x.finished),
    ),
  );
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

test('키보드만으로 6개 창을 모두 열고 닫는다', async ({ page, isMobile }) => {
  test.skip(isMobile, '키보드 시나리오는 PC');
  await skipIntro(page);
  for (const name of MENU) {
    const button = page
      .getByRole('navigation', { name: 'Menu' })
      .getByRole('button', { name: `Open ${name}` });
    await button.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT });
    // 열리면 닫기 버튼에 포커스(포커스 트랩 안)
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('axe: 트랙 화면과 창에 위반이 없다', async ({ page }) => {
  await skipIntro(page);
  await settle(page);
  const track = await new AxeBuilder({ page }).analyze();
  expect(track.violations).toEqual([]);

  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open PROJECT1' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT });
  await settle(page);
  const dialog = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(dialog.violations).toEqual([]);
});

test('재방문에도 인트로가 처음부터 나오고 SKIP으로 건너뛴다(11-10 6차)', async ({ page }) => {
  await skipIntro(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
});

test('인트로는 SKIP 버튼으로만 건너뛴다: 화면 클릭·키 입력·구조물 클릭은 무시(11-11)', async ({
  page,
}) => {
  await page.goto('/');
  const skip = page.getByRole('button', { name: 'Skip intro' });
  await expect(skip).toBeVisible();
  await page.mouse.click(300, 300);
  await page.keyboard.press('x');
  // 인트로 중 구조물 클릭이 예약으로 남으면 인트로가 끝나자마자 달려가 창이 열린다
  await page.locator('button[aria-label="Open RESUME"]').click({ force: true });
  await page.waitForTimeout(300); // 틱(60ms) 몇 번: 잘못 건너뛰었다면 이 안에 끝 상태로 간다
  await expect(skip).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toHaveCount(0);

  await skip.click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  await page.waitForTimeout(1500); // 러너가 달려갔다면 창이 열렸을 시간
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('첫 화면은 서버 HTML부터 로딩 덮개로 가리고, 준비되면 걷힌다(11-11)', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('loading-cover');
  await page.goto('/');
  await expect(page.locator('.loading-cover')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
});

test('프로젝트 창 제목은 "이름(부제목)"', async ({ page }) => {
  await skipIntro(page);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open PROJECT1' })
    .click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText(
    'nanaki(기록 PWA)',
    { timeout: OPEN_TIMEOUT },
  );
});

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('신호등·한 바퀴 없이 인사 말풍선이 입력 전까지 고정', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(0);
    await page.waitForTimeout(3000); // 평소 인사(2.8초)보다 길게 기다려도 그대로
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('WELCOME TO MY PORTFOLIO!')).toBeHidden();
  });
});

test('키보드로 달려가 반응 구역에서 Enter로 창을 연다(자유 이동)', async ({ page, isMobile }) => {
  test.skip(isMobile, '키보드 시나리오는 PC');
  await skipIntro(page);
  // 인트로가 끝난 자리(출발선 +80px)에서 ← 를 누르고 있으면 왼쪽으로 달려 접수 테이블(RESUME) 반응 구역에 닿는다
  await page.keyboard.down('ArrowLeft');
  await expect(page.getByText('Press Enter to open RESUME')).toBeAttached({ timeout: 6_000 });
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('RESUME');
});

test('방향키를 짧게 한 번 눌러도 한 걸음은 움직인다', async ({ page, isMobile }) => {
  test.skip(isMobile, '키보드 시나리오는 PC');
  await skipIntro(page);
  const runner = page.locator('.spr-runner');
  const before = await runner.evaluate((el) => (el as HTMLElement).style.transform);
  await page.keyboard.press('ArrowUp'); // keydown → keyup이 한 틱 안에
  await expect
    .poll(() => runner.evaluate((el) => (el as HTMLElement).style.transform))
    .not.toBe(before);
});

test('메뉴를 누르면 캐릭터가 달려간 뒤 창이 열린다(바로 열리지 않음)', async ({ page }) => {
  await skipIntro(page);
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('button', { name: 'Open SKILL' })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT });
});

test('지도 창: 구조물을 누르면 달려가 그 창이 열린다(PC 미니맵·모바일 MAP 공통)', async ({
  page,
}) => {
  await skipIntro(page);
  await page.getByRole('button', { name: 'Open track map' }).locator('visible=true').click();
  const map = page.getByRole('dialog', { name: 'MAP' });
  await expect(map).toBeVisible();
  await map.getByRole('button', { name: 'Open SKILL' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('SKILL', {
    timeout: OPEN_TIMEOUT,
  });
});

test('모바일: ▶ 를 누르면 다음 지점으로 달려가 창이 열린다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 전용');
  await skipIntro(page);
  await page.getByRole('button', { name: 'Go to next stop' }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT });
});

test('창이 떠 있으면 메뉴·지도·REPLAY가 숨고, TOP 버튼으로 맨 위로 간다', async ({ page }) => {
  await skipIntro(page);
  const menu = page.getByRole('navigation', { name: 'Menu' });
  await menu.getByRole('button', { name: 'Open ABOUT ME' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT });

  // 창 뒤 HUD는 숨김(visibility) — ✕가 눈에 잘 띄게. Radix 모달이 창 밖을 접근성 트리에서 빼므로 role이 아닌 CSS로 찾는다
  const behind = page.locator(
    'nav[aria-label="Menu"], button[aria-label="Replay intro"], button[aria-label="Open track map"]',
  );
  await expect(behind).toHaveCount(4);
  for (const el of await behind.all()) await expect(el).toBeHidden();

  // 화면을 낮춰 창이 확실히 화면보다 길게 만든 뒤 맨 아래로
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 360 });
  const top = page.getByRole('button', { name: 'Back to top' });
  await expect(top).toBeHidden();
  await page.evaluate(() => {
    const o = document.querySelector('.dialog-overlay')!;
    o.scrollTop = o.scrollHeight;
  });
  await expect(top).toBeVisible();
  await top.click();
  await expect
    .poll(() => page.evaluate(() => document.querySelector('.dialog-overlay')!.scrollTop))
    .toBe(0);
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menu).toBeVisible();
});
