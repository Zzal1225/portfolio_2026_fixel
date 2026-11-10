'use client';
/**
 * 인트로 화면 고정 요소(월드 배율과 무관한 DOM): 신호 띠, SKIP, 큰 전광판 + 진행 점, 흑백 부채꼴, LOADING.
 *
 * 큰 전광판(11-10 시안 채택): 1.8–2.2초에 월드 안 전광판 자리에서 화면 가운데로 커지고, 9.4–10초에 제자리로 돌아간다.
 * 크기는 정수 배율 k(= floor(min(화면폭×0.56, 화면높이×1.86) / 96), 최소 3, 화면폭을 넘지 않게).
 * 문구는 켜질 때 네온 깜빡임(0.28초), 바뀌기 0.14초 전 꺼짐 — 계산은 timeline.boardAt, 여기는 그리기만.
 * 위치는 틱(60ms)마다 바뀌고 transition이 메운다.
 *
 * 글자는 전부 DOM(캔버스 아님). 신호 띠·전광판 문구는 aria-live로 스크린리더에도 전한다.
 */
import { BOARD_LINES, BOARD_STEPS, INTRO_LABELS, SIGNAL_BANDS } from '@/content/intro';
import { LANDMARKS, rectFromAnchor } from '@/features/track/layout';
import { selectScale, useGame } from '@/features/track/store';
import { SWEEP_CENTER } from './camera';
import { boardAt } from './timeline';

const BOARD_W = 96;
const BOARD_H = 32;
const BOARD_RECT = (() => {
  const l = LANDMARKS.find((x) => x.id === 'career')!;
  return rectFromAnchor(l.anchor, l.size);
})();

function boardScale(w: number, h: number): number {
  const k = Math.floor(Math.min(w * 0.56, h * 1.86) / BOARD_W);
  const fit = Math.floor((w - 16) / BOARD_W);
  return Math.max(Math.min(3, fit), Math.min(k, fit));
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function BigBoard() {
  const elapsed = useGame((s) => s.intro.elapsed);
  const vp = useGame((s) => s.viewportPx);
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  const board = boardAt(elapsed);
  if (!board) return null;

  // 제자리(월드 전광판이 지금 화면에 그려진 자리) ↔ 화면 가운데 큰 판
  const k = boardScale(vp.w, vp.h);
  const big = { w: BOARD_W * k, h: BOARD_H * k };
  const from = {
    x: (BOARD_RECT.x0 - cam.x) * scale,
    y: (BOARD_RECT.y0 - cam.y) * scale,
    w: BOARD_W * scale,
    h: BOARD_H * scale,
  };
  const to = { x: vp.w / 2 - big.w / 2, y: vp.h / 2 - big.h / 2, ...big };
  const g = board.grow;
  const box = {
    left: lerp(from.x, to.x, g),
    top: lerp(from.y, to.y, g),
    width: lerp(from.w, to.w, g),
    height: lerp(from.h, to.h, g),
  };
  const current = board.line >= 0 ? BOARD_LINES[board.line] : undefined;
  const H = big.h; // 글자 크기는 큰 판 기준(커지는 동안 글자는 아직 없음)

  return (
    <>
      <div
        className="pixelated pointer-events-none fixed z-30"
        style={{
          ...box,
          backgroundImage: 'url(/sprites/structures/scoreboard-blank-96x32.png)',
          backgroundSize: '100% 100%',
          transition:
            'left var(--tick) linear, top var(--tick) linear, width var(--tick) linear, height var(--tick) linear',
        }}
      >
        {/* 전광판 그림 안 검은 화면 영역(시안: left 5.2%, top 9.4%, 폭 89.6%, 높이 50%) */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{
            left: '5.2%',
            top: '9.4%',
            width: '89.6%',
            height: '50%',
            opacity: current && board.on ? 1 : 0,
          }}
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
            className="font-pixel-ko grid flex-1 place-items-center px-2 text-center leading-tight font-bold whitespace-nowrap text-white"
            style={{
              fontSize: Math.max(12, H * 0.13),
              textShadow:
                '0 0 2px var(--color-accent), 0 0 8px var(--color-accent), 0 0 18px var(--color-accent), 0 0 30px var(--color-accent)',
            }}
          >
            {current?.text ?? ''}
          </p>
        </div>
      </div>
      {board.line >= 0 && (
        <ol
          aria-label={INTRO_LABELS.progress}
          className="bg-ink pointer-events-none fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-3 px-3 py-2"
        >
          {BOARD_LINES.map((l, i) => (
            <li
              key={l.t}
              aria-current={i === board.line ? 'step' : undefined}
              className={`size-4 border-2 border-white ${i <= board.line ? 'bg-accent' : 'bg-ink'}`}
            >
              <span className="sr-only">{i + 1}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

const SKIPPABLE = ['preload', 'signal', 'lap', 'zoomin', 'greet', 'zoomout'];

export function IntroOverlay({ onSkip }: { onSkip: () => void }) {
  const phase = useGame((s) => s.intro.phase);
  const band = useGame((s) => s.intro.band);
  // 재방문·reduced의 인사(입력 가능)는 건너뛸 연출이 아니다
  const playing = useGame((s) => SKIPPABLE.includes(s.intro.phase) && !s.inputEnabled);
  if (!playing) return null;

  return (
    <>
      <GraySweep />
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
      <BigBoard />
      <button
        type="button"
        onClick={onSkip}
        aria-label={INTRO_LABELS.skipAria}
        className="nine-white font-pixel text-ink fixed top-4 right-4 z-40 h-11 px-2.5 text-xs max-[699px]:top-2"
      >
        {INTRO_LABELS.skip}
      </button>
    </>
  );
}

/**
 * 흑백 → 컬러(부채꼴, 시안). 화면 전체를 덮는 투명 판에 backdrop-filter: grayscale(1)을 걸고,
 * 러너가 아직 안 지나간 각도만 남기는 conic-gradient 마스크를 씌운다(월드를 두 벌 그리지 않음).
 * 마스크 각도: CSS conic은 위에서 시계 방향. "from 180deg"(아래)에서 시계 방향 0~(360−θ)가 아직 흑백인 쪽.
 * 큰 전광판·신호 띠는 이 판보다 위(z)라 인트로 중에도 컬러.
 */
export function GraySweep() {
  const phase = useGame((s) => s.intro.phase);
  const sweep = useGame((s) => s.intro.sweep);
  const reduced = useGame((s) => s.intro.reduced);
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  if (reduced || !(phase === 'preload' || phase === 'signal' || phase === 'lap')) return null;
  if (sweep >= 360) return null;

  const cx = (SWEEP_CENTER.x - cam.x) * scale;
  const cy = (SWEEP_CENTER.y - cam.y) * scale;
  const gray = 360 - sweep;
  const mask = `conic-gradient(from 180deg at ${cx}px ${cy}px, #000 0deg ${gray}deg, transparent ${gray}deg 360deg)`;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[25]"
      style={{
        backdropFilter: 'grayscale(1)',
        WebkitBackdropFilter: 'grayscale(1)',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
