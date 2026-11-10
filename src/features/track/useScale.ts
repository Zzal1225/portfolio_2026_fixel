'use client';
/**
 * 화면 크기 → 정수 배율. 결과를 두 곳에 쓴다.
 *  1) store(scale·viewportPx): 카메라 계산(useRunner)이 "화면에 월드가 몇 px 보이나"를 알아야 한다.
 *  2) <html>의 --scale: CSS(globals.css 미디어 쿼리 기본값)를 실제 값으로 덮어쓴다.
 *
 * 왜 resize마다 바로 쓰지 않고 rAF 한 번으로 묶나: 창 크기를 끌 때 resize가 수십 번 오는데,
 * 배율이 바뀌면 월드 전체가 다시 그려진다. 한 프레임에 한 번이면 충분하다.
 * (CLAUDE.md의 "rAF 루프 금지"는 게임 루프 얘기다. 이건 이벤트 묶기용 1회 호출.)
 */
import { useEffect } from 'react';
import { computeScale } from './scale';
import { useGame } from './store';

export function useScale(): void {
  const setViewport = useGame((s) => s.setViewport);

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      frame = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = computeScale(w, h);
      document.documentElement.style.setProperty('--scale', String(scale));
      setViewport({ w, h }, scale);
    };
    const onResize = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [setViewport]);
}
