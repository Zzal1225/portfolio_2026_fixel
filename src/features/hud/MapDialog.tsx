'use client';
/**
 * 모바일 큰 지도 창. 지도 위 구조물을 누르면 창을 닫고 그곳으로 달려간다(도착하면 그 창이 열림).
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
  // 창 테두리·여백을 뺀 폭, 세로는 머리 띠·안내 문구 몫을 뺀 높이에 맞춤
  const width = Math.floor(Math.min(vp.w - 56, ((vp.h - 160) * WORLD.w) / WORLD.h));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-(--dim)" />
        <Dialog.Content
          aria-describedby="map-hint"
          className="dialog-content nine-white font-body fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          <header className="bg-tee border-ink flex items-center gap-2 border-b-2 py-2 pr-2 pl-3">
            <Dialog.Title className="font-pixel text-ink flex-1 text-base">
              {MAP_LABELS.title}
            </Dialog.Title>
            <Dialog.Close
              aria-label={MAP_LABELS.close}
              className="nine-white text-ink grid size-10 place-items-center text-sm"
            >
              <span aria-hidden>✕</span>
            </Dialog.Close>
          </header>
          <p id="map-hint" className="font-pixel-ko px-3 pt-3 text-[13px] font-bold">
            {MAP_LABELS.hint}
          </p>
          <div className="p-3">
            <TrackMap
              width={Math.max(160, width)}
              labels
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
