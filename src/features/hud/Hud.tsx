'use client';
/**
 * HUD(화면에 고정된 DOM, 월드 배율과 무관): 번호표 이름 띠 + 메뉴 아이콘 6개 + 미니맵(PC).
 *
 * 메뉴 = 키보드 사용자의 기본 길(CLAUDE.md 접근성): Tab으로 6개를 돌고 Enter면 캐릭터가 달려가 창이 열린다.
 * 그래서 메뉴는 DOM 순서상 월드보다 앞에 둔다(Game.tsx).
 *
 * 메뉴 위치: PC(폭 700 이상) 오른쪽 위 가로 한 줄, 모바일은 하단 바 3×2(같은 DOM, CSS만 다름).
 */
import { BIB, HUD_LABELS, MENU_ORDER } from '@/content/hud';
import { INTRO_LABELS } from '@/content/intro';
import { MENU_LABEL, openLabel } from '@/content/menu';
import type { LandmarkId } from '@/features/track/layout';
import { useGame } from '@/features/track/store';

/**
 * HUD는 인트로 연출(프리로드·신호등·한 바퀴) 동안 숨기고, 줌인과 함께 나타난다(기획서 화면 1의 3번).
 * 숨김은 렌더하지 않는 방식: 숨긴 메뉴에 Tab이 걸리지 않게.
 */
export function useHudVisible(): boolean {
  return useGame((s) => !['boot', 'preload', 'signal', 'lap'].includes(s.intro.phase));
}

/** ▶ REPLAY(왼쪽 아래): 인사 이후부터. 누르면 열린 창을 닫고 신호등부터 다시(useIntro.replay) */
export function ReplayButton({ onReplay }: { onReplay: () => void }) {
  const show = useGame((s) => ['greet', 'hint', 'done'].includes(s.intro.phase));
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label={INTRO_LABELS.replayAria}
      className="nine-white font-pixel text-ink fixed bottom-4 left-4 z-20 h-11 px-2 text-[10px] max-[699px]:bottom-[200px] max-[699px]:left-3"
    >
      {INTRO_LABELS.replay}
    </button>
  );
}

export function NameBib() {
  if (!useHudVisible()) return null;
  // 번호표 모양 이름 띠. 정적인 글이라 버튼이 아니다
  return (
    <div className="nine-white text-ink fixed top-4 left-4 z-20 flex items-baseline gap-2 px-2 py-1 max-[699px]:top-2 max-[699px]:left-2">
      <span className="font-pixel-ko text-sm font-bold">{BIB.name}</span>
      <span className="font-pixel text-[10px]">{BIB.level}</span>
    </div>
  );
}

export function Menu({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const open = useGame((s) => s.open);
  if (!useHudVisible()) return null;
  return (
    <nav
      aria-label={HUD_LABELS.menu}
      className="fixed top-4 right-4 z-20 max-[699px]:inset-x-0 max-[699px]:top-auto max-[699px]:bottom-0 max-[699px]:h-28 max-[699px]:bg-ink max-[699px]:p-2"
    >
      {/* PC: 오른쪽 위 가로 한 줄 / 모바일(폭 700 미만): 하단 112px 바에 3×2 격자(시안). DOM은 하나라 Tab 순서가 같다 */}
      <ul className="flex gap-1 max-[699px]:grid max-[699px]:h-full max-[699px]:grid-cols-3 max-[699px]:grid-rows-2">
        {MENU_ORDER.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-label={openLabel(id)}
              aria-current={open === id ? 'true' : undefined}
              onClick={() => onSelect(id)}
              className="nine-white font-pixel text-ink aria-[current=true]:bg-menu-selected h-11 px-1.5 text-[10px] max-[699px]:w-full max-[699px]:text-[9px] aria-[current=true]:outline-2 aria-[current=true]:-outline-offset-4 aria-[current=true]:outline-(--color-accent)"
            >
              {MENU_LABEL[id]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
