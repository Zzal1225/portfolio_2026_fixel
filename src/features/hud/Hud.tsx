'use client';
/**
 * HUD(화면에 고정된 DOM, 월드 배율과 무관): 로고 + 메뉴 6개 + 하단 조작 안내 판(PC) + REPLAY.
 * 미니맵·MAP 버튼은 Minimap.tsx, ◀ ▶는 TouchControls.tsx.
 *
 * 메뉴 = 키보드 사용자의 기본 길(CLAUDE.md 접근성): Tab으로 6개를 돌고 Enter면 캐릭터가 달려가 창이 열린다.
 * 그래서 메뉴는 DOM 순서상 월드보다 앞에 둔다(Game.tsx).
 * 메뉴 위치: PC(폭 700 이상) 오른쪽 위 가로 한 줄, 모바일은 하단 바 3×2(같은 DOM, CSS만 다름).
 */
import { GUIDE, HUD_LABELS, LOGO, MENU_ORDER } from '@/content/hud';
import { INTRO_LABELS } from '@/content/intro';
import { MENU_LABEL, openLabel } from '@/content/menu';
import type { LandmarkId } from '@/features/track/layout';
import { selectDialogOpen, useGame } from '@/features/track/store';

/**
 * HUD는 인트로 연출 동안 숨기고, 줌아웃(13.6초)과 함께 미끄러져 들어온다(시안).
 * 재방문·reduced의 인사처럼 입력이 열려 있으면 보인다. 숨김은 렌더하지 않는 방식: 숨긴 메뉴에 Tab이 걸리지 않게.
 */
export function useHudVisible(): boolean {
  return useGame((s) => s.inputEnabled || s.intro.phase === 'zoomout' || s.intro.phase === 'done');
}

/**
 * 창(내용·지도)이 떠 있는 동안 메뉴·미니맵·REPLAY를 숨긴다(11-10 사용자 요청: 창 밖 ✕가 눈에 잘 띄게).
 * 언마운트가 아니라 visibility: hidden — 창이 닫힐 때 Radix가 포커스를 연 버튼(메뉴·지도 버튼)으로 되돌려야 하므로
 * 같은 DOM 요소가 남아 있어야 한다. hidden이면 Tab·스크린리더에서도 빠진다.
 */
export function useHideForDialog(): string {
  return useGame(selectDialogOpen) ? 'invisible' : '';
}

/** ▶ REPLAY(왼쪽 아래): 인트로가 끝난 뒤. 누르면 열린 창을 닫고 신호등부터 다시(useIntro.replay) */
export function ReplayButton({ onReplay }: { onReplay: () => void }) {
  const hide = useHideForDialog();
  if (!useHudVisible()) return null;
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label={INTRO_LABELS.replayAria}
      className={`${hide} hud-in-left nine-white font-pixel text-ink fixed bottom-4 left-4 z-20 h-11 px-1.5 text-[10px] max-[699px]:bottom-[200px] max-[699px]:text-[8px]`}
    >
      {INTRO_LABELS.replay}
    </button>
  );
}

/**
 * 로고(시안): "ChanRyeong" 흰 글자 + 2px ink 픽셀 외곽선(8방향 그림자, 흐림 0) + 아래 그림자, "PORTFOLIO" 노랑.
 * 판·테두리 없이 월드 위에 바로 얹는다. 스크린리더는 보이는 글자 그대로 "ChanRyeong PORTFOLIO"를 읽는다
 * (p에는 aria-label을 붙일 수 없다: axe aria-prohibited-attr).
 */
const OUTLINE =
  '2px 0 0 var(--color-ink), -2px 0 0 var(--color-ink), 0 2px 0 var(--color-ink), 0 -2px 0 var(--color-ink), 2px 2px 0 var(--color-ink), -2px 2px 0 var(--color-ink), 2px -2px 0 var(--color-ink), -2px -2px 0 var(--color-ink)';

export function Logo() {
  if (!useHudVisible()) return null;
  return (
    <p className="hud-in-left font-pixel pointer-events-none fixed top-4 left-4 z-20 flex flex-col items-start gap-2.5 leading-none whitespace-nowrap max-[699px]:top-2 max-[699px]:left-2 max-[699px]:gap-2">
      <span
        className="text-2xl text-white max-[699px]:text-base"
        style={{ textShadow: `${OUTLINE}, 0 5px 0 var(--color-ink)` }}
      >
        {LOGO.name}
      </span>
      <span
        className="text-accent text-[10px] tracking-[2px] max-[699px]:text-[8px]"
        style={{ textShadow: OUTLINE }}
      >
        {LOGO.sub}
      </span>
    </p>
  );
}

/** PC 하단 가운데 조작 안내 판(시안). 모바일은 ◀ ▶·하단 메뉴가 같은 역할이라 없음 */
export function GuidePanel() {
  if (!useHudVisible()) return null;
  return (
    <p className="hud-in-bottom nine-white font-pixel-ko text-ink pointer-events-none fixed bottom-4 left-1/2 z-20 flex h-11 -translate-x-1/2 items-center px-1.5 text-[13px] font-bold whitespace-nowrap max-[699px]:hidden">
      {GUIDE}
    </p>
  );
}

export function Menu({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const open = useGame((s) => s.open);
  // 반응 구역에 서 있으면 그 메뉴도 강조(시안). aria-current는 실제로 열린 창에만 둔다(서 있는 것은 '현재 페이지'가 아님)
  const zone = useGame((s) => s.zone);
  const hide = useHideForDialog();
  if (!useHudVisible()) return null;
  return (
    <nav
      aria-label={HUD_LABELS.menu}
      className={`${hide} hud-in-top fixed top-4 right-4 z-20 max-[699px]:inset-x-0 max-[699px]:top-auto max-[699px]:bottom-0 max-[699px]:h-28 max-[699px]:bg-ink max-[699px]:p-2`}
    >
      {/* PC: 오른쪽 위 가로 한 줄 / 모바일(폭 700 미만): 하단 112px 바에 3×2 격자(시안). DOM은 하나라 Tab 순서가 같다 */}
      <ul className="flex gap-1 max-[699px]:grid max-[699px]:h-full max-[699px]:grid-cols-3 max-[699px]:grid-rows-2">
        {MENU_ORDER.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-label={openLabel(id)}
              aria-current={open === id ? 'true' : undefined}
              data-active={open === id || (open === null && zone === id)}
              onClick={() => onSelect(id)}
              className="nine-white font-pixel text-ink data-[active=true]:bg-menu-selected h-11 px-1.5 text-[10px] max-[699px]:w-full max-[699px]:text-[9px] data-[active=true]:outline-2 data-[active=true]:-outline-offset-4 data-[active=true]:outline-(--color-accent)"
            >
              {MENU_LABEL[id]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
