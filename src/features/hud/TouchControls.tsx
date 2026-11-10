'use client';
/**
 * 모바일 ◀ ▶(폭 700 미만에서만): 누르고 있는 동안 화면 기준 왼쪽·오른쪽으로 달린다.
 * 키보드 ←→와 같은 경로(useRunner.press/release)로 들어가지만, 커브 한가운데서도 멈추지 않게 판정한다(trackPath strict=false).
 *
 * 포인터 이벤트: pointerdown에 누르고, up·cancel·leave에 뗀다. 손가락이 버튼 밖으로 미끄러져도 계속 달리면 안 되므로 leave도 뗌.
 * setPointerCapture를 쓰지 않은 이유: 캡처하면 leave가 안 와서 "밖으로 밀어 멈추기"가 안 된다.
 * 키보드 사용자는 이 버튼 대신 방향키를 쓴다(Enter로 누르면 아무 일 없음 — 누르고 있는 동작이라 click이 맞지 않음).
 * 위치: 하단 메뉴 바(112px) 바로 위 bottom 124px, 좌우 12px(시안).
 */
import { TOUCH_LABELS } from '@/content/hud';
import type { KeyAxis } from '@/features/track/trackPath';
import { useHudVisible } from './Hud';

export function TouchControls({
  press,
  release,
}: {
  press: (dx: KeyAxis) => void;
  release: (dx: KeyAxis) => void;
}) {
  if (!useHudVisible()) return null;
  const buttons = [
    { dx: -1 as const, label: TOUCH_LABELS.left, glyph: '◀', side: 'left-3' },
    { dx: 1 as const, label: TOUCH_LABELS.right, glyph: '▶', side: 'right-3' },
  ];
  return (
    <div className="min-[700px]:hidden">
      {buttons.map((b) => (
        <button
          key={b.dx}
          type="button"
          aria-label={b.label}
          onPointerDown={(e) => {
            e.preventDefault();
            press(b.dx);
          }}
          onPointerUp={() => release(b.dx)}
          onPointerCancel={() => release(b.dx)}
          onPointerLeave={() => release(b.dx)}
          onContextMenu={(e) => e.preventDefault()}
          className={`nine-white text-ink fixed bottom-[124px] z-20 grid size-16 touch-none place-items-center text-xl select-none ${b.side}`}
        >
          <span aria-hidden>{b.glyph}</span>
        </button>
      ))}
    </div>
  );
}
