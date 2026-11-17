'use client';
/**
 * 큰 지도 창(PC 미니맵·모바일 MAP 버튼 공통, 11-10 시안 채택). 지도 위 구조물을 누르면 창을 닫고 그곳으로 달려간다(도착하면 그 창이 열림).
 * 작은 화면에서 미니맵 점은 너무 작아 누르기 어려워서 시안대로 창으로 크게 보여 준다.
 * 이 파일은 MAP 버튼을 처음 누를 때 받는다(Minimap.tsx의 dynamic import).
 * 닫히면 Radix가 포커스를 MAP 버튼으로 되돌린다(열리기 직전 포커스 요소).
 */
import * as Dialog from '@radix-ui/react-dialog';
import { MAP_LABELS } from '@/content/hud';
import { MENU_LABEL, openLabel } from '@/content/menu';
import { LANDMARKS, WORLD, rectFromAnchor, type LandmarkId } from '@/features/track/layout';
import { useGame } from '@/features/track/store';
import { ScrollTopButton } from '@/features/panels/ScrollTopButton';
import { TrackMap } from './Minimap';

export function MapDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: LandmarkId) => void;
}) {
  const vp = useGame((s) => s.viewportPx);
  // 시안: 배율 M = min((w−56)/640, (h−120)/360), 1 이상이면 0.5 단위로 내림(도트가 덜 뭉개지게)
  let M = Math.min((vp.w - 56) / WORLD.w, (vp.h - 120) / WORLD.h);
  if (M >= 1) M = Math.floor(M * 2) / 2;
  const width = Math.floor(WORLD.w * M);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* 창과 같은 모양(11-10): 딤 배경이 스크롤, 닫기 ✕는 창 밖 화면 오른쪽 위, 제목 띠는 하늘색 */}
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 grid justify-items-center overflow-y-auto bg-(--dim) pt-2 pb-16 min-[700px]:pt-4 min-[700px]:pb-8">
          <Dialog.Content
            aria-describedby="map-hint"
            className="dialog-content nine-white font-body relative self-start outline-none"
          >
            <Dialog.Close
              aria-label={MAP_LABELS.close}
              className="bg-track border-ink fixed top-4 right-6 z-50 grid size-11 place-items-center border-2 text-lg font-bold text-white shadow-[0_3px_0_var(--color-track-dark)] max-[699px]:top-2 max-[699px]:right-3"
            >
              <span aria-hidden>✕</span>
            </Dialog.Close>
            <div className="bg-tee border-ink flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 border-b-2 px-4 py-3 text-center max-[871px]:px-[54px]">
              <Dialog.Title className="font-pixel text-ink text-base leading-tight">
                {MAP_LABELS.title}
              </Dialog.Title>
              <p id="map-hint" className="font-pixel-ko text-ink text-[13px] font-bold">
                {MAP_LABELS.hint}
              </p>
            </div>
            <div className="p-3">
              <TrackMap width={Math.max(160, width)}>
                {(k) => (
                  // 버튼 순서 = 트랙 순서(반시계). 진짜 <button>이라 키보드·스크린리더 동작을 그대로 준다
                  <ul>
                    {LANDMARKS.map((l) => {
                      const r = rectFromAnchor(l.anchor, l.size);
                      return (
                        <li key={l.id}>
                          {/* 시안: 구조물 그림 위 사각형, 2px 노란 테두리, 가운데 이름. 누르는 영역이 구조물 크기라 작은 화면에서도 넉넉 */}
                          <button
                            type="button"
                            aria-label={openLabel(l.id)}
                            onClick={() => {
                              onOpenChange(false);
                              onSelect(l.id);
                            }}
                            className="border-accent hover:bg-accent/35 absolute border-2"
                            style={{
                              left: r.x0 / k,
                              top: r.y0 / k,
                              width: (r.x1 - r.x0 + 1) / k,
                              height: (r.y1 - r.y0 + 1) / k,
                            }}
                          >
                            <span
                              aria-hidden
                              className="font-pixel bg-ink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 leading-none whitespace-nowrap text-white"
                              style={{
                                fontSize: k <= 1 ? 10 : 7,
                                boxShadow: '0 0 0 2px var(--color-white)',
                              }}
                            >
                              {MENU_LABEL[l.id]}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </TrackMap>
            </div>
            <ScrollTopButton />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
