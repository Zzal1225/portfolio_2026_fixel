'use client';
/**
 * 미니맵(PC, 오른쪽 아래 160×90 = 월드의 1/4). 인라인 SVG + 그 위 HTML 버튼 6개.
 *
 * 왜 SVG: 배율과 상관없이 선명하고(벡터), 트랙 모양이 layout.ts 상수에서 바로 나온다(그림 파일 불필요).
 * 왜 점은 SVG 안이 아니라 HTML <button>: SVG 안에는 진짜 button을 둘 수 없다. <a>나 role=button보다
 * 진짜 button이 키보드·스크린리더 동작을 그대로 준다.
 *
 * 순서: 점 버튼은 트랙 순서(반시계)로 둔다 → Tab 순서가 트랙을 한 바퀴 도는 순서와 같다.
 * 현재 화면 네모는 step2. 모바일은 미니맵 대신 MAP 창(step2).
 */
import { HUD_LABELS } from '@/content/hud';
import { openLabel } from '@/content/menu';
import { LANDMARKS, TRACK, WORLD, rectFromAnchor, type LandmarkId } from '@/features/track/layout';
import { useGame } from '@/features/track/store';
import { toWorld } from '@/features/track/trackPath';
import { useHudVisible } from './Hud';

const K = 4; // 월드 → 미니맵 축소 비율
const MW = WORLD.w / K;
const MH = WORLD.h / K;

/** 스타디움(뼈대에서 r만큼) 윤곽 path, 미니맵 좌표 */
function stadiumPath(r: number): string {
  const { centerLeft: a, centerRight: b } = TRACK;
  const top = (a.y - r) / K;
  const bottom = (a.y + r) / K;
  const R = r / K;
  return `M${a.x / K},${top} H${b.x / K} A${R},${R} 0 0 1 ${b.x / K},${bottom} H${a.x / K} A${R},${R} 0 0 1 ${a.x / K},${top} Z`;
}

function RunnerDot() {
  const t = useGame((s) => s.t);
  const p = toWorld(t);
  return (
    <rect x={p.x / K - 3} y={(p.footY - 24) / K - 3} width={6} height={6} fill="var(--color-ink)" />
  );
}

export function Minimap({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  if (!useHudVisible()) return null;
  return (
    <nav
      aria-label={HUD_LABELS.minimap}
      className="border-ink fixed right-4 bottom-4 z-20 border-2 max-[699px]:hidden"
      style={{ width: MW + 4, height: MH + 4 }}
    >
      <svg
        aria-hidden
        width={MW}
        height={MH}
        viewBox={`0 0 ${MW} ${MH}`}
        className="bg-grass block"
      >
        <path
          d={`${stadiumPath(TRACK.outerRadius)} ${stadiumPath(TRACK.innerRadius)}`}
          fill="var(--color-track)"
          fillRule="evenodd"
        />
        <RunnerDot />
      </svg>
      <ul>
        {LANDMARKS.map((l) => {
          const r = rectFromAnchor(l.anchor, l.size);
          const cx = (r.x0 + r.x1) / 2 / K;
          const cy = (r.y0 + r.y1) / 2 / K;
          return (
            <li key={l.id}>
              {/* 눈에 보이는 점은 8px지만 누르는 영역은 16px(작은 점 클릭 실수 줄이기) */}
              <button
                type="button"
                aria-label={openLabel(l.id)}
                onClick={() => onSelect(l.id)}
                className="group absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ left: cx + 2, top: cy + 2 }}
              >
                <span
                  aria-hidden
                  className="bg-accent border-ink group-hover:bg-white size-2 border"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
