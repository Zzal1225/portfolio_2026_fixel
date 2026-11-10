'use client';
/**
 * 창(Dialog) 하나로 6개 내용을 바꿔 끼운다. 열림 여부는 store.open 하나가 정한다.
 *
 * 왜 Radix Dialog: 포커스 트랩·ESC 닫기·배경 스크롤 잠금·aria-modal·aria-labelledby를 기본으로 준다.
 * 직접 만들면 이 다섯 가지를 다 테스트해야 한다(CLAUDE.md 접근성).
 *
 * 열리는 경로가 여러 개(구조물 Enter·메뉴·지도·자동 이동 도착)라 Dialog.Trigger를 쓰지 않고
 * store.open을 controlled open으로 쓴다. 닫히면 Radix가 열리기 직전 포커스 요소로 되돌린다.
 *
 * 생김새(11-10 사용자 결정: 머리 띠 없음):
 *  - 파란 머리 띠를 없애고, 제목은 본문 맨 위의 h2로. 창 이름(aria-labelledby)은 여기서 나온다.
 *  - 닫기 ✕는 오른쪽 위 모서리에 작게 남긴다: 모바일에서 닫을 수단이고, 열릴 때 포커스를 받아
 *    키보드·스크린리더 사용자가 바로 닫을 수 있다(딤 클릭·ESC만으로는 부족).
 *  - 이전·다음은 창 아래쪽에 "◀ 이전 창 이름 · 다음 창 이름 ▶"로. 트랙 순서(layout.ts LANDMARKS)로 넘기며,
 *    창이 화면을 덮고 있으니 러너는 그 구조물 앞으로 바로 옮긴다(시안 stepOpen과 같음). 창 안 ←→도 같은 동작.
 *
 * 열림·닫힘 애니메이션은 CSS(globals.css .dialog-content, Radix data-state). Framer Motion은 쓰지 않음(JS 크기).
 */
import * as Dialog from '@radix-ui/react-dialog';
import { useRef, type KeyboardEvent } from 'react';
import { DIALOG_LABELS, PANELS } from '@/content/panels';
import { LANDMARKS, type LandmarkId } from '@/features/track/layout';
import { frontPoint } from '@/features/track/movement';
import { useGame } from '@/features/track/store';
import { SectionList } from './Sections';

/** 트랙 순서로 delta(±1)만큼 옆 구조물 */
export function neighbor(id: LandmarkId, delta: 1 | -1): LandmarkId {
  const i = LANDMARKS.findIndex((l) => l.id === id);
  const n = LANDMARKS.length;
  return LANDMARKS[(((i + delta) % n) + n) % n]!.id;
}

/** 버튼·링크·입력에 포커스가 있으면 ←→를 가로채지 않는다(원래 동작 보장) */
const isInteractive = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  el.closest('button, a, input, textarea, select, [role="tab"]') !== null;

export function PanelDialog() {
  const open = useGame((s) => s.open);
  const closePanel = useGame((s) => s.closePanel);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = (delta: 1 | -1) => {
    if (!open) return;
    const next = neighbor(open, delta);
    useGame.setState({
      open: next,
      pos: frontPoint(next),
      facing: 'down',
      zone: next,
      route: null,
      phase: 'idle',
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (isInteractive(e.target)) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  const panel = open ? PANELS[open] : null;
  const prevTitle = open ? PANELS[neighbor(open, -1)].title : '';
  const nextTitle = open ? PANELS[neighbor(open, 1)].title : '';

  return (
    <Dialog.Root open={open !== null} onOpenChange={(o) => !o && closePanel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-(--dim)" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // 열리면 ✕에 포커스(첫 링크로 튀지 않게)
            e.preventDefault();
            closeRef.current?.focus();
          }}
          onKeyDown={onKeyDown}
          className="dialog-content nine-white font-body fixed inset-x-2 bottom-2 z-50 flex max-h-[78%] flex-col outline-none min-[700px]:inset-x-auto min-[700px]:top-14 min-[700px]:bottom-auto min-[700px]:left-1/2 min-[700px]:max-h-[calc(100%-112px)] min-[700px]:w-[min(720px,calc(100%-32px))] min-[700px]:-translate-x-1/2"
        >
          {panel && (
            <>
              <Dialog.Close
                ref={closeRef}
                aria-label={DIALOG_LABELS.close}
                className="nine-white text-ink absolute top-2 right-2 z-10 grid size-10 place-items-center text-sm"
              >
                <span aria-hidden>✕</span>
              </Dialog.Close>
              {/* tabIndex 0: 본문이 길면 키보드(↑↓·PageDown)로도 스크롤할 수 있어야 한다(axe scrollable-region-focusable) */}
              <div
                tabIndex={0}
                className="overflow-y-auto px-7 pt-6 pb-5 text-base leading-[1.6] focus-visible:shadow-none focus-visible:outline-offset-[-4px]"
              >
                <Dialog.Title className="text-ink mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 pr-12 leading-tight">
                  <span className="font-pixel text-base">{panel.title}</span>
                  {panel.subtitle && (
                    // 부제목: 제목(영어 픽셀)보다 작은 한글 픽셀 글자. 스크린리더는 "nanaki (기록 PWA)"로 읽는다
                    <span className="font-pixel-ko text-[13px] font-bold">({panel.subtitle})</span>
                  )}
                </Dialog.Title>
                <SectionList sections={panel.sections} />
              </div>
              <nav
                aria-label={DIALOG_LABELS.nav}
                className="border-metal-light flex shrink-0 justify-between gap-2 border-t-2 px-3 py-2"
              >
                <NavButton label={DIALOG_LABELS.prev(prevTitle)} onClick={() => go(-1)}>
                  {`◀ ${prevTitle}`}
                </NavButton>
                <NavButton label={DIALOG_LABELS.next(nextTitle)} onClick={() => go(1)}>
                  {`${nextTitle} ▶`}
                </NavButton>
              </nav>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NavButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="nine-white font-pixel text-ink min-h-10 px-1.5 text-[10px] whitespace-nowrap"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
