/**
 * 상태 없는 장식: 소품 11개, 인필드 이정표, 관중, 잔디 디테일. 전부 aria-hidden(정보가 아니고 누를 수도 없다).
 *
 * 이정표 글자만 예외로 "보이는" HTML이지만, 문구가 장식 성격(슬로건)이라 스크린리더에는 읽히지 않게 둔다.
 * 같은 내용은 ABOUT 창 본문에서 읽힌다. 좌표는 layout.ts, 문구는 content/intro.ts.
 */
import { SIGN_LINES } from '@/content/intro';
import { PROPS, SIGNPOST } from './layout';
import { GRASS_DETAILS, SPECTATORS } from './layout-stands';

export function Props() {
  return (
    <div aria-hidden>
      {PROPS.map((p, i) => (
        <div
          key={i}
          className={`spr spr-prop spr-prop-${p.kind} absolute`}
          style={{ left: p.x, top: p.y }}
        />
      ))}
    </div>
  );
}

export function Signpost() {
  return (
    <div
      aria-hidden
      className="spr spr-signpost-48x50 absolute"
      style={{
        left: SIGNPOST.topLeft.x,
        top: SIGNPOST.topLeft.y,
        width: SIGNPOST.size.w,
        height: SIGNPOST.size.h,
      }}
    >
      {SIGNPOST.lines.map((pos, i) => (
        <span
          key={i}
          className="font-pixel-ko text-ink absolute leading-none font-bold whitespace-nowrap"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            // 시안: max(10px, 4.4 × 배율) CSS px. 여기선 월드 px이므로 4.4, 바닥은 12px ÷ 배율
            fontSize: 'max(4.4px, calc(12px / var(--scale)))',
          }}
        >
          {SIGN_LINES[i]}
        </span>
      ))}
    </div>
  );
}

/**
 * 관중 100명(시안 SPECTS 배치, 16×16, 옷 색 4종 × 2프레임). aria-hidden.
 *
 * 손 흔들기: 사람마다 애니메이션을 걸면 100개가 0.45초마다 스타일 재계산을 일으킨다.
 * 대신 "지금 프레임" 층과 "다음 프레임" 층 두 장을 겹쳐 두고, 두 층 컨테이너의 opacity만 번갈아 바꾼다.
 * opacity 애니메이션은 합성(compositor) 단계에서만 일어나 메인 스레드 비용이 거의 없다.
 * 사람마다 시작 프레임(phase)이 달라 같은 층 안에서도 손 든 사람·내린 사람이 섞여 있다(시안과 같음).
 */
export function Spectators() {
  return (
    <div aria-hidden>
      {[0, 1].map((layer) => (
        <div key={layer} className={`spect-layer spect-layer-${layer} absolute inset-0`}>
          {SPECTATORS.map(([x, y, kind, phase], i) => (
            <div
              key={i}
              className="spr spr-spect absolute"
              style={{
                left: x,
                top: y,
                backgroundPosition: `${-kind * 16}px ${-((phase + layer) % 2) * 16}px`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** 잔디 디테일: 관중석 아래·옆 1px 그림자 선과 잔디 점(시안 월드 격자에서 추출, 사각형 41개) */
export function GrassDetails() {
  return (
    <div aria-hidden>
      {GRASS_DETAILS.map(([x, y, w, h], i) => (
        <div
          key={i}
          className="bg-grass-dark absolute"
          style={{ left: x, top: y, width: w, height: h }}
        />
      ))}
    </div>
  );
}
