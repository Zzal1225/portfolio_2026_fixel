'use client';
/**
 * 캐릭터(작업 4: 32×48 네모, 작업 12에서 스프라이트 시트로 교체).
 *
 * 위치는 transform만 바꾼다(left/top 금지 — 바꿀 때마다 레이아웃 재계산이 일어난다. CLAUDE.md 성능 목표).
 * 틱(60ms)마다 목표 좌표만 바뀌고, 사이 구간은 CSS transition(--tick, linear)이 메운다.
 * 그래서 JS는 초당 약 17번만 일하고 rAF 루프가 필요 없다.
 *
 * store에서 t·dir만 구독한다: 열린 창이나 카메라가 바뀌어도 러너는 다시 그려지지 않는다.
 */
import { useGame } from './store';
import { facing, toWorld } from './trackPath';

const W = 32;
const H = 48;

export function Runner() {
  const t = useGame((s) => s.t);
  const dir = useGame((s) => s.dir);
  const p = toWorld(t);

  return (
    <div
      aria-hidden
      data-facing={facing(t, dir)}
      className="bg-tee border-ink absolute top-0 left-0 border-2"
      style={{
        width: W,
        height: H,
        transform: `translate3d(${p.x - W / 2}px, ${p.footY - H}px, 0)`,
        transition: 'transform var(--tick) linear',
        willChange: 'transform',
      }}
    />
  );
}
