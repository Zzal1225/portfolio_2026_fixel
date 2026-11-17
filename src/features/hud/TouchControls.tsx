'use client';
/**
 * 모바일 ◀ ▶(폭 700 미만, 시안): 누르면 메뉴 순서로(11-12) 이전·다음 지점까지 달려가 창을 연다(useRunner.stepStation).
 * 11-10 시안 채택으로 "누르고 있는 동안 달리기"에서 바뀌었다. 직접 달리기는 화면 끌기(TouchStick.tsx, 11-17).
 * 인트로 직후에는 두 버튼 사이에 "화면을 끌면 달려요" 안내가 첫 입력까지 뜬다(PC의 키캡 안내와 같은 역할).
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
      {hint && (
        <p className="nine-white font-pixel-ko text-ink pointer-events-none fixed bottom-[142px] left-1/2 z-20 -translate-x-1/2 px-2 py-1.5 text-[12px] leading-none font-bold whitespace-nowrap">
          {TOUCH_LABELS.dragHint}
        </p>
      )}
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
