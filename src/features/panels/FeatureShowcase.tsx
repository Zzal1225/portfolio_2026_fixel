'use client';

/**
 * 프로젝트 창 "주요 기능"(11-13 사용자 결정 A안): 왼쪽 기능 목록에서 하나를 고르면 그 설명이 목록 안에서 펼쳐지고, 오른쪽 그림이 바뀐다.
 *
 * 왜 바꿨나: 이전(시안)은 "그림 + 설명"을 줄마다 좌우로 번갈아 놓았다. 폰 화면 녹화(세로 420×850)를 넣으니
 *  세로로 긴 그림 옆에 글 서너 줄만 남아 줄마다 큰 빈칸이 좌우로 번갈아 생겼고, 그림 4개를 다 세우느라 하나하나는 작았다.
 *  한 번에 하나만 보이면 그림을 크게(260×526) 쓰고도 섹션 높이는 1/3이 된다. 기능 이름 4개는 항상 다 보인다.
 * 버린 대안: 2×2 카드 격자(그림 4개가 동시에 움직여 시선이 흩어짐), 줄 배치 유지 + 그림만 키우기(창이 더 길어짐).
 *
 * 왜 탭(role="tab")이 아니라 펼침 버튼(aria-expanded)인가: 설명은 목록 안, 그림은 목록 밖 오른쪽이라
 *  "탭 패널 하나"로 묶으려면 DOM 순서와 화면 배치가 어긋난다. 펼침 버튼이면 DOM이 화면 그대로(버튼 → 그 설명)이고,
 *  창의 ←→(이전·다음 창)와 탭의 ←→가 부딪칠 일도 없다. 항상 하나는 펼쳐 둔다(펼친 것을 다시 눌러도 접지 않는다: 그림 자리가 비지 않게).
 *
 * 그림 칸 크기는 섹션의 mediaSize(없으면 시안의 248×150)를 CSS 변수(--mw·--mh)로 내린다(값마다 Tailwind 클래스를 만들 수 없다).
 * 고르지 않은 그림은 DOM에 없다 → 처음에는 1번 그림만 받는다. 고를 때 key로 <picture>를 새로 만들어 이전 그림이 잠깐 남지 않게 한다.
 * 움직임 줄이기 설정이면 <picture>가 멈춘 한 장(still)만 받는다: 끝없이 도는 그림은 우리 CSS 애니메이션과 달리 CSS로 멈출 수 없다.
 * 그림이 아직 없으면 빈 자리(role="img" + 이름, 점선 테두리).
 *
 * 휴대폰 틀(11-13 사용자 요청: GIF 딱지·스캔 막대·테두리를 없애고 아이폰 모양 틀): section.phoneFrame이 있으면 PhoneFrame으로 감싼다.
 *  그림 파일이 아니라 CSS로 그린다(둥근 남색 테두리 + 옆 버튼 + 위 가운데 알약 모양). 상표·로고는 없다(브랜드 로고 금지 규칙).
 *  함정: 알약 모양을 녹화 위에 겹치면 앱 머리글(가운데 정렬 제목)을 가린다. 녹화에는 상태 표시줄이 없으므로
 *  그 위에 상태 표시줄 띠(22px, 앱 바탕색)를 덧붙이고 알약은 그 띠 안에 둔다. 다크모드 녹화에서는 띠 색이 잠깐 어긋난다(감수).
 */
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import type { Section } from '@/content/panels';
import { TodoValue, todoText } from './TodoValue';

/**
 * 휴대폰 틀. 바깥 둥근 남색 테두리(8px) 안에 화면(상태 표시줄 띠 + 녹화)을 넣고 모서리를 둥글게 자른다.
 * 옆 버튼 3개(왼쪽 음량 2 · 오른쪽 전원)는 틀 밖으로 3px 나온 막대. 전부 장식(aria-hidden), 그림의 alt는 안쪽 img가 맡는다.
 */
