'use client';
/**
 * 게임 화면 최상위: 입력 훅(useRunner)·배율(useScale)을 한 번만 부르고, 그 조작 함수를
 * 월드(구조물 클릭)·HUD(메뉴·미니맵)·창에 같은 것으로 나눠 준다.
 * → "조작 4가지(키보드·터치·메뉴·미니맵)는 항상 같은 결과"(CLAUDE.md)를 구조로 보장한다.
 *
 * DOM 순서 = Tab 순서: 이름 띠 → 메뉴 → 월드 → 미니맵. 창은 Portal로 body 끝.
 *
 * 임시 연결(useRunner 작성 전): goTo가 아직 빈 함수라 메뉴를 눌러도 아무 일이 없으면 창 확인이 안 된다.
 * USE_RUNNER_READY가 false인 동안만 "달려가기 없이 바로 창 열기"로 대신한다. true가 되면 자동으로 빠진다.
 */
import { useRef } from 'react';
import { PanelDialog } from '@/features/panels/PanelDialog';
import { Menu, NameBib } from '@/features/hud/Hud';
import { Minimap } from '@/features/hud/Minimap';
import type { LandmarkId } from './layout';
import { useGame } from './store';
import { USE_RUNNER_READY, useRunner } from './useRunner';
import { useScale } from './useScale';
import { World } from './World';

export function Game() {
  useScale();
  const worldRef = useRef<HTMLDivElement>(null);
  const controls = useRunner(worldRef);
  const openPanel = useGame((s) => s.openPanel);

  const goTo = USE_RUNNER_READY ? controls.goTo : (id: LandmarkId) => openPanel(id);

  return (
    <>
      <NameBib />
      <Menu onSelect={goTo} />
      <World worldRef={worldRef} onSelect={goTo} />
      <Minimap onSelect={goTo} />
      <PanelDialog />
    </>
  );
}
