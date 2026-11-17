/**
 * 터치 스틱(화면 끌기) 계산: 손가락이 처음 닿은 곳에서 얼마나·어느 쪽으로 움직였나 → 달리기 입력(8방향).
 *
 * 왜 8방향으로 꺾나: 이동 규칙(movement.stepFree)이 키보드와 같은 { dx, dy } ∈ {−1, 0, 1}만 받는다.
 * 터치만 아날로그 각도로 가면 속도·충돌·스프라이트 방향을 따로 맞춰야 하고, "조작이 달라도 결과는 같다"(CLAUDE.md)가 깨진다.
 * 왜 죽은 구간(14px)을 두나: 구조물을 누르려던 탭도 손가락이 몇 px은 흔들린다. 그걸 달리기로 읽으면 탭이 먹지 않는다.
 * DOM을 모르는 순수 함수만 둔다(단위 테스트). 이벤트는 hud/TouchStick.tsx.
 */
import { NO_INPUT, type RunnerInput } from './store';
import type { KeyAxis } from './trackPath';

/** 이만큼(CSS px) 움직이기 전에는 탭으로 본다 */
export const STICK_DEAD_PX = 14;
/** 손잡이가 바탕에서 벗어날 수 있는 최대 거리(CSS px). 그림에만 쓴다(더 멀리 끌어도 속도는 같다) */
export const STICK_MAX_PX = 28;

const OCTANT = Math.PI / 4;

/** 끈 거리(dx, dy: 화면 px, 아래가 +y) → 입력. 45°씩 나눈 8칸 중 가까운 방향 */
export function stickInput(dx: number, dy: number, dead = STICK_DEAD_PX): RunnerInput {
  if (Math.hypot(dx, dy) < dead) return NO_INPUT;
  const a = Math.round(Math.atan2(dy, dx) / OCTANT) * OCTANT;
  // + 0: Math.round(−0.0…)이 −0을 내면 비교(Object.is)에서 0과 달라진다
  return {
    dx: (Math.round(Math.cos(a)) + 0) as KeyAxis,
    dy: (Math.round(Math.sin(a)) + 0) as KeyAxis,
  };
}

/** 손잡이 그림의 위치: 끈 방향 그대로, 길이만 max로 자른다 */
export function knobOffset(dx: number, dy: number, max = STICK_MAX_PX): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len <= max) return { x: dx, y: dy };
  return { x: (dx / len) * max, y: (dy / len) * max };
}
