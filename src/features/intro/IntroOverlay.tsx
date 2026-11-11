'use client';
/**
 * 인트로 화면 고정 요소(월드 배율과 무관한 DOM): 신호 띠, SKIP, 큰 전광판 + 진행 점, 흑백 부채꼴, LOADING.
 *
 * 큰 전광판(11-10 시안 채택): 1.8–2.2초에 월드 안 전광판 자리에서 화면 가운데로 커지고, 9.4–10초에 제자리로 돌아간다.
 * 크기는 정수 배율 k(= floor(min(화면폭×0.56, 화면높이×1.86) / 96), 최소 3, 화면폭을 넘지 않게).
 * 문구는 켜질 때 네온 깜빡임(0.28초), 바뀌기 0.14초 전 꺼짐 — 계산은 timeline.boardAt, 여기는 그리기만.
 * 커지고 작아지는 움직임은 키프레임으로 브라우저에 넘긴다(줌과 같은 이유: timeline.zoomKeyframes 주석). 나머지는 틱이 쓴 값.
 *
 * 글자는 전부 DOM(캔버스 아님). 신호 띠·전광판 문구는 aria-live로 스크린리더에도 전한다.
 */
import { useLayoutEffect, useRef } from 'react';
import { BOARD_LINES, BOARD_STEPS, INTRO_LABELS, SIGNAL_BANDS } from '@/content/intro';
import { LANDMARKS, rectFromAnchor, type Point, type Size } from '@/features/track/layout';
import { selectScale, useGame } from '@/features/track/store';
import { SWEEP_CENTER } from './camera';
import { BOARD_OUT, T, boardAt, sampleKeyframes, sweepKeyframes } from './timeline';

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

/** 큰 판의 크기와, 커진 정도 g(0 = 제자리, 1 = 화면 가운데)의 transform */
function boardGeometry(vp: Size, cam: Point, scale: number) {
  // 제자리(월드 전광판이 지금 화면에 그려진 자리) ↔ 화면 가운데 큰 판
  const k = boardScale(vp.w, vp.h);
  const big = { w: BOARD_W * k, h: BOARD_H * k };
  const from = {
    x: (BOARD_RECT.x0 - cam.x) * scale,
    y: (BOARD_RECT.y0 - cam.y) * scale,
    w: BOARD_W * scale,
  };
  const to = { x: vp.w / 2 - big.w / 2, y: vp.h / 2 - big.h / 2, w: big.w };
  return {
    big,
    // 크기·위치를 left/top/width/height로 바꾸면 매 프레임 레이아웃이 다시 돈다(측정: 인트로 중 Layout 약 100회).
    // 큰 판 크기로 고정하고 transform(translate + scale)으로만 움직인다 → 레이아웃 없음, 합성만.
    transformAt: (g: number) =>
      `translate3d(${lerp(from.x, to.x, g)}px, ${lerp(from.y, to.y, g)}px, 0) scale(${lerp(from.w, to.w, g) / to.w})`,
  };
}

