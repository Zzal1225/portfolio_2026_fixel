'use client';
/**
 * 트랙 지도: PC 미니맵(오른쪽 아래 160×90 = 월드의 1/4)과 모바일 MAP 창(같은 지도를 크게)이 같은 컴포넌트를 쓴다.
 *
 * 왜 SVG: 배율과 상관없이 선명하고(벡터), 트랙 모양이 layout.ts 상수에서 바로 나온다(그림 파일 불필요).
 * 왜 점은 SVG 안이 아니라 HTML <button>: SVG 안에는 진짜 button을 둘 수 없다. 진짜 button이 키보드·스크린리더 동작을 그대로 준다.
 * 점 버튼 순서 = 트랙 순서(반시계) → Tab 순서가 트랙을 한 바퀴 도는 순서와 같다.
 *
 * 현재 화면 네모·러너 점: 카메라·러너 위치를 지도 비율로 줄여 transform으로 움직인다(아래 RunnerDot 주석).
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { HUD_LABELS, MAP_LABELS } from '@/content/hud';
import { MENU_LABEL, openLabel } from '@/content/menu';
import { LANDMARKS, TRACK, WORLD, rectFromAnchor, type LandmarkId } from '@/features/track/layout';
import { selectScale, useGame } from '@/features/track/store';
import { toWorld } from '@/features/track/trackPath';
import { useHudVisible } from './Hud';

/** 스타디움(뼈대에서 r만큼) 윤곽 path, 지도 좌표(월드 / k) */
function stadiumPath(r: number, k: number): string {
  const { centerLeft: a, centerRight: b } = TRACK;
  const top = (a.y - r) / k;
  const bottom = (a.y + r) / k;
  const R = r / k;
  return `M${a.x / k},${top} H${b.x / k} A${R},${R} 0 0 1 ${b.x / k},${bottom} H${a.x / k} A${R},${R} 0 0 1 ${a.x / k},${top} Z`;
}

/*
 * 러너 점·현재 화면 네모는 SVG 속성(x·y)이 아니라 HTML 요소의 transform으로 움직인다.
 * SVG rect의 x·y를 틱마다 바꾸면 SVG 레이아웃이 다시 계산된다(측정: PC 3초 달리기 중 Layout 52회 → 이 변경으로 0회 목표).
 * transform은 레이아웃 없이 합성만 한다. 크기(width·height)는 화면 크기가 바뀔 때만 바뀐다.
 */
function RunnerDot({ k, size }: { k: number; size: number }) {
  const t = useGame((s) => s.t);
  const p = toWorld(t);
  return (
    <div
      aria-hidden
      className="bg-ink pointer-events-none absolute top-0 left-0"
      style={{
        width: size,
        height: size,
        transform: `translate3d(${p.x / k - size / 2}px, ${(p.footY - 24) / k - size / 2}px, 0)`,
      }}
    />
  );
}

function ViewRect({ k }: { k: number }) {
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  const vp = useGame((s) => s.viewportPx);
  return (
    <div
      aria-hidden
      className="border-accent pointer-events-none absolute top-0 left-0 border-2"
      style={{
        width: Math.max(0, vp.w / scale / k),
        height: Math.max(0, vp.h / scale / k),
        transform: `translate3d(${cam.x / k}px, ${cam.y / k}px, 0)`,
      }}
    />
  );
}

/** 지도 그림: 시안 정적 월드(관중 1프레임·구조물·소품 포함, 29KB). 신호등·러너 없음 */
const MAP_IMAGE = '/sprites/world/world-map-640x360.png';

/**
 * 지도 그림을 브라우저가 한가해진 뒤에 붙인다. PC 미니맵은 첫 화면에 보이지만 29KB 그림이
 * 트랙 그림(LCP)과 다운로드를 다투지 않게 한다. 그 전에는 SVG 트랙 모양이 보인다.
 */
let mapImageReady = false; // 한 번 준비되면 MAP 창처럼 나중에 생긴 지도는 기다리지 않는다

