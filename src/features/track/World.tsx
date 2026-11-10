'use client';
/**
 * 카메라 = 월드 컨테이너 하나의 transform.
 *
 *   바깥 div(화면 크기, overflow clip) ─ 안쪽 div(640×360 월드 px)
 *   안쪽 transform: translate3d(−camX·S, −camY·S, 0) scale(S), transform-origin 0 0
 *
 * 왜 이렇게: 자식들은 전부 "월드 px" 좌표로만 놓인다(배율을 모른다). 배율·카메라가 바뀌어도
 * 바뀌는 건 이 div의 transform 하나라 레이아웃 재계산이 없다(CLAUDE.md 측정 목표 "이동 중 Layout 0회").
 * 버린 대안: 스크롤(scrollLeft) — 스크롤은 레이아웃·스크롤 이벤트를 부르고 정수 픽셀 보장이 어렵다.
 *            left/top — 바꿀 때마다 레이아웃.
 *
 * overflow: clip(hidden이 아님): hidden은 "스크롤 가능한 상자"라서, 화면 밖 요소에 포커스가 가면 브라우저가
 * 몰래 scrollLeft를 바꿔 카메라와 그림이 어긋난다. clip은 스크롤 자체가 없다.
 *
 * 정수 픽셀: 카메라 좌표(정수, cameraTarget이 반올림) × 정수 배율 = 정수 CSS px → 그림이 번지지 않는다.
 * 포커스: 월드는 Tab 정지점 하나(tabIndex 0). 방향키는 여기 포커스가 있을 때만 달린다(useRunner가 처리).
 */
import { useRef } from 'react';
import { zoneHint } from '@/content/menu';
import { WORLD_DESCRIPTION, WORLD_LABEL } from '@/content/world';
import { Props, Signpost } from './Decor';
import { Landmarks } from './Landmark';
import { WORLD } from './layout';
import { Runner, ZoneAlert } from './Runner';
import { useGame } from './store';
import { TrackScene } from './TrackScene';
import { useRunner } from './useRunner';
import { useScale } from './useScale';

/** 반응 구역에 들어가면 스크린리더에 "Press Enter to open CAREER"를 한 번 읽어 준다(`!` 그림의 글 버전) */
function ZoneAnnouncer() {
  const zone = useGame((s) => (s.open === null ? s.zone : null));
  return (
    <p className="sr-only" aria-live="polite">
      {zone ? zoneHint(zone) : ''}
    </p>
  );
}

export function World() {
  useScale();
  const worldRef = useRef<HTMLDivElement>(null);
  const controls = useRunner(worldRef);

  const scale = useGame((s) => s.scale);
  const cam = useGame((s) => s.camera);

  return (
    <div className="world-frame fixed inset-0 overflow-clip">
      <p id="world-desc" className="sr-only">
        {WORLD_DESCRIPTION}
      </p>
      <ZoneAnnouncer />
      <div
        ref={worldRef}
        tabIndex={0}
        role="group"
        aria-label={WORLD_LABEL}
        aria-describedby="world-desc"
        data-world
        className="pixelated absolute top-0 left-0 origin-top-left"
        style={{
          width: WORLD.w,
          height: WORLD.h,
          transform: `translate3d(${-cam.x * scale}px, ${-cam.y * scale}px, 0) scale(${scale})`,
          transition: 'transform var(--tick) linear',
          willChange: 'transform',
        }}
      >
        <TrackScene />
        <Props />
        <Signpost />
        <Runner />
        <Landmarks onSelect={controls.goTo} />
        <ZoneAlert />
      </div>
    </div>
  );
}
