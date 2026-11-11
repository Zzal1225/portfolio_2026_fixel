'use client';
/**
 * 인트로 진행기: 시간표(timeline.ts, 시안 14.3초)를 고정 틱으로 읽어 store에 쓴다.
 *
 * 왜 setInterval 고정 틱(60ms)인가: 러너 이동과 같은 방식이다. 틱마다 목표(위치·카메라·배율)만 쓰고,
 * 사이 구간은 CSS transition(--tick)이 메운다. rAF 루프를 쓰지 않는다(CLAUDE.md).
 * 예외는 줌 두 번: 곡선이 60ms 조각으로 깨져 보여서 틱과 같은 수식을 키프레임으로 구워 브라우저에 넘긴다(timeline.zoomKeyframes).
 * 틱은 줌 중에도 store를 계속 쓴다(상태는 언제나 정답). 키프레임은 그 위를 덮어 "보이는 움직임"만 맡는다.
 * 경과 시간은 performance.now()로 잰다 → 탭이 잠깐 느려져도 "지금 몇 초"가 정확하고, 밀린 틱을 몰아 돌지 않는다.
 *
 * 맡는 것: 단계 전환, 한 바퀴 위치, 배율(scaleOverride: 월드 전체 → 줌인 → 줌아웃, 소수 가능), 인트로 카메라,
 *          입력 잠금(inputEnabled), SKIP·아무 키로 건너뛰기(→ 인트로 끝 상태로), 첫 입력에 안내 지우기, REPLAY.
 * 방문할 때마다 전체 인트로(11-10 6차 결정). REPLAY도 같은 길.
 * 맡지 않는 것: 평소 달리기·카메라(useRunner).
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { INTRO_FINISH_T, TRACK } from '@/features/track/layout';
import { lanePoint } from '@/features/track/movement';
import { FOCUS_OFFSET_Y, TICK_MS } from '@/features/track/runner-config';
import { useGame } from '@/features/track/store';
import { facing as laneFacing } from '@/features/track/trackPath';
import { centerOn, lapSweep, viewInWorld } from './camera';
import { preloadAssets } from './preload';
import {
  T,
  introAt,
  introCamera,
  introMode,
  lapDistance,
  zoomKeyframes,
  type ScaleSet,
} from './timeline';

/** 건너뛰기 키로 치지 않는 키: Tab 이동·보조 키는 "입력"이 아니라 탐색이다 */
const IGNORED_KEYS = new Set(['Tab', 'Shift', 'Alt', 'Control', 'Meta', 'CapsLock']);
/** 인트로가 끝나 서는 자리: 출발선 + 80px(아치에 얼굴이 가리지 않게) */
const FINISH = lanePoint(INTRO_FINISH_T * TRACK.length);

export interface IntroControls {
  skip: () => void;
  replay: () => void;
}

