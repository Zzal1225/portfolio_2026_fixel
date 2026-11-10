/**
 * 상태 없는 장식: 소품 11개 + 인필드 이정표. 전부 aria-hidden(정보가 아니고 누를 수도 없다).
 *
 * 이정표 글자만 예외로 "보이는" HTML이지만, 문구가 장식 성격(슬로건)이라 스크린리더에는 읽히지 않게 둔다.
 * 같은 내용은 ABOUT 창 본문에서 읽힌다. 좌표는 layout.ts, 문구는 content/intro.ts.
 */
import { SIGN_LINES } from '@/content/intro';
import { PROPS, SIGNPOST } from './layout';

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
