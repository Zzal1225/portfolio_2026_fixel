'use client';
/**
 * 트랙 지도(11-10 시안 채택):
 *  - PC 미니맵(오른쪽 아래 160×90 = 월드의 1/4)은 버튼 하나. 누르면 큰 지도 창(MapDialog).
 *  - 모바일은 오른쪽 위 MAP 버튼 → 같은 큰 지도 창.
 *  - 큰 지도 창 안에서는 구조물마다 사각형 버튼(노란 테두리 + 이름). 누르면 창을 닫고 그곳으로 달려간다.
 *
 * 그림: 시안 정적 월드 PNG(29KB)를 지도 배경으로. 브라우저가 한가해진 뒤 붙여 첫 화면 로딩과 겹치지 않게 하고,
 * 그 전에는 SVG 트랙 모양이 자리를 지킨다. 왜 구조물 버튼은 SVG 안이 아니라 HTML <button>: 진짜 button이
 * 키보드·스크린리더 동작을 그대로 준다. 버튼 순서 = 트랙 순서(반시계).
 *
 * 현재 화면 네모·러너 점은 transform으로 움직인다(SVG 속성 x·y를 바꾸면 SVG 레이아웃이 다시 계산됨, performance.md 2장).
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { MAP_LABELS } from '@/content/hud';
import { MENU_LABEL, openLabel } from '@/content/menu';
import { LANDMARKS, TRACK, WORLD, rectFromAnchor, type LandmarkId } from '@/features/track/layout';
import { selectScale, useGame } from '@/features/track/store';
import { useHideForDialog, useHudVisible } from './Hud';

/** 스타디움(뼈대에서 r만큼) 윤곽 path, 지도 좌표(월드 / k) */
function stadiumPath(r: number, k: number): string {
  const { centerLeft: a, centerRight: b } = TRACK;
  const top = (a.y - r) / k;
  const bottom = (a.y + r) / k;
  const R = r / k;
  return `M${a.x / k},${top} H${b.x / k} A${R},${R} 0 0 1 ${b.x / k},${bottom} H${a.x / k} A${R},${R} 0 0 1 ${a.x / k},${top} Z`;
}

function RunnerDot({ k, size }: { k: number; size: number }) {
  const pos = useGame((s) => s.pos);
  return (
    <div
      aria-hidden
      className="bg-ink pointer-events-none absolute top-0 left-0"
      style={{
        width: size,
        height: size,
        boxShadow: '0 0 0 1px var(--color-white)',
        transform: `translate3d(${pos.x / k - size / 2}px, ${(pos.y - 24) / k - size / 2}px, 0)`,
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

let mapImageReady = false; // 한 번 준비되면 나중에 생긴 지도(큰 지도 창)는 기다리지 않는다

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
 * onSelect가 있으면(큰 지도 창) 구조물 사각형 버튼을 얹는다. 미니맵은 그림만.
 */
export function TrackMap({
  width,
  onSelect,
}: {
  width: number;
  onSelect?: (id: LandmarkId) => void;
}) {
  const k = WORLD.w / width;
  const height = WORLD.h / k;
  const picture = useIdleImage();
  const big = onSelect !== undefined;
  return (
    // overflow clip: 화면 네모가 지도보다 클 때(큰 화면·작은 지도) 밖으로 삐져나오지 않게
    <div className="relative overflow-clip" style={{ width, height }}>
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
      {!big && <ViewRect k={k} />}
      {big && (
        <ul>
          {LANDMARKS.map((l) => {
            const r = rectFromAnchor(l.anchor, l.size);
            return (
              <li key={l.id}>
                {/* 시안: 구조물 그림 위 사각형, 2px 노란 테두리, 가운데 이름. 누르는 영역이 구조물 크기라 작은 화면에서도 넉넉 */}
                <button
                  type="button"
                  aria-label={openLabel(l.id)}
                  onClick={() => onSelect(l.id)}
                  className="border-accent hover:bg-accent/35 absolute border-2"
                  style={{
                    left: r.x0 / k,
                    top: r.y0 / k,
                    width: (r.x1 - r.x0 + 1) / k,
                    height: (r.y1 - r.y0 + 1) / k,
                  }}
                >
                  <span
                    aria-hidden
                    className="font-pixel bg-ink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 leading-none whitespace-nowrap text-white"
                    style={{ fontSize: k <= 1 ? 10 : 7, boxShadow: '0 0 0 2px var(--color-white)' }}
                  >
                    {MENU_LABEL[l.id]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <RunnerDot k={k} size={big ? 10 : 6} />
    </div>
  );
}

/** 큰 지도 창(Radix Dialog)은 처음 열 때 받는다(첫 화면 JS 줄이기) */
const MapDialog = dynamic(() => import('./MapDialog').then((m) => m.MapDialog), { ssr: false });

/**
 * PC 미니맵 버튼 + 모바일 MAP 버튼 + 둘이 함께 쓰는 큰 지도 창.
 * 닫히면 Radix가 포커스를 연 버튼으로 되돌린다.
 */
export function MapLauncher({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const open = useGame((s) => s.mapOpen);
  const setOpen = useGame((s) => s.setMapOpen);
  const [loaded, setLoaded] = useState(false);
  // 버튼만 숨긴다(창이 떠 있는 동안). 지도 창 자체는 이 컴포넌트 아래에 있으므로 컴포넌트는 그대로 둔다
  const hide = useHideForDialog();
  if (!useHudVisible()) return null;
  const show = () => {
    setLoaded(true);
    setOpen(true);
  };
  return (
    <>
      <button
        type="button"
        aria-label={MAP_LABELS.open}
        aria-haspopup="dialog"
        onClick={show}
        className={`${hide} hud-in-bottom nine-white fixed right-4 bottom-4 z-20 p-0.5 max-[699px]:hidden`}
      >
        <span className="relative block">
          <TrackMap width={WORLD.w / 4} />
          <span
            aria-hidden
            className="font-pixel bg-ink absolute -right-0.5 -bottom-0.5 px-[3px] py-0.5 text-[7px] leading-none text-white"
          >
            {MAP_LABELS.button}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={MAP_LABELS.open}
        aria-haspopup="dialog"
        onClick={show}
        className={`${hide} nine-white font-pixel text-ink fixed top-2 right-2 z-20 h-11 px-2 text-[9px] min-[700px]:hidden`}
      >
        {MAP_LABELS.button}
      </button>
      {loaded && <MapDialog open={open} onOpenChange={setOpen} onSelect={onSelect} />}
    </>
  );
}