export function useIntro(worldRef: RefObject<HTMLDivElement | null>): IntroControls {
  // REPLAY = 이 값을 올려 effect를 다시 돌린다(처음 방문과 같은 길)
  const [run, setRun] = useState(0);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const store = useGame;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let zoom: Animation | undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mode = introMode(reduced);
    let skipRequested = false;

    const s0 = store.getState();
    const vp = s0.viewportPx;
    const scales: ScaleSet = {
      whole: Math.min(vp.w / 640, vp.h / 360),
      zoom: vp.w < 700 ? 3 : s0.scale + 2,
      normal: s0.scale,
    };
    s0.closePanel();
    store.setState({
      pos: mode === 'full' ? lanePoint(0) : FINISH,
      facing: mode === 'full' ? 'right' : 'down',
      phase: 'idle',
      route: null,
      zone: null,
      inputEnabled: false,
      scaleOverride: mode === 'full' ? scales.whole : null,
      camera: mode === 'full' ? introCamera({ x: 320, y: 180 }, scales.whole, vp) : s0.camera,
    });
    s0.setIntro({ phase: 'preload', elapsed: 0, signal: 0, band: null, reduced, sweep: 0 });

    /** 인트로 끝 상태(시안 toReady): 평소 배율, 러너는 출발선 +80px에서 정면, 입력 허용, 키캡 안내 */
    const enterReady = () => {
      const s = store.getState();
      store.setState({
        pos: FINISH,
        facing: 'down',
        phase: 'idle',
        scaleOverride: null,
        inputEnabled: true,
        camera: centerOn(
          { x: FINISH.x, y: FINISH.y - FOCUS_OFFSET_Y },
          viewInWorld(s.viewportPx, s.scale),
        ),
      });
      s.setIntro({ phase: 'ready', signal: 0, band: null, sweep: 360, elapsed: T.END });
    };

    const startFull = () => {
      let start = performance.now();
      if (skipRequested) start -= T.END * 1000;
      skipRef.current = () => {
        start = performance.now() - T.END * 1000;
        zoom?.cancel();
      };

      /** 줌 한 구간 재생. 틱이 구간 시작보다 늦게 왔을 수 있어 그만큼 앞으로 맞춘다 */
      const playZoom = (a: number, b: number, t: number) => {
        const el = worldRef.current;
        if (!el) return;
        const focus = { x: FINISH.x, y: FINISH.y - FOCUS_OFFSET_Y };
        const { frames, duration } = zoomKeyframes(
          a,
          b,
          scales,
          focus,
          store.getState().viewportPx,
        );
        zoom?.cancel();
        zoom = el.animate(frames, { duration });
        zoom.currentTime = (t - a) * 1000;
      };
      let zoomedIn = false;
      let zoomedOut = false;

      const tick = () => {
        const t = (performance.now() - start) / 1000;
        if (t >= T.END) {
          clearInterval(timer);
          enterReady();
          return;
        }
        if (!zoomedIn && t >= T.RUN_END && t < T.ZOOM_IN_END) {
          zoomedIn = true;
          playZoom(T.RUN_END, T.ZOOM_IN_END, t);
        }
        if (!zoomedOut && t >= T.GREET_END) {
          zoomedOut = true;
          playZoom(T.GREET_END, T.END, t);
        }
        const s = store.getState();
        const pos = lanePoint(lapDistance(t));
        const f = introAt(t, scales, { x: pos.x, y: pos.y - FOCUS_OFFSET_Y });
        const lapping = f.phase === 'lap';
        store.setState({
          pos,
          facing: lapping
            ? laneFacing(f.s / TRACK.length, 'ccw')
            : t >= T.RUN_END
              ? 'down'
              : 'right',
          phase: lapping ? 'running' : 'idle',
          scaleOverride: f.scale,
          camera: introCamera(f.center, f.scale, s.viewportPx),
        });
        s.setIntro({
          phase: f.phase,
          elapsed: t,
          signal: f.signal,
          band: f.band,
          sweep: lapSweep(pos, f.s),
        });
      };
      tick();
      timer = setInterval(tick, TICK_MS);
    };

    /** reduced-motion: 인사 말풍선을 첫 입력까지 고정(손 흔들기·줌 없음) */
    const startReduced = () => {
      const s = store.getState();
      store.setState({
        inputEnabled: true,
        camera: centerOn(
          { x: FINISH.x, y: FINISH.y - FOCUS_OFFSET_Y },
          viewInWorld(s.viewportPx, s.scale),
        ),
      });
      s.setIntro({ phase: 'greet', sweep: 360 });
    };

    skipRef.current = () => {
      skipRequested = true;
    };

    preloadAssets().then(() => {
      if (cancelled) return;
      if (mode === 'full') startFull();
      else startReduced();
    });

    /** 아무 키·탭: 연출 중이면 끝 상태로 건너뛰고, 인사·안내 중이면 안내를 지운다(다시 나오지 않음) */
    const onInput = (e: Event) => {
      if (e instanceof KeyboardEvent && IGNORED_KEYS.has(e.key)) return;
      const s = store.getState();
      const phase = s.intro.phase;
      if (!s.inputEnabled && phase !== 'ready' && phase !== 'done') {
        skipRef.current();
      } else if (phase === 'greet' || phase === 'ready') {
        s.setIntro({ phase: 'done' });
      }
    };
    window.addEventListener('keydown', onInput, true);
    window.addEventListener('pointerdown', onInput, true);

    return () => {
      cancelled = true;
      clearInterval(timer);
      zoom?.cancel();
      window.removeEventListener('keydown', onInput, true);
      window.removeEventListener('pointerdown', onInput, true);
    };
  }, [run, worldRef]);

  const skip = useCallback(() => skipRef.current(), []);
  const replay = useCallback(() => setRun((r) => r + 1), []);
  return { skip, replay };
}
