'use client';
/**
 * 인트로 화면 고정 요소(월드 배율과 무관한 DOM): 신호 띠, SKIP, 큰 전광판 + 진행 점, LOADING.
 *
 * 큰 전광판(11-10 결정, 시안 방식): 월드 안 전광판(96×32)은 인트로 절반 배율에서 화면 172×32px라
 * 마지막 문구(17자)가 들어가지 않는다. 그래서 한 바퀴 동안 화면 가운데에 같은 전광판 그림을 정수 배율 k로 크게 띄운다.
 * 모든 화면에서 같은 방식이라 "모바일 1×에서 전광판이 화면 밖이면 위쪽 띠" 분기가 따로 필요 없다.
 * k = floor(min(화면폭×0.56, 화면높이×1.86) / 96), 최소 3(모바일에서도 글자 12px 이상), 화면폭을 넘지 않게.
 *
 * 글자는 전부 DOM(캔버스 아님). 신호 띠·전광판 문구는 aria-live로 스크린리더에도 전한다.
 */
import { BOARD_LINES, BOARD_STEPS, INTRO_LABELS, SIGNAL_BANDS } from '@/content/intro';
import { useGame } from '@/features/track/store';

const BOARD_W = 96;
const BOARD_H = 32;

function boardScale(w: number, h: number): number {
  const k = Math.floor(Math.min(w * 0.56, h * 1.86) / BOARD_W);
  const fit = Math.floor((w - 16) / BOARD_W);
  return Math.max(Math.min(3, fit), Math.min(k, fit));
}

function BigBoard() {
  const line = useGame((s) => s.intro.boardLine);
  const vp = useGame((s) => s.viewportPx);
  const k = boardScale(vp.w, vp.h);
  const W = BOARD_W * k;
  const H = BOARD_H * k;
  const current = line >= 0 ? BOARD_LINES[line] : undefined;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
      <div
        className="pixelated relative"
        style={{
          width: W,
          height: H,
          backgroundImage: 'url(/sprites/structures/scoreboard-blank-96x32.png)',
          backgroundSize: `${W}px ${H}px`,
        }}
      >
        {/* 전광판 그림 안 검은 화면 영역(시안: left 5.2%, top 9.4%, 폭 89.6%, 높이 50%) */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{ left: '5.2%', top: '9.4%', width: '89.6%', height: '50%' }}
        >
          <p
            className="bg-stand-dark border-ink font-pixel flex h-[24%] shrink-0 items-center justify-center gap-[0.6em] border-b-2"
            style={{ fontSize: Math.max(7, H * 0.045) }}
          >
            {BOARD_STEPS.map((step, i) => {
              const on = current?.highlight.includes(i) ?? false;
              return (
                <span key={step} className="flex items-center gap-[0.6em]">
                  {i > 0 && (
                    <span aria-hidden className="text-metal">
                      →
                    </span>
                  )}
                  <span
                    className={on ? 'text-accent' : 'text-metal'}
                    style={on ? { textShadow: '0 0 6px var(--color-accent)' } : undefined}
                  >
                    {step}
                  </span>
                </span>
              );
            })}
          </p>
          <p
            aria-live="polite"
            className="font-pixel-ko grid flex-1 place-items-center px-2 text-center leading-tight font-bold text-white"
            style={{
              fontSize: Math.max(12, H * 0.13),
              textShadow: '0 0 4px var(--color-accent), 0 0 10px var(--color-accent)',
            }}
          >
            {current?.text ?? ''}
          </p>
        </div>
      </div>
      <ol
        aria-label={INTRO_LABELS.progress}
        className="bg-ink fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-3 px-3 py-2"
      >
        {BOARD_LINES.map((l, i) => (
          <li
            key={l.t}
            aria-current={i === line ? 'step' : undefined}
            className={`size-4 border-2 border-white ${i <= line ? 'bg-accent' : 'bg-ink'}`}
          >
            <span className="sr-only">{i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function IntroOverlay({ onSkip }: { onSkip: () => void }) {
  const phase = useGame((s) => s.intro.phase);
  const band = useGame((s) => s.intro.band);
  const playing = phase === 'preload' || phase === 'signal' || phase === 'lap' || phase === 'zoom';
  if (!playing) return null;

  return (
    <>
      {phase === 'preload' && (
        // 0.3초 넘게 걸릴 때만 보이도록 CSS 지연(타이머로 꾸민 대기가 아님: 실제 로딩이 끝나면 바로 사라짐)
        <p className="font-pixel intro-loading fixed inset-x-0 bottom-6 z-30 text-center text-xs text-white">
          {INTRO_LABELS.loading}
        </p>
      )}
      <p aria-live="assertive" className="sr-only">
        {band !== null ? SIGNAL_BANDS[band] : ''}
      </p>
      {band !== null && (
        <div
          aria-hidden
          className="bg-ink font-pixel fixed inset-x-0 top-1/2 z-30 flex h-24 -translate-y-1/2 items-center justify-center border-y-4 border-white text-[40px] text-white max-[699px]:text-[22px]"
        >
          {SIGNAL_BANDS[band]}
        </div>
      )}
      {phase === 'lap' && <BigBoard />}
      <button
        type="button"
        onClick={onSkip}
        aria-label={INTRO_LABELS.skipAria}
        className="nine-white font-pixel text-ink fixed top-4 right-4 z-40 h-11 px-2 text-xs max-[699px]:top-2"
      >
        {INTRO_LABELS.skip}
      </button>
    </>
  );
}
