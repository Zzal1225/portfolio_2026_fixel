'use client';
/**
 * 캐릭터(지금은 32×48 네모, 작업 12에서 스프라이트 시트로 교체) + 반응 구역 `!` 말풍선.
 *
 * 위치는 transform만 바꾼다(left/top 금지 — 바꿀 때마다 레이아웃 재계산이 일어난다. CLAUDE.md 성능 목표).
 * 틱(60ms)마다 목표 좌표만 바뀌고, 사이 구간은 CSS transition(--tick, linear)이 메운다.
 * 그래서 JS는 초당 약 17번만 일하고 rAF 루프가 필요 없다.
 *
 * 겹침 순서: 러너는 구조물 아래, `!`는 맨 위(z 3). 출발선에서 러너가 아치를 지날 때 현수막 글자 "ABOUT"이
 * 가려지지 않게 아치가 위에 온다(시안과 같음, 11-10 D2 보완). `!`는 아치에 가리면 안 되므로 따로 띄우되,
 * 같은 transform·transition을 써서 러너와 한 몸처럼 움직인다.
 */
import type { CSSProperties } from 'react';
import { useGame } from './store';
import { facing, toWorld } from './trackPath';

const W = 32;
const H = 48;

function useRunnerTransform(): CSSProperties {
  const t = useGame((s) => s.t);
  const p = toWorld(t);
  return {
    width: W,
    height: H,
    transform: `translate3d(${p.x - W / 2}px, ${p.footY - H}px, 0)`,
    transition: 'transform var(--tick) linear',
    willChange: 'transform',
  };
}

export function Runner() {
  const t = useGame((s) => s.t);
  const dir = useGame((s) => s.dir);
  const style = useRunnerTransform();
  return (
    <div
      aria-hidden
      data-facing={facing(t, dir)}
      className="bg-tee border-ink pointer-events-none absolute top-0 left-0 border-2"
      style={style}
    />
  );
}

/** 반응 구역 안에서 머리 위 `!`(2프레임). 뜻은 World의 ZoneAnnouncer가 글로 읽어 준다 */
export function ZoneAlert() {
  const show = useGame((s) => s.zone !== null && s.open === null);
  const style = useRunnerTransform();
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0"
      style={{ ...style, zIndex: 3 }}
    >
      <div className="spr spr-alert absolute" style={{ left: W / 2 - 8, top: -10 }} />
    </div>
  );
}
