'use client';

/**
 * 개발 기록(DEV LOG, 11-16 사용자 시안 2차): 위 트랙 막대의 러너가 지금 보는 기록(LAP) 눈금에 서 있고,
 * 아래에는 기록 한 장만 보인다. 이전·다음을 누르면 러너가 그 눈금까지 걸어가고 카드가 바뀐다.
 *
 * 왜 한 장씩인가(1차는 5장을 세로로 쌓았다): 기록마다 PROBLEM → TRACE → FIX → RESULT → LEARNED 다섯 줄이 되면서
 *  5장을 다 세우면 창이 화면 다섯 배로 길어진다. 한 장씩 넘기면 "한 바퀴씩 기록"이라는 말과 트랙 막대가 실제로 이어진다.
 *
 * 러너 이동:
 *  - 막대 폭과 같은 겉 칸을 translateX(눈금 %)로 민다. left를 바꾸지 않는 이유는 이 사이트의 이동이 전부 transform인 것과 같다(레이아웃 재계산 없음).
 *    translate의 %는 자기 폭 기준이라, 겉 칸이 막대와 같은 폭이면 "막대의 몇 %"가 된다.
 *  - 걷는 시간은 거리(눈금 수)에 비례: 한 눈금이든 네 눈금(5 → 1)이든 걸음 속도가 같다.
 *  - 걷는 동안만 월드 러너와 같은 스프라이트 규칙(.spr-runner data-facing·data-running)으로 발을 움직이고, transitionend에 정면으로 선다.
 *  - 움직임 줄이기 설정이면 transition이 없어 transitionend가 오지 않는다 → 그때는 걷는 상태로 바꾸지 않고 바로 옮긴다.
 *
 * 왜 탭(role="tab")이 아닌가: 창이 ←→ 키를 이전·다음 창에 쓴다. 탭 목록의 ←→와 부딪친다. 이전·다음 버튼 2개면 Tab·Enter만으로 다 된다.
 * 바뀐 카드는 aria-live="polite"로 알린다(버튼은 그대로 있어 포커스가 움직이지 않으므로, 알리지 않으면 스크린리더는 바뀐 줄 모른다).
 * 소개 글은 러너의 말풍선이다(11-16): 글 상자는 제자리에 있고 꼬리만 러너를 따라간다. 글은 스크린리더가 그대로 읽는다.
 * 트랙 막대와 아래 점 5개는 "LAP 1/5" 글자를 되풀이하는 그림이라 aria-hidden.
 *
 * 줄 앞 그림(깃발·발자국·연필·트로피·책)은 12×12 픽셀 그림을 글자 지도로 적어 SVG 사각형으로 그린다:
 *  PNG 5장을 더 받지 않고, 색은 팔레트 토큰을 그대로 쓴다. 가로로 이어진 같은 색은 사각형 하나로 묶는다.
 */
import { useState } from 'react';
import { isTodo, type Section } from '@/content/panels';
import { TodoValue, todoText } from './TodoValue';

type Laps = Extract<Section, { type: 'laps' }>;
type Lap = Laps['items'][number];

/** 한 눈금을 걷는 시간(ms). 월드에서 달리는 속도보다 느린 "걷기"로 보이는 값 */
const STEP_MS = 450;

const ICON_COLORS: Record<string, string> = {
  k: 'var(--color-ink)',
  r: 'var(--color-track)',
  y: 'var(--color-accent)',
  w: 'var(--color-white)',
  b: 'var(--color-tee)',
  g: 'var(--color-metal)',
};

