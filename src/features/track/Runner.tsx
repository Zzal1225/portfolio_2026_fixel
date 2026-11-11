'use client';
/**
 * 캐릭터(러너 스프라이트 시트, 좌표는 sprites.css) + 반응 구역 말풍선(PC "SPACE", 모바일 "!").
 * 어느 행(방향)·달리는지 여부만 data-* 속성으로 넘기고, 프레임 넘기기는 CSS steps()가 한다(JS 타이머 없음).
 *
 * 위치는 transform만 바꾼다(left/top 금지 — 바꿀 때마다 레이아웃 재계산이 일어난다. CLAUDE.md 성능 목표).
 * 틱(60ms)마다 목표 좌표만 바뀌고, 사이 구간은 CSS transition(--tick, linear)이 메운다.
 *
 * 겹침 순서(자유 이동, 11-10): 위에서 내려다본 화면이라 "발이 아래(앞)에 있는 것이 위에 그려진다".
 * 러너 z-index = 발 y, 구조물 z-index = 바닥 y(Landmark.tsx). 그래서 구조물 뒤로 가면 가려지고 앞에 서면 앞에 보인다.
 * 아치 아래를 지날 때(발 y < 아치 바닥 299)는 아치가 위 → 현수막 글자가 가려지지 않는다(시안과 같음).
 * 반응 구역 말풍선은 무엇에도 가리면 안 되므로 따로 맨 위(z 1000)에 띄우되, 같은 transform으로 러너와 한 몸처럼 움직인다.
 */
import type { CSSProperties } from 'react';
import { ALERT_MARK, SPACE_TAG } from '@/content/menu';
import { useGame, selectSettling } from './store';

const W = 32;
const H = 48;
/** 장식보다 위, HUD(별도 레이어)와는 무관한 월드 안 최상단 */
export const Z_TOP = 1000;

function useRunnerTransform(): CSSProperties {
  const pos = useGame((s) => s.pos);
  const settling = useGame(selectSettling);
  return {
    width: W,
    height: H,
    transform: `translate3d(${pos.x - W / 2}px, ${pos.y - H}px, 0)`,
    transition: settling ? 'none' : 'transform var(--tick) linear',
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
 * 반응 구역 안에서 머리 위 말풍선(11-10 6차 결정): 시안 "!" 말풍선 모양 안에 PC는 "SPACE", 모바일은 "!".
 * 이전에는 "!" 말풍선 + 오른쪽 SPACE 태그 둘이었는데 겹쳐 보여 하나로 합쳤다. 모바일은 SPACE 키가 없어 "!" 그대로.
 * 뜻은 World의 ZoneAnnouncer가 글로 읽어 준다(이 그림은 aria-hidden).
 *
 * 말풍선은 9-slice 몸통 + 꼬리(sprites.css .alert-body·.alert-tail)라 글자 길이만큼 늘어난다.
 * 꼬리 끝은 시안 "!" 말풍선과 같은 자리(러너 칸 위쪽 3px)에 맞춘다. 글자 크기는 화면 기준(÷ 배율): SPACE 10px(메뉴 글자와 같음), "!" 14px(시안 "!" 그림 크기).
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
      <div
        className="absolute"
        style={{ left: W / 2, top: 3, transform: 'translate(-50%, -100%)' }}
      >
        <div className="alert-bubble flex flex-col items-center">
          <p
            className="alert-body font-pixel text-ink leading-none whitespace-nowrap"
            // 글자 크기는 안쪽 span이 정한다. p 자체는 0으로 둬야 줄 높이가 상속 글자 크기(월드 안이라 크게 잡힘)로 부풀지 않는다
            style={{
              fontSize: 0,
              padding: 'calc(3px / var(--scale)) calc(3px / var(--scale)) calc(2px / var(--scale))',
            }}
          >
            <span className="max-[699px]:hidden" style={{ fontSize: 'calc(10px / var(--scale))' }}>
              {SPACE_TAG}
            </span>
            <span className="min-[700px]:hidden" style={{ fontSize: 'calc(14px / var(--scale))' }}>
              {ALERT_MARK}
            </span>
          </p>
          <div className="alert-tail" style={{ marginTop: -1 }} />
        </div>
      </div>
    </div>
  );
}