function useIdleImage(): boolean {
  const [ready, setReady] = useState(mapImageReady);
  useEffect(() => {
    if (mapImageReady) return;
    const done = () => {
      mapImageReady = true;
      setReady(true);
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(done, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(done, 500); // Safari: requestIdleCallback 없음
    return () => clearTimeout(id);
  }, []);
  return ready;
}

/**
 * 지도 본체. width(px)에 맞춰 축소 비율 k = 640 / width.
 * labels=true면 점 옆에 구조물 이름(큰 지도용).
 */
export function TrackMap({
  width,
  onSelect,
  labels = false,
}: {
  width: number;
  onSelect: (id: LandmarkId) => void;
  labels?: boolean;
}) {
  const k = WORLD.w / width;
  const height = WORLD.h / k;
  const picture = useIdleImage();
  return (
    // overflow clip: 화면 네모가 지도보다 클 때(큰 화면·작은 지도) 밖으로 삐져나오지 않게
    <div className="relative overflow-clip" style={{ width, height }}>
      {/* 시안 월드 축소 그림(관중·구조물 포함). 준비 전에는 아래 SVG 트랙 모양이 자리를 지킨다 */}
      <svg
        aria-hidden
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-grass block"
      >
        <path
          d={`${stadiumPath(TRACK.outerRadius, k)} ${stadiumPath(TRACK.innerRadius, k)}`}
          fill="var(--color-track)"
          fillRule="evenodd"
        />
      </svg>
      {picture && (
        <div
          aria-hidden
          className={`absolute inset-0 ${k <= 1 ? 'pixelated' : ''}`}
          style={{ backgroundImage: `url(${MAP_IMAGE})`, backgroundSize: '100% 100%' }}
        />
      )}
      <ViewRect k={k} />
      <RunnerDot k={k} size={labels ? 10 : 6} />
      <ul>
        {LANDMARKS.map((l) => {
          const r = rectFromAnchor(l.anchor, l.size);
          const cx = (r.x0 + r.x1) / 2 / k;
          const cy = (r.y0 + r.y1) / 2 / k;
          // 가장자리 점은 이름을 안쪽으로 붙인다(가운데 정렬이면 지도 밖으로 잘림)
          const edge =
            cx < width * 0.2
              ? 'left-0'
              : cx > width * 0.8
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2';
          // 아래쪽 점은 이름을 점 위에 붙인다(지도 밖으로 잘리지 않게)
          const vertical = cy > height * 0.75 ? 'bottom-full' : 'top-full';
          return (
            <li key={l.id}>
              {/* 보이는 점은 작아도 누르는 영역은 넉넉히(작은 화면에서 손가락 실수 줄이기) */}
              <button
                type="button"
                aria-label={openLabel(l.id)}
                onClick={() => onSelect(l.id)}
                className={`group absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center ${labels ? 'min-h-11 min-w-11' : 'size-4'}`}
                style={{ left: cx, top: cy }}
              >
                <span
                  aria-hidden
                  className={`bg-accent border-ink border group-hover:bg-white ${labels ? 'size-3' : 'size-2'}`}
                />
                {labels && (
                  <span
                    aria-hidden
                    className={`font-pixel text-ink absolute bg-white px-1 text-[10px] whitespace-nowrap ${edge} ${vertical}`}
                  >
                    {MENU_LABEL[l.id]}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** PC 미니맵(폭 700 이상) */
export function Minimap({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  if (!useHudVisible()) return null;
  return (
    <nav
      aria-label={HUD_LABELS.minimap}
      className="hud-in-bottom border-ink fixed right-4 bottom-4 z-20 border-2 max-[699px]:hidden"
    >
      <TrackMap width={WORLD.w / 4} onSelect={onSelect} />
    </nav>
  );
}

/**
 * 모바일 MAP 버튼(오른쪽 위, 폭 700 미만). 누르면 큰 지도 창(MapDialog)을 연다.
 * 버튼 자체는 Radix를 쓰지 않는다: 창 코드(Radix Dialog)는 처음 누를 때 받는다(첫 화면 JS 줄이기).
 */
const MapDialog = dynamic(() => import('./MapDialog').then((m) => m.MapDialog), { ssr: false });

export function MapButton({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const visible = useHudVisible();
  if (!visible) return null;
  return (
    <>
      <button
        type="button"
        aria-label={MAP_LABELS.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        className="nine-white font-pixel text-ink fixed top-2 right-2 z-20 h-11 px-2 text-[10px] min-[700px]:hidden"
      >
        {MAP_LABELS.button}
      </button>
      {loaded && <MapDialog open={open} onOpenChange={setOpen} onSelect={onSelect} />}
    </>
  );
}
