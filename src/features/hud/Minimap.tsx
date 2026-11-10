'use client';
/**
 * 트랙 지도: PC 미니맵(오른쪽 아래 160×90 = 월드의 1/4)과 모바일 MAP 창(같은 지도를 크게)이 같은 컴포넌트를 쓴다.
 *
 * 왜 SVG: 배율과 상관없이 선명하고(벡터), 트랙 모양이 layout.ts 상수에서 바로 나온다(그림 파일 불필요).
 * 왜 점은 SVG 안이 아니라 HTML <button>: SVG 안에는 진짜 button을 둘 수 없다. 진짜 button이 키보드·스크린리더 동작을 그대로 준다.
 * 점 버튼 순서 = 트랙 순서(반시계) → Tab 순서가 트랙을 한 바퀴 도는 순서와 같다.
 *
 * 현재 화면 네모: 카메라 좌상단·화면 크기를 지도 비율로 줄여 그린다. 카메라가 움직일 때 이 rect의 x·y 속성만 바뀐다
 * (SVG 속성 변경은 레이아웃이 아니라 다시 칠하기만 일으킨다).
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
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

function RunnerDot({ k, size }: { k: number; size: number }) {
  const t = useGame((s) => s.t);
  const p = toWorld(t);
  return (
    <rect
      x={p.x / k - size / 2}
      y={(p.footY - 24) / k - size / 2}
      width={size}
      height={size}
      fill="var(--color-ink)"
    />
  );
}

function ViewRect({ k }: { k: number }) {
  const cam = useGame((s) => s.camera);
  const scale = useGame(selectScale);
  const vp = useGame((s) => s.viewportPx);
  return (
    <rect
      x={cam.x / k + 1}
      y={cam.y / k + 1}
      width={Math.max(0, vp.w / scale / k - 2)}
      height={Math.max(0, vp.h / scale / k - 2)}
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={2}
    />
  );
}

/**
 * 지도 본체. width(px)에 맞춰 축소 비율 k = 640 / width.
 * labels=true면 점 옆에 구조물 이름(큰 지도용).
 */
function TrackMap({
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
  return (
    <div className="relative" style={{ width, height }}>
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
        <ViewRect k={k} />
        <RunnerDot k={k} size={labels ? 10 : 6} />
      </svg>
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
                    className={`font-pixel text-ink absolute top-full bg-white px-1 text-[10px] whitespace-nowrap ${edge}`}
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
      className="border-ink fixed right-4 bottom-4 z-20 border-2 max-[699px]:hidden"
    >
      <TrackMap width={WORLD.w / 4} onSelect={onSelect} />
    </nav>
  );
}

/**
 * 모바일 MAP 버튼(오른쪽 위) → 큰 지도 창. 지도 위 구조물을 누르면 창을 닫고 그곳으로 달려간다(도착하면 그 창이 열림).
 * 작은 화면에서 미니맵 점은 너무 작아 누르기 어려워서 시안대로 창으로 크게 보여 준다.
 */
export function MapButton({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  const [open, setOpen] = useState(false);
  const vp = useGame((s) => s.viewportPx);
  const visible = useHudVisible();
  if (!visible) return null;
  // 창 테두리·여백을 뺀 폭, 세로는 머리 띠·안내 문구 몫을 뺀 높이에 맞춤
  const width = Math.floor(Math.min(vp.w - 56, ((vp.h - 160) * WORLD.w) / WORLD.h));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={MAP_LABELS.open}
        className="nine-white font-pixel text-ink fixed top-2 right-2 z-20 h-11 px-2 text-[10px] min-[700px]:hidden"
      >
        {MAP_LABELS.button}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-(--dim)" />
        <Dialog.Content
          aria-describedby="map-hint"
          className="dialog-content nine-white fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          <header className="bg-tee border-ink flex items-center gap-2 border-b-2 py-2 pr-2 pl-3">
            <Dialog.Title className="font-pixel text-ink flex-1 text-base">
              {MAP_LABELS.title}
            </Dialog.Title>
            <Dialog.Close
              aria-label={MAP_LABELS.close}
              className="nine-white text-ink grid size-10 place-items-center text-sm"
            >
              <span aria-hidden>✕</span>
            </Dialog.Close>
          </header>
          <p id="map-hint" className="font-pixel-ko px-3 pt-3 text-[13px] font-bold">
            {MAP_LABELS.hint}
          </p>
          <div className="p-3">
            <TrackMap
              width={Math.max(160, width)}
              labels
              onSelect={(id) => {
                setOpen(false);
                onSelect(id);
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
