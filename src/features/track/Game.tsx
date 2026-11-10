'use client';
/**
 * 게임 화면 최상위: 입력 훅(useRunner)·배율(useScale)을 한 번만 부르고, 그 조작 함수를
 * 월드(구조물 클릭)·HUD(메뉴·미니맵)·창에 같은 것으로 나눠 준다.
 * → "조작 4가지(키보드·터치·메뉴·미니맵)는 항상 같은 결과"(CLAUDE.md)를 구조로 보장한다.
 *
 * DOM 순서 = Tab 순서: 이름 띠 → 메뉴 → 월드 → 미니맵 → ◀ ▶(모바일) → REPLAY. 창은 Portal로 body 끝. 인트로 SKIP은 맨 끝이지만
 * 인트로 중에는 HUD가 없어 첫 Tab 정지점이 월드 다음 SKIP이 된다(아무 키로도 건너뛸 수 있음).
 */
import { useRef } from 'react';
import { preload } from 'react-dom';
import { IntroOverlay } from '@/features/intro/IntroOverlay';
import { PRELOAD_IMAGES } from '@/features/intro/preload';
import { useIntro } from '@/features/intro/useIntro';
import { PanelDialog } from '@/features/panels/PanelDialog';
import { Menu, NameBib, ReplayButton } from '@/features/hud/Hud';
import { Minimap } from '@/features/hud/Minimap';
import { TouchControls } from '@/features/hud/TouchControls';
import { useRunner } from './useRunner';
import { useScale } from './useScale';
import { World } from './World';

export function Game() {
  // <link rel=preload>: 인트로가 decode()로 기다리는 그림을 HTML 단계에서 먼저 받기 시작
  PRELOAD_IMAGES.forEach((src) => preload(src, { as: 'image' }));
  // 순서 중요: useScale의 effect가 먼저 돌아야 useIntro가 실제 배율로 절반 배율을 정한다
  useScale();
  const intro = useIntro();
  const worldRef = useRef<HTMLDivElement>(null);
  const controls = useRunner(worldRef);
  const { goTo } = controls;

  return (
    <>
      <NameBib />
      <Menu onSelect={goTo} />
      <World worldRef={worldRef} onSelect={goTo} />
      <Minimap onSelect={goTo} />
      <TouchControls press={controls.press} release={controls.release} />
      <ReplayButton onReplay={intro.replay} />
      <PanelDialog />
      <IntroOverlay onSkip={intro.skip} />
    </>
  );
}
