'use client';
/**
 * 터치 스틱(11-17 사용자 결정): 월드를 누른 채 끌면 그 방향으로 달린다. 손을 댄 자리에 스틱 그림이 나타나고 떼면 사라진다.
 *
 * 왜 고정 방향 패드가 아닌가: 모바일 하단은 메뉴 바·◀ ▶로 이미 차 있다. 닿은 자리에 생기는 스틱은 화면을 더 가리지 않고,
 *   왼손·오른손 어느 쪽으로도 쓴다. ◀ ▶(이전·다음 지점)와 구조물 탭은 그대로다.
 * 왜 탭해서 그 자리로 가기가 아닌가: 구조물을 돌아가는 길 찾기가 새로 필요하다. 끌기는 키보드와 같은 8방향 입력이라
 *   이동·충돌 코드를 그대로 쓴다(track/stick.ts → useRunner.setStick).
 *
 * 마우스는 받지 않는다(PC는 키보드, 시안 그대로). 터치·펜만: 폭과 상관없어 키보드 없는 태블릿도 직접 달릴 수 있다.
 * 손가락 하나만 따라간다. 두 번째 손가락(확대 등)은 무시한다.
 * 그림은 ref로 직접 옮긴다: 손가락이 움직일 때마다 React가 다시 그릴 필요가 없다(transform만 바뀜).
 * 끌기 전(죽은 구간 안)에는 아무것도 하지 않으므로 구조물 탭 = 클릭이 그대로 살아 있다.
 * 브라우저가 끌기를 스크롤·새로 고침으로 가져가지 않게 월드에 touch-action을 건다(globals.css [data-world]).
 */
import { useEffect, useRef, type RefObject } from 'react';
import { STICK_MAX_PX, knobOffset, stickInput } from '@/features/track/stick';
import { NO_INPUT, selectDialogOpen, useGame, type RunnerInput } from '@/features/track/store';

/** 바탕 한 변(CSS px). 손잡이가 끝까지 가도 바탕 안에 있게: 2 × (최대 거리 + 손잡이 절반) */
const BASE_PX = 2 * (STICK_MAX_PX + 12);

export function TouchStick({
  worldRef,
  setStick,
}: {
  worldRef: RefObject<HTMLElement | null>;
  setStick: (input: RunnerInput) => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const world = worldRef.current;
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!world || !base || !knob) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const end = () => {
      pointerId = null;
      dragging = false;
      setStick(NO_INPUT);
      base.style.visibility = 'hidden';
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || pointerId !== null) return;
      const s = useGame.getState();
      // 인트로 중·창이 떠 있는 동안은 달리기 입력이 없다(키보드와 같은 조건)
      if (!s.inputEnabled || selectDialogOpen(s)) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const input = stickInput(dx, dy);
      if (!dragging) {
        if (input.dx === 0 && input.dy === 0) return; // 아직 탭일 수 있다
        dragging = true;
        base.style.transform = `translate3d(${startX - BASE_PX / 2}px, ${startY - BASE_PX / 2}px, 0)`;
        base.style.visibility = 'visible';
      }
      const k = knobOffset(dx, dy);
      knob.style.transform = `translate3d(${k.x}px, ${k.y}px, 0)`;
      setStick(input);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId === pointerId) end();
    };

    // 끄는 도중 창이 열리거나(자동 이동 도착) 인트로가 다시 시작되면 스틱을 거둔다
    const unsubscribe = useGame.subscribe((s) => {
      if (pointerId !== null && (!s.inputEnabled || selectDialogOpen(s))) end();
    });

    // 터치는 누른 요소가 뗄 때까지 이벤트를 받는다(암묵적 캡처). 그래도 window에서 듣는 이유: 펜·브라우저 차이를 타지 않게
    world.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      world.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      unsubscribe();
      end();
    };
  }, [worldRef, setStick]);

  return (
    <div
      ref={baseRef}
      aria-hidden
      data-touch-stick
      className="border-ink pointer-events-none fixed top-0 left-0 z-20 grid place-items-center border-2 bg-white/40"
      style={{ width: BASE_PX, height: BASE_PX, visibility: 'hidden' }}
    >
      <div ref={knobRef} className="bg-accent border-ink size-6 border-2" />
    </div>
  );
}
