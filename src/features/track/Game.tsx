'use client';
/**
 * 게임 화면 최상위: 입력 훅(useRunner)·인트로(useIntro)·배율(useScale)을 한 번만 부르고, 그 조작 함수를
 * 월드(구조물 클릭)·HUD(메뉴·지도·◀ ▶)·창에 같은 것으로 나눠 준다.
 * → "조작 4가지(키보드·터치·메뉴·지도)는 항상 같은 결과"(CLAUDE.md)를 구조로 보장한다.
 *
 * DOM 순서 = Tab 순서: 로고(글) → 메뉴 → 월드 → 지도 버튼 → ◀ ▶(모바일) → REPLAY. 창은 Portal로 body 끝.
 * 인트로 중에는 HUD가 없어 첫 Tab 정지점이 월드 다음 SKIP이 된다(아무 키로도 건너뛸 수 있음).
 */
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { preload } from 'react-dom';
import { IntroOverlay } from '@/features/intro/IntroOverlay';
import { CRITICAL_IMAGES } from '@/features/intro/preload';
import { useIntro } from '@/features/intro/useIntro';
import { Logo, Menu, ReplayButton } from '@/features/hud/Hud';
import { MapLauncher } from '@/features/hud/Minimap';
import { TouchControls } from '@/features/hud/TouchControls';
import { useRunner } from './useRunner';
import { useGame } from './store';
import { useScale } from './useScale';
import { World } from './World';

/*
 * 창(Radix Dialog + 창 문구 전체)은 첫 화면에 필요 없다 → 처음 필요해질 때 받는다(store.panelsNeeded).
 * 메뉴를 누르면 캐릭터가 달려가는 동안 받아지므로 도착 때 기다림이 거의 없다. 전후 수치: docs/performance.md
 */
const PanelDialog = dynamic(
  () => import('@/features/panels/PanelDialog').then((m) => m.PanelDialog),
  { ssr: false },
);

export function Game() {
  // <link rel=preload>: 인트로가 decode()로 기다리는 그림을 HTML 단계에서 먼저 받기 시작
  CRITICAL_IMAGES.forEach((src) => preload(src, { as: 'image', fetchPriority: 'high' }));
  // 순서 중요: useScale의 effect가 먼저 돌아야 useIntro가 실제 배율로 인트로 배율을 정한다
  useScale();
  const worldRef = useRef<HTMLDivElement>(null);
  const intro = useIntro(worldRef);
  const { goTo, stepStation } = useRunner(worldRef);
  const panelsNeeded = useGame((s) => s.panelsNeeded);

  return (
    <>
      <Logo />
      <Menu onSelect={goTo} />
      <World worldRef={worldRef} onSelect={goTo} />
      <MapLauncher onSelect={goTo} />
      <TouchControls stepStation={stepStation} />
      <ReplayButton onReplay={intro.replay} />
      {panelsNeeded && <PanelDialog />}
      <IntroOverlay onSkip={intro.skip} />
    </>
  );
}
