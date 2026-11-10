'use client';
/**
 * 캐릭터(러너 스프라이트 시트, 좌표는 sprites.css) + 반응 구역 `!` 말풍선 + "SPACE" 태그(PC).
 * 어느 행(방향)·달리는지 여부만 data-* 속성으로 넘기고, 프레임 넘기기는 CSS steps()가 한다(JS 타이머 없음).
 *
 * 위치는 transform만 바꾼다(left/top 금지 — 바꿀 때마다 레이아웃 재계산이 일어난다. CLAUDE.md 성능 목표).
 * 틱(60ms)마다 목표 좌표만 바뀌고, 사이 구간은 CSS transition(--tick, linear)이 메운다.
 *
 * 겹침 순서(자유 이동, 11-10): 위에서 내려다본 화면이라 "발이 아래(앞)에 있는 것이 위에 그려진다".
 * 러너 z-index = 발 y, 구조물 z-index = 바닥 y(Landmark.tsx). 그래서 구조물 뒤로 가면 가려지고 앞에 서면 앞에 보인다.
 * 아치 아래를 지날 때(발 y < 아치 바닥 299)는 아치가 위 → 현수막 글자가 가려지지 않는다(시안과 같음).
 * `!`·SPACE는 무엇에도 가리면 안 되므로 따로 맨 위(z 1000)에 띄우되, 같은 transform으로 러너와 한 몸처럼 움직인다.
 */
import type { CSSProperties } from 'react';
import { SPACE_TAG } from '@/content/menu';
import { useGame } from './store';

const W = 32;
const H = 48;
/** 장식보다 위, HUD(별도 레이어)와는 무관한 월드 안 최상단 */
export const Z_TOP = 1000;

function useRunnerTransform(): CSSProperties {
  const pos = useGame((s) => s.pos);
  return {
    width: W,
    height: H,
    transform: `translate3d(${pos.x - W / 2}px, ${pos.y - H}px, 0)`,
    transition: 'transform var(--tick) linear',
    willChange: 'transform',
  };
}

export function Runner() {
  const facing = useGame((s) => s.facing);
  const footY = useGame((s) => Math.round(s.pos.y));
  const running = useGame((s) => s.phase === 'running');
  // 인사 단계: 정면 손 흔들기 2프레임(reduced-motion이면 sprites.css가 애니메이션을 끔)
  const waving = useGame((s) => s.intro.phase === 'greet' && !s.intro.reduced);
  const style = useRunnerTransform();
  return (
    <div
      aria-hidden
      data-facing={waving ? 'down' : facing}
      data-running={running}
      data-wave={waving}
      className="spr-runner pointer-events-none absolute top-0 left-0"
      style={{ ...style, zIndex: footY }}
    />
  );
}

/**
 * 반응 구역 안에서 머리 위 `!`(2프레임) + 오른쪽 "SPACE" 태그(PC만, 시안). 뜻은 World의 ZoneAnnouncer가 글로 읽어 준다.
 * SPACE 글자 크기: 시안대로 화면 8px(월드 안이라 8px ÷ 배율).
 */
export function ZoneAlert() {
  const show = useGame((s) => s.zone !== null && s.open === null && s.inputEnabled);
  const style = useRunnerTransform();
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0"
      style={{ ...style, zIndex: Z_TOP }}
    >
      <div className="spr spr-alert absolute" style={{ left: W / 2 - 8, top: -10 }} />
      <span
        className="font-pixel text-ink absolute bg-white leading-none whitespace-nowrap max-[699px]:hidden"
        style={{
          left: W / 2 + 10,
          top: -4,
          fontSize: 'calc(8px / var(--scale))',
          padding: 'calc(4px / var(--scale)) calc(6px / var(--scale))',
          boxShadow:
            '0 0 0 calc(2px / var(--scale)) var(--color-ink), 0 calc(2px / var(--scale)) 0 calc(2px / var(--scale)) var(--color-metal-dark)',
        }}
      >
        {SPACE_TAG}
      </span>
    </div>
  );
}
