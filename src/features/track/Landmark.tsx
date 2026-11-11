'use client';
/**
 * 구조물 6개: 그림 + 그 위 HTML 이름 + 클릭 버튼(작업 7).
 *
 * - <button aria-label="Open CAREER">: 스크린리더·클릭 둘 다. 이름 글자는 aria-hidden(라벨과 두 번 읽히지 않게).
 * - tabIndex -1: 키보드 사용자는 메뉴 아이콘으로 같은 일을 한다(CLAUDE.md 접근성). 월드 안 버튼에 Tab이 가면
 *   화면 밖 버튼으로 포커스가 튀어 카메라와 어긋난다. 월드 자체가 Tab 정지점 하나다.
 * - 반응 구역 안이면 data-selected → sprites.css가 1px 노란 외곽선 그림을 겹친다.
 * - 이름 글자 크기: 시안은 월드 5~8px(배율을 곱해 10~32 CSS px). 모바일 2배에서 5px은 10px이라
 *   "12px 이상" 기준에 못 미쳐 max(시안 크기, 12px ÷ 배율)로 바닥을 깐다.
 *
 * 좌표는 전부 layout.ts. 이 파일엔 "어떻게 보이나"(글자 색)만 있다.
 */
import type { CSSProperties } from 'react';
import { BOARD_IDLE } from '@/content/intro';
import { ARCH_INTRO_LABEL, MENU_LABEL, openLabel } from '@/content/menu';
import {
  LANDMARKS,
  rectFromAnchor,
  type Landmark as LandmarkData,
  type LandmarkId,
} from './layout';
import { INTRO_PLAYING, useGame } from './store';

/** 구조물 그림 바탕색에 맞춘 글자색(시안 표) */
const LABEL_STYLE: Record<LandmarkData['sprite'], CSSProperties> = {
  'arch-96x64': { color: 'var(--color-ink)' },
  'scoreboard-96x32': {
    color: 'var(--color-accent)',
    textShadow: '0 0 4px var(--color-accent), 0 0 10px var(--color-accent)',
  },
  'water-a-64x32': { color: 'var(--color-ink)' },
  'water-b-64x32': { color: 'var(--color-ink)' },
  'tent-64x64': { color: 'var(--color-white)' },
  'reception-table-64x32': { color: 'var(--color-ink)' },
};

/** 월드 px 글자 크기, 단 화면에서 12px 미만으로 작아지지 않게 */
export const worldFont = (worldPx: number) => `max(${worldPx}px, calc(12px / var(--scale)))`;

function LandmarkButton({
  data,
  selected,
  intro,
  onSelect,
}: {
  data: LandmarkData;
  selected: boolean;
  /** 인트로 연출 중: 아치는 START, 전광판은 비움(큰 전광판이 따로 뜸) */
  intro: boolean;
  onSelect: (id: LandmarkId) => void;
}) {
  const r = rectFromAnchor(data.anchor, data.size);
  // 인트로 중에는 눌러도 아무 일이 없으므로 손가락 커서를 보이지 않는다
  const enabled = useGame((s) => s.inputEnabled);
  // 전광판은 평소 "CAREER"를 화면에 띄운다(인트로 문구는 작업 13에서 Scoreboard가 맡음)
  const text =
    data.id === 'career'
      ? intro
        ? ''
        : BOARD_IDLE
      : data.id === 'about' && intro
        ? ARCH_INTRO_LABEL
        : MENU_LABEL[data.id];

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={openLabel(data.id)}
      data-selected={selected}
      onClick={() => onSelect(data.id)}
      className={`spr spr-selected spr-${data.sprite} absolute border-0 p-0 ${enabled ? '' : 'cursor-default'}`}
      style={{
        left: r.x0,
        top: r.y0,
        width: data.size.w,
        height: data.size.h,
        backgroundColor: 'transparent',
        // 겹침: 바닥 y가 클수록 앞(러너는 발 y, Runner.tsx 주석)
        zIndex: data.anchor.y,
      }}
    >
      <span
        aria-hidden
        className="font-pixel pointer-events-none absolute leading-none whitespace-nowrap"
        style={{
          left: data.label.dx,
          top: data.label.dy,
          transform: 'translate(-50%, -50%)',
          fontSize: worldFont(data.label.fontSize),
          zIndex: 1,
          ...LABEL_STYLE[data.sprite],
        }}
      >
        {text}
      </span>
    </button>
  );
}

export function Landmarks({ onSelect }: { onSelect: (id: LandmarkId) => void }) {
  // zone만 구독: t가 바뀌어도 zone이 같으면 구조물 6개는 다시 그려지지 않는다
  const zone = useGame((s) => s.zone);
  const open = useGame((s) => s.open);
  const intro = useGame((s) => INTRO_PLAYING.includes(s.intro.phase));
  return (
    <>
      {LANDMARKS.map((l) => (
        <LandmarkButton
          key={l.id}
          data={l}
          selected={zone === l.id && open === null}
          intro={intro}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