const ICONS = {
  problem: [
    '..kk........',
    '..krrrrrr...',
    '..krrrrrrr..',
    '..krrrrrrr..',
    '..krrrrrr...',
    '..krrrr.....',
    '..k.........',
    '..k.........',
    '..k.........',
    '..k.........',
    '.kkk........',
    'kkkkk.......',
  ],
  trace: [
    '............',
    '..kk........',
    '.kkkk....kk.',
    '.kkkk...kkkk',
    '.kkkk...kkkk',
    '..kk....kkkk',
    '.........kk.',
    '..kk........',
    '..kk.....kk.',
    '.........kk.',
    '............',
    '............',
  ],
  fix: [
    '.........kk.',
    '........krrk',
    '.......kyyrk',
    '......kyyyk.',
    '.....kyyyk..',
    '....kyyyk...',
    '...kyyyk....',
    '..kgyyk.....',
    '.kggyk......',
    '.kggk.......',
    'kkkk........',
    'kk..........',
  ],
  result: [
    '..kkkkkkkk..',
    'kkkyyyyyykkk',
    'k.kyyyyyyk.k',
    'k.kyyyyyyk.k',
    '.kkyyyyyykk.',
    '...kyyyyk...',
    '....kyyk....',
    '.....kk.....',
    '.....kk.....',
    '....kyyk....',
    '...kkkkkk...',
    '...kkkkkk...',
  ],
  learned: [
    '.kkkkkkkkk..',
    '.kbbbbbbbkk.',
    '.kbwwwwwbkk.',
    '.kbbbbbbbkk.',
    '.kbwwwwwbkk.',
    '.kbbbbbbbkk.',
    '.kbbbbbbbkk.',
    '.kbbbbbbbkk.',
    '.kkkkkkkkkk.',
    '.kwwwwwwwwk.',
    '.kkkkkkkkkk.',
    '............',
  ],
} as const;

/**
 * 말풍선 꼬리(7×5칸, 2배 = 14×10px). 위 두 줄은 말풍선 아래 테두리(2px)를 덮어 테두리를 "열고", 아래로 계단처럼 좁아진다.
 * 꼬리만 러너와 같이 움직이고 말풍선 상자는 제자리다: 상자까지 따라가면 LAP 5에서 창 오른쪽 밖으로 나간다.
 */
const BUBBLE_TAIL = ['kwwwwwk', '.kwwwk.', '.kwwwk.', '..kwk..', '...k...'] as const;

/** 글자 지도 → 사각형 목록. 가로로 이어진 같은 색은 하나로 묶는다 */
function toRects(rows: readonly string[]) {
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let w = 1;
      while (row.charAt(x + w) === ch && x + w < row.length) w++;
      const c = ICON_COLORS[ch];
      if (c) rects.push({ x, y, w, c });
      x += w;
    }
  });
  return rects;
}

function PixelRects({ rows }: { rows: readonly string[] }) {
  return toRects(rows).map((r) => (
    <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
  ));
}

/** 줄 앞 그림. 흰 칸(남색 테두리) 안 24px. 장식이라 aria-hidden(줄 이름은 옆 글자가 말한다) */
function PixelIcon({ rows }: { rows: readonly string[] }) {
  return (
    <span
      aria-hidden
      className="border-ink row-span-2 flex size-8 items-center justify-center border-2 bg-white"
    >
      <svg viewBox="0 0 12 12" width="24" height="24" shapeRendering="crispEdges">
        <PixelRects rows={rows} />
      </svg>
    </span>
  );
}

/** 카드의 한 줄: 그림 | 영어 이름(작은 픽셀 글자) + 내용 */
function Row({
  icon,
  label,
  children,
}: {
  icon: readonly string[];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-metal-light grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      {/* dl 안 묶음(div)에는 dt·dd만 올 수 있다 → 그림은 dt 안에 넣고, dt를 display: contents로 풀어 그림과 이름이 각각 격자 칸이 되게 한다 */}
      <dt className="contents">
        <PixelIcon rows={icon} />
        <span className="font-pixel text-stand-dark min-w-0 text-[8px] leading-none">{label}</span>
      </dt>
      <dd className="col-start-2 mt-1.5 min-w-0 text-[14px] leading-relaxed break-keep">
        {children}
      </dd>
    </div>
  );
}

