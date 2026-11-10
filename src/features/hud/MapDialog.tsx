'use client';
/**
 * 큰 지도 창(PC 미니맵·모바일 MAP 버튼 공통, 11-10 시안 채택). 지도 위 구조물을 누르면 창을 닫고 그곳으로 달려간다(도착하면 그 창이 열림).
 * 작은 화면에서 미니맵 점은 너무 작아 누르기 어려워서 시안대로 창으로 크게 보여 준다.
 * 이 파일은 MAP 버튼을 처음 누를 때 받는다(Minimap.tsx의 dynamic import).
 * 닫히면 Radix가 포커스를 MAP 버튼으로 되돌린다(열리기 직전 포커스 요소).
 */
import * as Dialog from '@radix-ui/react-dialog';
import { MAP_LABELS } from '@/content/hud';
import { WORLD, type LandmarkId } from '@/features/track/layout';
import { useGame } from '@/features/track/store';
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
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-(--dim)" />
        <Dialog.Content
          aria-describedby="map-hint"
          className="dialog-content nine-white font-body fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          {/* 머리 띠 없음(11-10, 창과 같은 모양): 제목·안내는 본문 위, 닫기 ✕는 모서리 */}
          <div className="flex items-start gap-3 px-3 pt-3">
            <div className="flex-1">
              <Dialog.Title className="font-pixel text-ink text-base leading-tight">
                {MAP_LABELS.title}
              </Dialog.Title>
              <p id="map-hint" className="font-pixel-ko mt-2 text-[13px] font-bold">
                {MAP_LABELS.hint}
              </p>
            </div>
            <Dialog.Close
              aria-label={MAP_LABELS.close}
              className="nine-white text-ink grid size-10 shrink-0 place-items-center text-sm"
            >
              <span aria-hidden>✕</span>
            </Dialog.Close>
          </div>
          <div className="p-3">
            <TrackMap
              width={Math.max(160, width)}
              onSelect={(id) => {
                onOpenChange(false);
                onSelect(id);
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
