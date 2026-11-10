'use client';
/**
 * HUD(화면에 고정된 DOM, 월드 배율과 무관): 번호표 이름 띠 + 메뉴 아이콘 6개 + 미니맵(PC).
 *
 * 메뉴 = 키보드 사용자의 기본 길(CLAUDE.md 접근성): Tab으로 6개를 돌고 Enter면 캐릭터가 달려가 창이 열린다.
 * 그래서 메뉴는 DOM 순서상 월드보다 앞에 둔다(Game.tsx).
 *
 * 메뉴 위치: PC(폭 700 이상) 오른쪽 위 가로 한 줄. 모바일 하단 바는 step2.
 */
import { BIB, HUD_LABELS, MENU_ORDER } from '@/content/hud';
import { MENU_LABEL, openLabel } from '@/content/menu';
import type { LandmarkId } from '@/features/track/layout';
import { useGame } from '@/features/track/store';

export function NameBib() {
  // 번호표 모양 이름 띠. 정적인 글이라 버튼이 아니다
  return (
    <div className="nine-white text-ink fixed top-4 left-4 z-20 flex items-baseline gap-2 px-2 py-1 max-[699px]:top-2 max-[699px]:left-2">
      <span className="text-base font-bold">{BIB.name}</span>
      <span className="font-pixel text-[10px]">{BIB.level}</span>
    </div>
  );
}

export function Menu({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const open = useGame((s) => s.open);
  return (
    <nav aria-label={HUD_LABELS.menu} className="fixed top-4 right-4 z-20 max-[699px]:hidden">
      <ul className="flex gap-1">
        {MENU_ORDER.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-label={openLabel(id)}
              aria-current={open === id ? 'true' : undefined}
              onClick={() => onSelect(id)}
              className="nine-white font-pixel text-ink aria-[current=true]:bg-menu-selected h-11 px-1.5 text-[10px] aria-[current=true]:outline-2 aria-[current=true]:-outline-offset-4 aria-[current=true]:outline-(--color-accent)"
            >
              {MENU_LABEL[id]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
