'use client';
/**
 * 월드 안(배율과 함께 커지는) 인트로 요소: 신호등·심판, 인사 말풍선, 키캡 안내.
 * 전부 월드 px 좌표. 그림은 aria-hidden, 글은 DOM(인사 말풍선은 스크린리더도 읽음).
 *
 * 신호등·심판은 시안처럼 늘 서 있고(인트로 밖에서는 꺼진 신호등·깃발 내린 심판), 인트로 때만 불이 켜진다.
 * 겹침: 바닥 y를 z-index로(러너와 같은 규칙, Runner.tsx).
 */
import { GREETING, KEY_HINT } from '@/content/intro';
import { ACTORS, rectFromAnchor } from '@/features/track/layout';
import { Z_TOP } from '@/features/track/Runner';
import { useGame } from '@/features/track/store';

const SIGNAL_SRC = ['off', 'red', 'yellow', 'green'] as const;

export function IntroActors() {
  const signal = useGame((s) => s.intro.signal);
  const phase = useGame((s) => s.intro.phase);
  // 출발(GO = 1.8초, 한 바퀴 시작)과 함께 깃발을 내린다
  const flagUp = phase === 'boot' || phase === 'preload' || phase === 'signal';
  return (
    <div aria-hidden>
      {ACTORS.map((a) => {
        const r = rectFromAnchor(a.anchor, a.size);
        // 그림은 물건 시트(sprites.css) 안 한 칸: 상태가 바뀌면 클래스(좌표)만 바뀐다
        const sprite =
          a.id === 'signal'
            ? `spr-signal-${SIGNAL_SRC[signal]}`
            : `spr-referee-${flagUp ? 'up' : 'down'}`;
        return (
          <div
            key={a.id}
            className={`spr absolute ${sprite}`}
            style={{
              left: r.x0,
              top: r.y0,
              width: a.size.w,
              height: a.size.h,
              zIndex: a.anchor.y,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * 인사 말풍선 "WELCOME TO MY PORTFOLIO!" — 러너 머리 위.
 * 시안 말풍선 판을 몸통(9-slice, 글 길이만큼 늘어남)과 꼬리로 나눠 붙인다(sprites.css .speech-bubble).
 * 글자 크기는 시안처럼 화면 기준(PC 16px, 모바일 10px) → 월드 안이라 배율로 나눈다(인사 때 배율은 줌인 값).
 */
export function Greeting() {
  const show = useGame((s) => s.intro.phase === 'greet');
  const pos = useGame((s) => s.pos);
  const mobile = useGame((s) => s.viewportPx.w < 700);
  if (!show) return null;
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: pos.x, top: pos.y - 50, transform: 'translate(-50%, -100%)', zIndex: Z_TOP }}
    >
      <p
        role="status"
        className="speech-bubble font-pixel text-ink leading-none whitespace-nowrap"
        style={{
          fontSize: `calc(${mobile ? 10 : 16}px / var(--scale))`,
          padding: '0.15em 0.3em 0',
        }}
      >
        {GREETING}
      </p>
      <div aria-hidden className="speech-tail" style={{ marginTop: -1 }} />
    </div>
  );
}

/**
 * 키캡 ↑ ← → ↓ 4개가 0.45초마다 차례로 눌림(시안, 첫 입력까지). 모바일은 키캡 대신 ◀ ▶ 깜빡임(TouchControls).
 * 위치(발 기준, 월드 px): ← (−36, −34) · ↑ (−8, −70) · → (+20, −34) · ↓ (−8, +2). 크기 16×16.
 * 차례는 CSS animation-delay로 엇갈린다(JS 타이머 없음).
 */
export function KeyHint() {
  const show = useGame((s) => s.intro.phase === 'ready');
  const pos = useGame((s) => s.pos);
  if (!show) return null;
  const keys = [
    { dx: -36, dy: -34, label: KEY_HINT[0] },
    { dx: -8, dy: -70, label: KEY_HINT[1] },
    { dx: 20, dy: -34, label: KEY_HINT[2] },
    { dx: -8, dy: 2, label: KEY_HINT[3] },
  ];
  return (
    <div aria-hidden className="max-[699px]:hidden">
      {keys.map((k, i) => (
        <div
          key={k.label}
          className="keycap absolute"
          style={{
            left: pos.x + k.dx,
            top: pos.y + k.dy,
            width: 16,
            height: 16,
            animationDelay: `${i * 0.45}s`,
            zIndex: Z_TOP,
          }}
        >
          <span className="keycap-face font-pixel-ko text-ink absolute inset-x-0 grid place-items-center font-bold">
            {k.label}
          </span>
        </div>
      ))}
    </div>
  );
}
