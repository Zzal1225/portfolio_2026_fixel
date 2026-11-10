'use client';
/**
 * 모바일 ◀ ▶(폭 700 미만, 시안): 누르면 트랙 순서로 이전·다음 지점까지 달려가 창을 연다(useRunner.stepStation).
 * 11-10 시안 채택으로 "누르고 있는 동안 달리기"에서 바뀌었다. 자유 이동은 화면 탭(구조물)·MAP 창으로 대신한다.
 *
 * 인트로 직후 안내(ready): 두 버튼이 0.45초마다 번갈아 노랗게 깜빡인다(시안). CSS animation-delay로 엇갈림.
 * 위치: 하단 메뉴 바(112px) 바로 위 bottom 124px, 좌우 12px.
 */
import { TOUCH_LABELS } from '@/content/hud';
import { useGame } from '@/features/track/store';
import { useHudVisible } from './Hud';

export function TouchControls({ stepStation }: { stepStation: (delta: 1 | -1) => void }) {
  const hint = useGame((s) => s.intro.phase === 'ready');
  if (!useHudVisible()) return null;
  const buttons = [
    { delta: -1 as const, label: TOUCH_LABELS.prev, glyph: '◀', side: 'left-3', delay: '0s' },
    { delta: 1 as const, label: TOUCH_LABELS.next, glyph: '▶', side: 'right-3', delay: '0.45s' },
  ];
  return (
    <div className="min-[700px]:hidden">
      {buttons.map((b) => (
        <button
          key={b.delta}
          type="button"
          aria-label={b.label}
          onClick={() => stepStation(b.delta)}
          className={`nine-white font-pixel-ko text-ink fixed bottom-[124px] z-20 grid size-16 place-items-center text-xl select-none ${b.side} ${hint ? 'touch-hint' : ''}`}
          style={{ animationDelay: b.delay }}
        >
          <span aria-hidden>{b.glyph}</span>
        </button>
      ))}
    </div>
  );
}
