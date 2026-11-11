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
 * 생김새(11-10 사용자 결정):
 *  - 화면 전체(딤 배경)가 스크롤되고 창은 내용 길이만큼 늘어난다. 닫기 ✕는 창 밖 화면 오른쪽 위(11-10 사용자 요청).
 *  - 창이 떠 있는 동안 메뉴·미니맵·REPLAY는 숨고(Hud.useHideForDialog), 미니맵 자리에 맨 위로 버튼(ScrollTopButton).
 *  - 머리 띠는 하늘색(tee) 바탕. 제목은 가운데, 이전·다음은 좌우(11-11). 창 이름(aria-labelledby)은 제목 h2에서 나온다.
 *  - 이전·다음 순서는 트랙 순서(layout.ts LANDMARKS)로 넘기며,
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
import { ScrollTopButton } from './ScrollTopButton';
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
  const overlayRef = useRef<HTMLDivElement>(null);

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
    // 다음 창은 맨 위부터(아래쪽 이전·다음 띠에서 눌러도 새 창 중간부터 보이지 않게)
    overlayRef.current?.scrollTo({ top: 0 });
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
        {/*
          스크롤되는 오버레이(Radix 권장 구조): 창을 딤 배경 안에 넣고, 딤 배경이 화면 전체를 스크롤한다.
          창은 내용 길이만큼 늘어난다 → 문구가 얼마나 길어질지 몰라도 창 안에 스크롤바가 생기지 않는다(11-10 사용자 요청).
          딤 배경(창 밖)을 누르면 닫힌다(Radix onPointerDownOutside 기본 동작).
        */}
        <Dialog.Overlay
          ref={overlayRef}
          className="dialog-overlay fixed inset-0 z-40 overflow-y-auto bg-(--dim)"
        >
          <Dialog.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              // 열리면 ✕에 포커스(첫 링크로 튀지 않게)
              e.preventDefault();
              closeRef.current?.focus();
            }}
            onKeyDown={onKeyDown}
            className="dialog-content nine-white font-body relative mx-auto mt-2 mb-16 w-[min(720px,calc(100%-16px))] outline-none min-[700px]:mt-4 min-[700px]:mb-8 min-[700px]:w-[min(720px,calc(100%-32px))]"
          >
            {panel && (
              <>
                {/*
                  닫기 ✕: 창 밖, 화면 오른쪽 위에 고정(사용자 요청). 포커스 트랩 안에 있어야 해서 Content 안에 두고 position: fixed.
                  창 윗변·로고·✕의 시작 높이를 맞춘다(11-11: PC 16px, 모바일 8px).
                  화면 폭이 872px보다 좁으면 창 옆에 ✕ 자리가 없어 창 오른쪽 위 모서리 안으로 들어온다(그래서 머리 띠에 ✕ 자리를 비운다).
                  빨강(track) 바탕 + 흰 ✕: 대비 약 4.5:1. 오른쪽 여백 24px은 오버레이 스크롤바를 피하려고.
                */}
                <Dialog.Close
                  ref={closeRef}
                  aria-label={DIALOG_LABELS.close}
                  className="bg-track border-ink fixed top-4 right-6 z-50 grid size-11 place-items-center border-2 text-lg font-bold text-white shadow-[0_3px_0_var(--color-track-dark)] max-[871px]:right-[calc(max(8px,(100vw-720px)/2)+12px)] max-[699px]:top-2"
                >
                  <span aria-hidden>✕</span>
                </Dialog.Close>
                {/*
                  머리 띠: 하늘색(tee) 바탕, 제목은 가운데, 이전·다음은 좌우(11-11 사용자 결정).
                  글자는 ink(흰 글자는 대비 부족, design-vs-plan #20).
                  DOM은 제목 → 이전 → 다음(스크린리더가 제목부터 읽음), 화면 배치는 grid 위치로.
                  양옆 칸을 같은 최소 폭 + 1fr로: 버튼 글자 길이가 달라도, 좁아서 제목이 줄바꿈될 때도 제목이 정확히 가운데.
                  좁은 화면: 양쪽 안쪽 여백을 똑같이 비워 ✕ 자리를 만들고(제목이 치우치지 않게), 이전 버튼만 왼쪽 여백으로 다시 당긴다. 버튼 글자는 화살표만.
                */}
                <div className="bg-tee border-ink grid grid-cols-[minmax(40px,1fr)_auto_minmax(40px,1fr)] items-center gap-2 border-b-2 px-3 py-2 max-[871px]:px-[54px]">
                  <Dialog.Title className="text-ink col-start-2 row-start-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center leading-tight">
                    <span className="font-pixel text-base">{panel.title}</span>
                    {panel.subtitle && (
                      // 부제목: 제목(영어 픽셀)보다 작은 한글 픽셀 글자. 스크린리더는 "nanaki (기록 PWA)"로 읽는다
                      <span className="font-pixel-ko text-[13px] font-bold">
                        ({panel.subtitle})
                      </span>
                    )}
                  </Dialog.Title>
                  <nav aria-label={DIALOG_LABELS.nav} className="contents">
                    <NavButton
                      label={DIALOG_LABELS.prev(prevTitle)}
                      onClick={() => go(-1)}
                      arrow="◀"
                      text={prevTitle}
                      className="col-start-1 row-start-1 justify-self-start max-[871px]:-ml-[42px]"
                    />
                    <NavButton
                      label={DIALOG_LABELS.next(nextTitle)}
                      onClick={() => go(1)}
                      arrow="▶"
                      text={nextTitle}
                      className="col-start-3 row-start-1 justify-self-end"
                      arrowLast
                    />
                  </nav>
                </div>
                <div className="px-7 pt-6 pb-7 text-base leading-[1.6]">
                  <SectionList sections={panel.sections} />
                </div>
                <ScrollTopButton />
              </>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NavButton({
  label,
  arrow,
  text,
  arrowLast,
  className,
  onClick,
}: {
  label: string;
  arrow: string;
  text: string;
  arrowLast?: boolean;
  className: string;
  onClick: () => void;
}) {
  const name = <span className="max-[871px]:hidden">{text}</span>;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`nine-white font-pixel text-ink flex min-h-10 min-w-10 items-center justify-center gap-[1ch] px-1.5 text-[10px] whitespace-nowrap ${className}`}
    >
      <span aria-hidden className="contents">
        {arrowLast && name}
        <span>{arrow}</span>
        {!arrowLast && name}
      </span>
    </button>
  );
}