function BigBoard() {
  const elapsed = useGame((s) => s.intro.elapsed);
  const vp = useGame((s) => s.viewportPx);
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  const board = boardAt(elapsed);
  const ref = useRef<HTMLDivElement>(null);
  // 커지는 구간·작아지는 구간에 한 번씩 키프레임 재생. 값이 아니라 구간이 바뀔 때만 다시 돈다
  const segment = !board ? null : elapsed < T.BOARD_IN ? 'in' : elapsed >= BOARD_OUT ? 'out' : null;

  useLayoutEffect(() => {
    if (!segment || !ref.current) return;
    const s = useGame.getState();
    const { transformAt } = boardGeometry(s.viewportPx, s.camera, selectScale(s));
    const [a, b] = segment === 'in' ? [T.GO, T.BOARD_IN] : [BOARD_OUT, T.RUN_END];
    // b 정각의 boardAt은 다음 구간 값(커짐 유지·null)이라 바로 앞 순간으로 잰다
    const { frames, duration } = sampleKeyframes(a, b, (t) =>
      transformAt(boardAt(Math.min(t, b - 1e-6))?.grow ?? 0),
    );
    const anim = ref.current.animate(frames, { duration });
    anim.currentTime = (s.intro.elapsed - a) * 1000;
    return () => anim.cancel();
  }, [segment]);

  if (!board) return null;

  const { big, transformAt } = boardGeometry(vp, cam, scale);
  const box = {
    left: 0,
    top: 0,
    width: big.w,
    height: big.h,
    transformOrigin: '0 0',
    transform: transformAt(board.grow),
  };
  const current = board.line >= 0 ? BOARD_LINES[board.line] : undefined;
  const H = big.h; // 글자 크기는 큰 판 기준(커지는 동안 글자는 아직 없음)

  return (
    <>
      <div
        ref={ref}
        className="pixelated pointer-events-none fixed z-30"
        style={{
          ...box,
          backgroundImage: 'url(/sprites/structures/scoreboard-blank-96x32.png)',
          backgroundSize: '100% 100%',
          transition: 'transform var(--tick) linear',
          willChange: 'transform',
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

/**
 * 첫 로딩 화면(11-11 사용자 결정). 없을 때는 서버 HTML의 평소 배율 컬러 월드에 그림이 하나씩 채워지다가,
 * 코드가 실행되는 순간 전체 배율 흑백으로 튀었다(느린 망에서 약 1.2초).
 *
 * 왜 서버 HTML에 들어가야 하나: JS가 실행되기 전 화면을 가리는 것이 목적이다. store의 첫 값(covering: true)으로 서버에서도 그려진다.
 * 바탕색은 잔디를 grayscale(1)로 바꾼 색이라, 걷히는 순간 다음 화면(흑백 월드)과 이어진다.
 * SKIP(z 40)은 덮개 위에 남는다. 버린 대안: 처음부터 흑백으로 그리기 — 그림이 채워지는 모습이 남고 배율을 맞출 인라인 스크립트가 필요.
 * LOADING 글자는 0.3초 지나야 보인다(CSS 지연, 빠른 환경에서 깜빡이지 않게). 실제 준비가 끝나면 바로 사라진다(가짜 대기 없음).
 * noscript: JS가 없으면 걷을 코드도 없으니 덮지 않는다.
 */
export function LoadingCover() {
  const covering = useGame((s) => s.intro.covering);
  if (!covering) return null;
  return (
    <>
      <noscript>
        <style>{'.loading-cover{display:none}'}</style>
      </noscript>
      <div className="loading-cover fixed inset-0 z-[35] grid place-items-center">
        <p className="font-pixel intro-loading text-ink text-sm">{INTRO_LABELS.loading}</p>
      </div>
    </>
  );
}

const SKIPPABLE = ['preload', 'signal', 'lap', 'zoomin', 'greet', 'zoomout'];

export function IntroOverlay({ onSkip }: { onSkip: () => void }) {
  const band = useGame((s) => s.intro.band);
  // 재방문·reduced의 인사(입력 가능)는 건너뛸 연출이 아니다
  const playing = useGame((s) => SKIPPABLE.includes(s.intro.phase) && !s.inputEnabled);
  if (!playing) return null;

  return (
    <>
      <GraySweep />
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
 * θ는 등록된 CSS 변수 --sweep(globals.css @property). 달리는 동안은 한 바퀴 전체 키프레임(timeline.sweepKeyframes)이 프레임마다 움직이고,
 * 인라인 값(틱)은 애니메이션이 시작되기 전·못 도는 브라우저의 대비책이다.
 * 큰 전광판·신호 띠는 이 판보다 위(z)라 인트로 중에도 컬러.
 */
export function GraySweep() {
  const phase = useGame((s) => s.intro.phase);
  const sweep = useGame((s) => s.intro.sweep);
  const reduced = useGame((s) => s.intro.reduced);
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  const ref = useRef<HTMLDivElement>(null);
  const lapping = !reduced && phase === 'lap' && sweep < 360;

  useLayoutEffect(() => {
    if (!lapping || !ref.current) return;
    const { frames, duration } = sweepKeyframes();
    const anim = ref.current.animate(frames, { duration });
    anim.currentTime = (useGame.getState().intro.elapsed - T.GO) * 1000;
    return () => anim.cancel();
  }, [lapping]);

  if (reduced || !(phase === 'preload' || phase === 'signal' || phase === 'lap')) return null;
  if (sweep >= 360) return null;

  const cx = (SWEEP_CENTER.x - cam.x) * scale;
  const cy = (SWEEP_CENTER.y - cam.y) * scale;
  const edge = 'calc(360deg - var(--sweep))';
  const mask = `conic-gradient(from 180deg at ${cx}px ${cy}px, #000 0deg ${edge}, transparent ${edge} 360deg)`;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[25]"
      style={{
        ['--sweep' as string]: `${sweep}deg`,
        backdropFilter: 'grayscale(1)',
        WebkitBackdropFilter: 'grayscale(1)',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