function PhoneFrame({ statusBar, children }: { statusBar: string; children: ReactNode }) {
  const button = 'bg-ink absolute w-[3px]';
  return (
    <div className="bg-ink relative w-fit max-w-full rounded-[38px] p-2 max-[699px]:mx-auto">
      <span aria-hidden className={`${button} top-[92px] -left-[3px] h-7 rounded-l-sm`} />
      <span aria-hidden className={`${button} top-[130px] -left-[3px] h-7 rounded-l-sm`} />
      <span aria-hidden className={`${button} top-[112px] -right-[3px] h-11 rounded-r-sm`} />
      <div className="overflow-hidden rounded-[30px]">
        <div
          aria-hidden
          className="grid h-[22px] place-items-center"
          style={{ backgroundColor: statusBar }}
        >
          <span className="bg-ink h-3.5 w-[68px] rounded-full" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function FeatureShowcase({ section }: { section: Extract<Section, { type: 'features' }> }) {
  const [selected, setSelected] = useState(0);
  const baseId = useId();
  const size = section.mediaSize ?? { w: 248, h: 150 };
  const current = section.items[selected] ?? section.items[0];
  if (!current) return null;

  const media = (
    <div
      {...(current.media ? {} : { role: 'img', 'aria-label': todoText(current.placeholder) })}
      className={`bg-metal-light grid h-(--mh) w-(--mw) max-w-full place-items-center overflow-hidden ${current.media || section.phoneFrame ? '' : 'border-metal-dark border-2 border-dashed'}`}
    >
      {current.media ? (
        <picture key={current.media.src} className="block size-full">
          {current.media.still && (
            <source media="(prefers-reduced-motion: reduce)" srcSet={current.media.still} />
          )}
          {/* next/image가 아닌 img: 미리 구운 정적 파일이고, 움직이는 그림은 next/image가 최적화하지 못한다 */}
          <img
            src={current.media.src}
            alt={current.media.alt}
            width={size.w}
            height={size.h}
            decoding="async"
            className="block size-full object-cover"
          />
        </picture>
      ) : (
        <span aria-hidden className="font-pixel-ko text-metal-dark px-2 text-center text-[12px]">
          {todoText(current.placeholder)}
        </span>
      )}
    </div>
  );

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5 max-[699px]:grid-cols-1 max-[699px]:gap-4"
      style={{ '--mw': `${size.w}px`, '--mh': `${size.h}px` } as CSSProperties}
    >
      <ol className="border-ink border-2">
        {section.items.map((f, i) => {
          const on = i === selected;
          const descId = `${baseId}-desc-${i}`;
          return (
            <li key={i} className="border-metal-light border-b-2 last:border-b-0">
              <h4>
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={descId}
                  onClick={() => setSelected(i)}
                  className={`flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left ${on ? 'bg-menu-selected' : 'hover:bg-menu-selected'}`}
                >
                  {/* 고른 줄 표시는 색(노란 바탕)만이 아니라 ▶로도 */}
                  <span
                    aria-hidden
                    className={`font-pixel w-2 shrink-0 text-[8px] leading-none ${on ? 'text-tee-text' : 'text-transparent'}`}
                  >
                    ▶
                  </span>
                  <span
                    aria-hidden
                    className="font-pixel text-metal-dark shrink-0 text-[10px] leading-none"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[16px] leading-snug font-bold break-keep">
                    <TodoValue v={f.title} />
                  </span>
                </button>
              </h4>
              <p
                id={descId}
                hidden={!on}
                className="bg-menu-selected px-3 pt-0.5 pb-3.5 pl-[46px] text-[15px] break-keep"
              >
                <TodoValue v={f.desc} />
              </p>
            </li>
          );
        })}
      </ol>

      {section.phoneFrame ? (
        <PhoneFrame statusBar={section.phoneFrame.statusBar}>{media}</PhoneFrame>
      ) : (
        <div className="max-[699px]:mx-auto">{media}</div>
      )}
    </div>
  );
}
