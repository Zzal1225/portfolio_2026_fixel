'use client';
/**
 * 월드 안(배율과 함께 커지는) 인트로 요소: 신호등·심판, 인사 말풍선, 키캡 안내.
 * 전부 월드 px 좌표. 그림은 aria-hidden, 글은 DOM(인사 말풍선은 스크린리더도 읽음).
 *
 * 신호등·심판은 시안처럼 늘 서 있고(인트로 밖에서는 꺼진 신호등·깃발 내린 심판), 인트로 때만 불이 켜진다.
 * 말풍선·키캡은 러너와 같은 transform을 쓰지 않는다: 인사·안내 동안 러너는 서 있으므로 한 번 계산하면 된다.
 */
import { GREETING, KEY_HINT } from '@/content/intro';
import { ACTORS, rectFromAnchor } from '@/features/track/layout';
import { useGame } from '@/features/track/store';
import { toWorld } from '@/features/track/trackPath';

const SIGNAL_SRC = ['off', 'red', 'yellow', 'green'] as const;

export function IntroActors() {
  const signal = useGame((s) => s.intro.signal);
  const phase = useGame((s) => s.intro.phase);
  // 초록(GO)과 함께 깃발을 내린다. 신호 전(대기)·빨강·노랑은 깃발을 든 상태
  const flagUp = phase === 'boot' || phase === 'preload' || (phase === 'signal' && signal < 3);
  return (
    <div aria-hidden>
      {ACTORS.map((a) => {
        const r = rectFromAnchor(a.anchor, a.size);
        const src =
          a.id === 'signal'
            ? `/sprites/intro/signal-${SIGNAL_SRC[signal]}-32x64.png`
            : `/sprites/intro/referee-flag-${flagUp ? 'up' : 'down'}-32x48.png`;
        return (
          <div
            key={a.id}
            className="absolute"
            style={{
              left: r.x0,
              top: r.y0,
              width: a.size.w,
              height: a.size.h,
              backgroundImage: `url(${src})`,
              zIndex: 1,
            }}
          />
        );
      })}
    </div>
  );
}

/** 인사 말풍선 "WELCOME TO MY PORTFOLIO!" — 러너 머리 위. 입력이 오면 바로 사라진다(useIntro) */
export function Greeting() {
  const show = useGame((s) => s.intro.phase === 'greet');
  const t = useGame((s) => s.t);
  if (!show) return null;
  const p = toWorld(t);
  return (
    <p
      role="status"
      className="bg-white border-ink font-pixel text-ink absolute leading-none whitespace-nowrap"
      style={{
        left: p.x,
        top: p.footY - 52,
        transform: 'translate(-50%, -100%)',
        // 화면에서 PC 16px(4×4), 모바일 12px 이상
        fontSize: 'max(4px, calc(12px / var(--scale)))',
        padding: '0.5em 0.6em',
        borderWidth: 1,
        zIndex: 4,
      }}
    >
      {GREETING}
    </p>
  );
}

/** 키캡 ← → 가 번갈아 눌리는 안내(첫 입력까지). 모바일 ◀ ▶ 깜빡임은 step2 */
export function KeyHint() {
  const show = useGame((s) => s.intro.phase === 'hint');
  const t = useGame((s) => s.t);
  if (!show) return null;
  const p = toWorld(t);
  const keys = [
    { x: p.x - 36, label: KEY_HINT[0], delay: '0s' },
    { x: p.x + 20, label: KEY_HINT[1], delay: '0.45s' },
  ];
  return (
    <div aria-hidden className="max-[699px]:hidden">
      {keys.map((k) => (
        <div
          key={k.label}
          className="keycap font-pixel text-ink absolute grid place-items-center"
          style={{
            left: k.x,
            top: p.footY - 34,
            width: 16,
            height: 16,
            fontSize: 6,
            animationDelay: k.delay,
            zIndex: 4,
          }}
        >
          {k.label}
        </div>
      ))}
    </div>
  );
}
