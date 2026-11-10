'use client';
/**
 * 카메라 = 월드 컨테이너 하나의 transform.
 *
 *   바깥 div(화면 크기, overflow hidden) ─ 안쪽 div(640×360 월드 px)
 *   안쪽 transform: translate3d(−camX·S, −camY·S, 0) scale(S), transform-origin 0 0
 *
 * 왜 이렇게: 자식들은 전부 "월드 px" 좌표로만 놓인다(배율을 모른다). 배율·카메라가 바뀌어도
 * 바뀌는 건 이 div의 transform 하나라 레이아웃 재계산이 없다(CLAUDE.md 측정 목표 "이동 중 Layout 0회").
 * 버린 대안: 스크롤(scrollLeft) — 스크롤은 레이아웃·스크롤 이벤트를 부르고 정수 픽셀 보장이 어렵다.
 *            left/top — 바꿀 때마다 레이아웃.
 *
 * 정수 픽셀: 카메라 좌표(정수, cameraTarget이 반올림) × 정수 배율 = 정수 CSS px → 그림이 번지지 않는다.
 *
 * 포커스: 월드는 Tab 정지점 하나(tabIndex 0). 방향키는 여기 포커스가 있을 때만 달린다(useRunner가 처리).
 */
import { useRef } from 'react';
import { WORLD_DESCRIPTION, WORLD_LABEL } from '@/content/world';
import { WORLD } from './layout';
import { Runner } from './Runner';
import { useGame } from './store';
import { TrackScene } from './TrackScene';
import { useRunner } from './useRunner';
import { useScale } from './useScale';

export function World() {
  useScale();
  const worldRef = useRef<HTMLDivElement>(null);
  useRunner(worldRef);

  const scale = useGame((s) => s.scale);
  const cam = useGame((s) => s.camera);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <p id="world-desc" className="sr-only">
        {WORLD_DESCRIPTION}
      </p>
      <div
        ref={worldRef}
        tabIndex={0}
        role="group"
        aria-label={WORLD_LABEL}
        aria-describedby="world-desc"
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
        <Runner />
      </div>
    </div>
  );
}
