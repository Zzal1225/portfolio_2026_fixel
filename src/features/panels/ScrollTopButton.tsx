'use client';
/**
 * 창 안 "맨 위로" 버튼(11-10 사용자 요청): 창이 내용 길이만큼 늘어나 딤 배경이 스크롤되므로(PanelDialog),
 * 아무리 길어도 한 번에 위로 가게. 자리는 창이 떠 있는 동안 숨는 미니맵 자리(오른쪽 아래).
 *
 * 왜 창(Dialog.Content) 안에 position: fixed로: Radix 모달은 창 밖 요소를 누를 수 없게 막는다(포커스 트랩·pointer-events).
 * ✕ 버튼과 같은 이유.
 *
 * 스크롤 대상은 가장 가까운 .dialog-overlay(창을 감싼 스크롤 딤 배경). ref를 넘겨받지 않아 내용 창·지도 창이 그대로 같이 쓴다.
 * 조금 내려갔을 때만 보인다(맨 위에서는 할 일이 없음). visibility로 숨겨 Tab에서도 빠진다.
 * 누르면 포커스를 창 첫 버튼(✕)으로 옮긴다: 버튼이 숨으면서 포커스가 사라지지 않게.
 */
import { useEffect, useRef, useState } from 'react';
import { SCROLL_TOP } from '@/content/hud';

/** 이만큼(px) 내려가면 보인다 */
const SHOW_AFTER = 80;

export function ScrollTopButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const scroller = ref.current?.closest('.dialog-overlay');
    if (!scroller) return;
    // setState는 경계를 넘을 때만 바뀐 값이 들어가 React가 다시 그리지 않는다(스크롤마다 렌더 없음)
    const onScroll = () => setShown(scroller.scrollTop > SHOW_AFTER);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const el = ref.current;
    const scroller = el?.closest('.dialog-overlay');
    if (!el || !scroller) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    el.closest('[role="dialog"]')?.querySelector('button')?.focus({ preventScroll: true });
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-label={SCROLL_TOP.label}
      onClick={toTop}
      className={`${shown ? '' : 'invisible opacity-0'} nine-white font-pixel text-ink fixed right-6 bottom-4 z-50 h-11 px-2 text-[10px] transition-opacity duration-200 max-[699px]:right-3 max-[699px]:bottom-3 max-[699px]:text-[9px]`}
    >
      <span aria-hidden>{SCROLL_TOP.text}</span>
    </button>
  );
}
