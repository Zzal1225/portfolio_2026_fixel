'use client';
/**
 * 창(Dialog) 하나로 6개 내용을 바꿔 끼운다. 열림 여부는 store.open 하나가 정한다.
 *
 * 왜 Radix Dialog: 포커스 트랩·ESC 닫기·배경 스크롤 잠금·aria-modal·aria-labelledby를 기본으로 준다.
 * 직접 만들면 이 다섯 가지를 다 테스트해야 한다(CLAUDE.md 접근성).
 *
 * 열리는 경로가 여러 개(구조물 Enter·메뉴·미니맵·자동 이동 도착)라 Dialog.Trigger를 쓰지 않고
 * store.open을 controlled open으로 쓴다. 닫히면 Radix가 열리기 직전 포커스 요소로 되돌린다.
 *
 * 이전·다음(◀ ▶, 창 안 ←→): 트랙 순서(layout.ts LANDMARKS)로 넘긴다. 창이 화면을 덮고 있으니 러너는
 * 그 구조물 앞으로 바로 옮긴다(시안 stepOpen과 같음). 순서 강제가 아니라 편의 기능.
 *
 * 열림·닫힘 애니메이션은 CSS(globals.css .dialog-content, Radix data-state). Framer Motion은 쓰지 않음(JS 크기).
 *
 * 제목 글자색: 시안은 파란 띠(tee) 위 흰 글자인데 대비가 약 3:1이라 WCAG AA(4.5:1)에 못 미친다(axe 확인).
 * 같은 팔레트의 ink(대비 약 5:1)로 바꿨다. docs/design-vs-plan.md #20.
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

/** 버튼·링크·탭·입력에 포커스가 있으면 ←→를 가로채지 않는다(탭 이동 등 원래 동작 보장) */
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
    // 창이 화면을 덮고 있으니 러너는 그 구조물 앞으로 바로 옮긴다(시안 stepOpen과 같음)
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
            // 시안: 열리면 ✕에 포커스(첫 링크로 튀지 않게)
            e.preventDefault();
            closeRef.current?.focus();
          }}
          onKeyDown={onKeyDown}
          className="dialog-content nine-white font-body fixed inset-x-2 bottom-2 z-50 flex max-h-[78%] flex-col outline-none min-[700px]:inset-x-auto min-[700px]:top-14 min-[700px]:bottom-auto min-[700px]:left-1/2 min-[700px]:max-h-[calc(100%-112px)] min-[700px]:w-[min(720px,calc(100%-32px))] min-[700px]:-translate-x-1/2"
        >
          {panel && (
            <>
              <header className="bg-tee border-ink flex items-center gap-2 border-b-2 py-2 pr-2 pl-3">
                <Dialog.Title className="font-pixel min-w-0 flex-1 truncate text-ink text-base leading-tight">
                  {panel.title}
                </Dialog.Title>
                <HeadButton label={DIALOG_LABELS.prev(prevTitle)} onClick={() => go(-1)}>
                  ◀
                </HeadButton>
                <HeadButton label={DIALOG_LABELS.next(nextTitle)} onClick={() => go(1)}>
                  ▶
                </HeadButton>
                <Dialog.Close asChild>
                  <HeadButton ref={closeRef} label={DIALOG_LABELS.close}>
                    ✕
                  </HeadButton>
                </Dialog.Close>
              </header>
              {/* tabIndex 0: 본문이 길면 키보드(↑↓·PageDown)로도 스크롤할 수 있어야 한다(axe scrollable-region-focusable) */}
              <div
                tabIndex={0}
                className="overflow-y-auto px-7 pt-6 pb-7 text-base leading-[1.6] focus-visible:shadow-none focus-visible:outline-offset-[-4px]"
              >
                <SectionList sections={panel.sections} />
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function HeadButton({
  label,
  children,
  ref,
  ...rest
}: {
  label: string;
  children: string;
  ref?: React.Ref<HTMLButtonElement>;
  onClick?: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className="nine-white text-ink grid size-10 shrink-0 place-items-center text-sm"
      {...rest}
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
