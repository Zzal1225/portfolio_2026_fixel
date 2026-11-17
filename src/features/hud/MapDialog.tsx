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
import { MOBILE_MAX_W } from '@/features/track/scale';
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
  /*
   * 세로로 긴 휴대폰은 지도를 90° 돌려 세운다(11-17 사용자 요청: PC와 모바일의 지도 크기가 달라야 한다).
   * 가로 지도(16:9)를 세로 화면 폭에 맞추면 390px 화면에서 334×188이라 이름표가 7px이고 화면 아래 70%가 빈다.
   * 돌리면 긴 변이 화면 높이를 쓴다(같은 화면에서 약 333×593, 1.8배). 이름표는 반대로 돌려 바로 읽히게 한다.
   * 버린 대안: 가로로 미는 큰 지도 — 한눈에 전체가 보이지 않으면 지도의 뜻이 준다.
   * 돌려도 버튼의 DOM 순서(트랙 순서)와 이름은 그대로라 키보드·스크린리더 동작은 같다.
   */
  const upright = vp.w < MOBILE_MAX_W && vp.h > vp.w;
  // 시안: 배율 M = min((w−56)/640, (h−120)/360), 1 이상이면 0.5 단위로 내림(도트가 덜 뭉개지게). 세운 지도는 가로·세로를 바꿔 잰다
  let M = upright
    ? Math.min((vp.w - 56) / WORLD.h, (vp.h - 150) / WORLD.w)
    : Math.min((vp.w - 56) / WORLD.w, (vp.h - 120) / WORLD.h);
  if (M >= 1) M = Math.floor(M * 2) / 2;
  const width = Math.max(160, Math.floor(WORLD.w * M));
  const height = (width * WORLD.h) / WORLD.w;

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
              {/* 세운 지도: 바깥 칸이 돌린 뒤의 자리(세로로 긴 칸)를 잡고, 안쪽을 왼쪽 위 기준 90° 돌린 뒤 높이만큼 오른쪽으로 민다 */}
              <div
                className="relative"
                style={upright ? { width: height, height: width } : undefined}
              >
                <div
                  className={upright ? 'absolute top-0 left-0 origin-top-left' : ''}
                  style={
                    upright ? { transform: `translateX(${height}px) rotate(90deg)` } : undefined
                  }
                >
                  <TrackMap width={width}>
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
                                  className={`font-pixel bg-ink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 leading-none whitespace-nowrap text-white ${upright ? '-rotate-90' : ''}`}
                                  style={{
                                    fontSize: k <= 1 || upright ? 10 : 7,
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
              </div>
            </div>
            <ScrollTopButton />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
