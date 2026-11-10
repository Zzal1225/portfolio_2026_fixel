'use client';
/**
 * 인트로 진행기: 시간표(timeline.ts)를 고정 틱으로 읽어 store에 쓴다.
 *
 * 왜 setInterval 고정 틱(60ms)인가: 러너 이동과 같은 방식이다. 틱마다 목표(t·카메라·배율)만 쓰고,
 * 사이 구간은 CSS transition(--tick)이 메운다. rAF 루프를 쓰지 않는다(CLAUDE.md).
 * 경과 시간은 performance.now()로 잰다 → 탭이 잠깐 느려져도 "지금 몇 초"가 정확하고, 밀린 틱을 몰아 돌지 않는다.
 *
 * 맡는 것: 단계 전환, 한 바퀴 동안 t, 절반 배율·정수 줌(scaleOverride), 인트로 카메라, 입력 잠금(inputEnabled),
 *          SKIP·아무 키로 건너뛰기, 첫 입력에 안내 지우기, introSeen 저장, REPLAY.
 * 맡지 않는 것: 평소 달리기·카메라(useRunner).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '@/features/track/store';
import { toWorld, wrapT } from '@/features/track/trackPath';
import { INTRO_FINISH_T } from '@/features/track/layout';
import { FOCUS_OFFSET_Y, TICK_MS } from '@/features/track/runner-config';
import { introScale } from '@/features/track/scale';
import { centerOn, centerWorld, sweepAngle, viewInWorld } from './camera';
import { preloadAssets } from './preload';
import { browserStorage, readSeen, writeSeen } from './storage';
import { SHORT_GREET_MS, fullIntroAt, greetStartMs, introMode, zoomSteps } from './timeline';

/** 건너뛰기 키로 치지 않는 키: Tab 이동·보조 키는 "입력"이 아니라 탐색이다 */
const IGNORED_KEYS = new Set(['Tab', 'Shift', 'Alt', 'Control', 'Meta', 'CapsLock']);

const runnerFocus = (t: number) => {
  const p = toWorld(t);
  return { x: p.x, y: p.footY - FOCUS_OFFSET_Y };
};

export interface IntroControls {
  skip: () => void;
  replay: () => void;
}

export function useIntro(): IntroControls {
  const [run, setRun] = useState({ token: 0, replay: false });
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const store = useGame;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let shortTimer: ReturnType<typeof setTimeout> | undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const storage = browserStorage();
    const mode = run.replay
      ? reduced
        ? 'reduced'
        : 'full'
      : introMode(readSeen(storage), reduced);
    let skipRequested = false;

    const s0 = store.getState();
    s0.closePanel();
    store.setState({
      t: 0,
      dir: 'ccw',
      phase: 'idle',
      auto: null,
      zone: null,
      inputEnabled: false,
      scaleOverride: mode === 'full' ? introScale(s0.scale) : null,
    });
    s0.setIntro({ phase: 'preload', signal: 0, band: null, boardLine: -1, reduced, sweep: 0 });
    if (mode === 'full') {
      const half = introScale(s0.scale);
      store.setState({ camera: centerWorld(viewInWorld(s0.viewportPx, half)) });
    }

    /** 인사부터: 평소 배율, 러너 가운데, 입력 허용, 본 것으로 기록 */
    const enterGreet = () => {
      const s = store.getState();
      store.setState({
        t: INTRO_FINISH_T,
        phase: 'idle',
        scaleOverride: null,
        inputEnabled: true,
        camera: centerOn(runnerFocus(INTRO_FINISH_T), viewInWorld(s.viewportPx, s.scale)),
      });
      s.setIntro({ phase: 'greet', signal: 0, band: null, boardLine: -1 });
      writeSeen(storage);
    };

    const startFull = () => {
      const base = store.getState().scale;
      const steps = zoomSteps(introScale(base), base);
      let start = performance.now();
      if (skipRequested) start -= greetStartMs(steps);
      skipRef.current = () => {
        start = performance.now() - greetStartMs(steps);
      };
      let greeted = false;

      const tick = () => {
        const s = store.getState();
        const f = fullIntroAt(performance.now() - start, steps);
        if (f.phase === 'signal' || f.phase === 'lap') {
          // 한 바퀴 + 80px: lapT 0→1을 t 0→1+INTRO_FINISH_T로 늘린다(아치에 얼굴이 가리지 않는 자리에서 멈춤)
          const lapPos = f.lapT * (1 + INTRO_FINISH_T);
          const t = wrapT(lapPos);
          store.setState({ t, phase: f.phase === 'lap' ? 'running' : 'idle', dir: 'ccw' });
          s.setIntro({
            phase: f.phase,
            signal: f.signal,
            band: f.band,
            boardLine: f.boardLine,
            // 한 바퀴를 넘긴 뒤(+80px 구간)는 각도가 다시 0 근처로 돌아가므로 360(전부 컬러)으로 고정
            sweep: lapPos >= 1 ? 360 : sweepAngle(toWorld(t)),
          });
        } else if (f.phase === 'zoom') {
          const scale = f.zoomScale ?? s.scale;
          store.setState({
            t: INTRO_FINISH_T,
            phase: 'idle',
            scaleOverride: scale,
            camera: centerOn(runnerFocus(INTRO_FINISH_T), viewInWorld(s.viewportPx, scale)),
          });
          s.setIntro({ phase: 'zoom', signal: 0, band: null, boardLine: -1 });
        } else if (f.phase === 'greet') {
          if (!greeted) {
            greeted = true;
            enterGreet();
          }
        } else {
          if (!greeted) enterGreet();
          if (store.getState().intro.phase === 'greet') s.setIntro({ phase: 'hint' });
          clearInterval(timer);
        }
      };
      tick();
      timer = setInterval(tick, TICK_MS);
    };

    const startShort = () => {
      enterGreet();
      shortTimer = setTimeout(() => {
        if (store.getState().intro.phase === 'greet') store.getState().setIntro({ phase: 'hint' });
      }, SHORT_GREET_MS);
    };

    // reduced: 인사 말풍선을 첫 입력까지 고정(손 흔들기·줌 없음)
    const startReduced = () => enterGreet();

    skipRef.current = () => {
      skipRequested = true;
    };

    preloadAssets().then(() => {
      if (cancelled) return;
      if (mode === 'full') startFull();
      else if (mode === 'short') startShort();
      else startReduced();
    });

    /** 아무 키·탭: 연출 중이면 건너뛰고, 인사·안내 중이면 안내를 지운다(다시 나오지 않음) */
    const onInput = (e: Event) => {
      if (e instanceof KeyboardEvent && IGNORED_KEYS.has(e.key)) return;
      const phase = store.getState().intro.phase;
      if (phase === 'preload' || phase === 'signal' || phase === 'lap' || phase === 'zoom') {
        skipRef.current();
      } else if (phase === 'greet' || phase === 'hint') {
        clearTimeout(shortTimer);
        store.getState().setIntro({ phase: 'done' });
      }
    };
    window.addEventListener('keydown', onInput, true);
    window.addEventListener('pointerdown', onInput, true);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(shortTimer);
      window.removeEventListener('keydown', onInput, true);
      window.removeEventListener('pointerdown', onInput, true);
    };
  }, [run]);

  const skip = useCallback(() => skipRef.current(), []);
  const replay = useCallback(() => setRun((r) => ({ token: r.token + 1, replay: true })), []);
  return { skip, replay };
}

/** 인트로 연출 중(HUD 숨김·입력 잠금 구간)인가 */
export const isIntroPlaying = (phase: string) =>
  phase === 'preload' || phase === 'signal' || phase === 'lap';