/**
 * 결과 칸(남색 판). 전후 숫자가 있으면 BEFORE | AFTER 두 칸 + 막대 2줄(전 = 가득, 후 = 전 대비 비율) + 무엇을 잰 값인지 한 줄.
 * 전후가 숫자가 아닌 말이면(shift) 같은 두 칸에 한글 픽셀 글자로 크게, 막대 없이(Press Start 2P에는 한글이 없다).
 * 항목별 점수면(scores) 항목마다 한 칸: 이름 + "전 → 후"(후만 노랑으로 크게). 좁은 화면은 칸을 세로로 쌓고 칸 안은 이름 | 점수 한 줄.
 *  화살표는 글자 그대로 둔다(스크린리더가 "87 오른쪽 화살표 99"로 읽어 전후 관계가 전해진다).
 * 전후가 아닌 핵심 값이면(stats) 값마다 한 칸: 이름 + 큰 값(노랑) + 무엇의 값인지 한 줄. 좁은 화면은 세로로 쌓는다.
 * 어느 것도 아닌 기록은 ▲ 한 줄. 막대는 숫자를 되풀이하는 그림이라 aria-hidden.
 * 남색 위 빈칸은 metal-light 그대로(흰 바탕용 회색은 대비가 2:1대, TodoValue 주석).
 */
function Result({ lap, labels }: { lap: Lap; labels: Laps['labels'] }) {
  const { result } = lap;
  if (result.kind === 'text') {
    return (
      <p className="bg-ink font-pixel-ko text-accent px-3 py-3 text-[15px] leading-snug font-bold break-keep">
        <span aria-hidden>▲ </span>
        {result.text}
        {result.todo && <span className="text-metal-light"> {todoText(result.todo)}</span>}
      </p>
    );
  }
  const box = 'min-w-0 border-2 px-2.5 py-2';
  if (result.kind === 'scores') {
    return (
      <div className="bg-ink px-3 py-3">
        <ul className="grid grid-cols-3 gap-2 max-[699px]:grid-cols-1">
          {result.rows.map((r) => (
            <li
              key={r.label}
              className={`${box} border-accent flex flex-col gap-2 max-[699px]:flex-row max-[699px]:items-center max-[699px]:justify-between`}
            >
              <span className="font-pixel-ko text-metal-light text-[12px] leading-none">
                {r.label}
              </span>
              <span className="font-pixel flex items-baseline gap-2 leading-none whitespace-nowrap">
                <span className="text-[13px] text-white">{r.before}</span>
                <span className="text-metal-light text-[10px]">→</span>
                <span
                  className="text-accent text-[20px]"
                  style={{ textShadow: '0 0 6px rgb(245 196 49 / 0.6)' }}
                >
                  {r.after}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="font-pixel-ko text-accent mt-3 text-[15px] leading-snug font-bold break-keep">
          <span aria-hidden>▲ </span>
          {result.headline}
        </p>
        {result.caption && (
          <p className="text-metal-light mt-1.5 text-[13px] break-keep">{result.caption}</p>
        )}
      </div>
    );
  }
  if (result.kind === 'stats') {
    return (
      <div className="bg-ink px-3 py-3">
        {/* 값이 3개면 세 칸(짧은 숫자라 좁은 화면에서도 나란히), 아니면 두 칸(좁은 화면은 세로로) */}
        <ul
          className={`grid gap-2 ${result.rows.length === 3 ? 'grid-cols-3' : 'grid-cols-2 max-[699px]:grid-cols-1'}`}
        >
          {result.rows.map((r) => (
            <li key={r.label} className={`${box} border-accent`}>
              <span className="font-pixel-ko text-metal-light block text-[12px] leading-none">
                {r.label}
              </span>
              <span
                className="font-pixel-ko text-accent mt-1.5 block text-[22px] leading-tight font-bold break-keep max-[699px]:text-[18px]"
                style={{ textShadow: '0 0 6px rgb(245 196 49 / 0.6)' }}
              >
                {r.value}
              </span>
              {r.note && (
                <span className="text-metal-light mt-1 block text-[12px] break-keep">{r.note}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="font-pixel-ko text-accent mt-3 text-[15px] leading-snug font-bold break-keep">
          <span aria-hidden>▲ </span>
          {result.headline}
        </p>
        {result.caption && (
          <p className="text-metal-light mt-1.5 text-[13px] break-keep">{result.caption}</p>
        )}
      </div>
    );
  }
  if (result.kind === 'shift') {
    // 19px: 22px에서는 "자동 테스트 전부 초록불"(12자)이 반 칸에 한 줄로 들어가지 않았다
    const word =
      'font-pixel-ko mt-1.5 block text-[19px] leading-tight font-bold break-keep max-[699px]:text-[16px]';
    return (
      <div className="bg-ink px-3 py-3">
        {/* 말은 숫자보다 길다("오프라인 시나리오 11개 통과") → 좁은 화면은 두 칸을 위아래로 쌓아 한 줄씩 쓴다 */}
        <div className="grid grid-cols-2 gap-2 max-[699px]:grid-cols-1">
          <p className={`${box} border-stand`}>
            <span className="font-pixel text-metal-light block text-[8px] leading-none">
              {labels.before}
            </span>
            <span className={`${word} text-white`}>{result.before}</span>
          </p>
          <p className={`${box} border-accent`}>
            <span className="font-pixel text-accent block text-[8px] leading-none">
              {labels.after}
            </span>
            <span
              className={`${word} text-accent`}
              style={{ textShadow: '0 0 6px rgb(245 196 49 / 0.6)' }}
            >
              {result.after}
            </span>
          </p>
        </div>
        {result.caption && (
          <p className="text-metal-light mt-2.5 text-[13px] break-keep">{result.caption}</p>
        )}
      </div>
    );
  }
  const ratio = Math.max(0, Math.min(1, result.after / result.before));
  const value = 'font-pixel mt-2 block text-[20px] leading-none max-[699px]:text-[15px]';
  return (
    <div className="bg-ink px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        <p className={`${box} border-stand`}>
          <span className="font-pixel text-metal-light block text-[8px] leading-none">
            {labels.before}
          </span>
          <span className={`${value} text-white`}>
            {result.before}
            {result.unit}
          </span>
        </p>
        <p className={`${box} border-accent`}>
          <span className="font-pixel text-accent block text-[8px] leading-none">
            {labels.after}
          </span>
          <span
            className={`${value} text-accent`}
            style={{ textShadow: '0 0 6px rgb(245 196 49 / 0.6)' }}
          >
            {result.after}
            {result.unit}
          </span>
        </p>
      </div>
      <div
        aria-hidden
        className="mt-3 grid grid-cols-[12px_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5"
      >
        <span className="font-pixel text-metal-light text-[8px] leading-none">
          {labels.barBefore}
        </span>
        <span className="bg-metal h-2.5" />
        <span className="font-pixel text-accent text-[8px] leading-none">{labels.barAfter}</span>
        <span className="bg-stand-dark h-2.5">
          <span className="bg-accent block h-full" style={{ width: `${ratio * 100}%` }} />
        </span>
      </div>
      <p className="text-metal-light mt-2.5 text-[13px] break-keep">{result.caption}</p>
    </div>
  );
}

export function LapLog({ section }: { section: Laps }) {
  const { labels, items } = section;
  const n = items.length;
  const [index, setIndex] = useState(0);
  /** 걷는 중이면 방향과 걸리는 시간, 서 있으면 null */
  const [walk, setWalk] = useState<{ facing: 'left' | 'right'; ms: number } | null>(null);

  const lap = items[index];
  if (!lap) return null;

  const wrap = (i: number) => (i + n) % n;
  const name = (i: number) => `${labels.lap} ${i + 1}`;
  const go = (to: number) => {
    if (to === index) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setWalk(
      reduced
        ? null
        : { facing: to > index ? 'right' : 'left', ms: Math.abs(to - index) * STEP_MS },
    );
    setIndex(to);
  };
  const at = (i: number) => `${(i / n) * 100}%`;
  const navButton =
    'nine-white font-pixel text-ink flex min-h-10 items-center gap-[1ch] px-3 text-[10px] whitespace-nowrap';

  return (
    <section>
      {/* 러너의 말풍선(11-16 사용자 요청): 소개 글을 상자에 넣고, 꼬리는 아래 러너 칸에서 러너 머리 위로 내려온다 */}
      <p className="border-ink font-pixel-ko border-2 bg-white px-3 py-2 text-[14px] leading-relaxed break-keep">
        {section.intro}
      </p>

      <div aria-hidden className="relative mr-3 ml-4 pt-[58px]">
        <div
          className="absolute inset-x-0 top-0 h-[58px] transition-transform ease-linear motion-reduce:transition-none"
          style={{
            transform: `translateX(${at(index)})`,
            transitionDuration: `${walk?.ms ?? 0}ms`,
          }}
          onTransitionEnd={() => setWalk(null)}
        >
          <svg
            viewBox="0 0 7 5"
            width="14"
            height="10"
            shapeRendering="crispEdges"
            className="absolute -top-0.5 -left-[7px]"
          >
            <PixelRects rows={BUBBLE_TAIL} />
          </svg>
          <div
            className="spr-runner pixelated absolute top-2.5 -left-4"
            data-facing={walk?.facing ?? 'down'}
            data-running={walk ? 'true' : 'false'}
          />
        </div>
        <div className="bg-track border-ink relative h-3.5 border-2">
          {items.map((_, i) => (
            <span
              key={i}
              className={`border-ink absolute -top-2 -bottom-2 -ml-0.5 w-1 border ${i === index ? 'bg-accent' : 'bg-white'}`}
              style={{ left: at(i) }}
            />
          ))}
        </div>
        <div className="relative mt-3 h-3">
          {items.map((_, i) => (
            <span
              key={i}
              className={`font-pixel absolute text-[8px] leading-none whitespace-nowrap ${i === index ? 'text-ink' : 'text-stand-dark'}`}
              style={{ left: at(i) }}
            >
              {name(i)}
            </span>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="mt-6">
        <article className="border-ink border-2">
          {/* 머리 띠 한 줄(11-16 사용자 요청): LAP n/전체 + 제목 | 반대편에 원문 보기. 좁은 화면은 한 줄에 셋이 들어가지 않아(제목이 네 줄로 접혔다) LAP · 원문 보기를 윗줄에, 제목을 아랫줄 전체에 둔다(order만 바꿈, DOM 순서는 그대로) */}
          <div className="bg-ink flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
            <span className="bg-accent text-ink font-pixel shrink-0 px-1.5 py-1 text-[8px] leading-none">
              {labels.lap} {index + 1}/{n}
            </span>
            <h3 className="font-pixel-ko min-w-0 flex-1 text-[16px] leading-snug font-bold break-keep text-white max-[699px]:order-last max-[699px]:basis-full">
              {lap.title}
            </h3>
            {isTodo(lap.source) ? (
              // 주소가 아직 없으면 링크가 아니라 점선 빈칸(가짜 링크 금지). 남색 위라 밝은 회색(흰 바탕용 회색은 대비 2:1대)
              <TodoValue
                v={`TODO: ${labels.source}`}
                className="font-pixel-ko border-metal-light ml-auto shrink-0 border border-dashed px-2 py-1 text-[12px] leading-none"
                todoClass="text-metal-light"
              />
            ) : (
              <a
                href={lap.source}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pixel-ko border-accent text-accent ml-auto flex min-h-8 shrink-0 items-center border-2 px-2 text-[12px] leading-none font-bold"
              >
                {labels.source}
                <span aria-hidden>&nbsp;↗</span>
              </a>
            )}
          </div>
          <div className="px-4 py-4">
            <dl>
              <Row icon={ICONS.problem} label={labels.problem}>
                <TodoValue v={lap.problem} />
              </Row>
              <Row icon={ICONS.trace} label={labels.trace}>
                <TodoValue v={lap.trace} />
              </Row>
              <Row icon={ICONS.fix} label={labels.fix}>
                <TodoValue v={lap.fix} />
              </Row>
              <Row icon={ICONS.result} label={labels.result}>
                <Result lap={lap} labels={labels} />
              </Row>
              <Row icon={ICONS.learned} label={labels.learned}>
                <TodoValue v={lap.learned} />
              </Row>
            </dl>
          </div>
        </article>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label={`${labels.prev}: ${name(wrap(index - 1))}`}
          onClick={() => go(wrap(index - 1))}
          className={navButton}
        >
          <span aria-hidden className="contents">
            <span>◀</span>
            <span>{name(wrap(index - 1))}</span>
          </span>
        </button>
        <div aria-hidden className="flex gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`border-ink size-2.5 border-2 ${i === index ? 'bg-accent' : 'bg-white'}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={`${labels.next}: ${name(wrap(index + 1))}`}
          onClick={() => go(wrap(index + 1))}
          className={navButton}
        >
          <span aria-hidden className="contents">
            <span>{name(wrap(index + 1))}</span>
            <span>▶</span>
          </span>
        </button>
      </div>
    </section>
  );
}
