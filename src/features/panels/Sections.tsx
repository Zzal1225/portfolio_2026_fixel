/**
 * 창 본문 섹션 렌더러. content/panels.ts의 섹션 타입(text·hero·starts·origin·laps·callout·traits·summary·cards·cases·stack·resume·quest·features·tags·designSystem)만 보고 그린다.
 *
 * 왜 섹션 타입 방식인가: 창 6개가 "수치 → 문제 → 고민 → 품질 → 회고" 같은 비슷한 뼈대를 공유한다.
 * 창마다 JSX를 따로 짜면 문구 수정이 컴포넌트 수정이 되고, 문구가 content/ 밖으로 샌다.
 * 버린 대안: MDX — 글은 편하지만 빌드 설정이 늘고, 섹션 모양(수치 카드 등)을 강제하기 어렵다.
 *
 * TODO로 시작하는 값은 "[나머지]" 회색 빈칸으로 그린다(TodoValue, 시안의 [YYYY.MM] 표기).
 * 11-12: 프로젝트 창이 사용자 시안(quest·features·tags·designSystem)으로 바뀌면서 쓰는 곳이 없어진 stats·list·timeline·links는 지웠다.
 */
import { createContext, Fragment, useContext, type CSSProperties, type ReactNode } from 'react';
import { isTodo, type Section, type StackGroup, type StackItem } from '@/content/panels';
import { FeatureShowcase } from './FeatureShowcase';
import { LapLog } from './LapLog';
import { LoopVideo } from './LoopVideo';
import { Resume } from './Resume';
import { TodoValue, todoText } from './TodoValue';

const todoClass = (s: string) => (isTodo(s) ? 'text-metal-dark' : '');

/** flush: 아래 여백 없이(머리글 옆에 링크를 나란히 둘 때 바깥 줄이 여백을 맡는다) */
function Heading({ children, flush }: { children: ReactNode; flush?: boolean }) {
  return (
    <h3
      className={`font-pixel-ko flex items-center gap-2 text-[15px] font-bold ${flush ? '' : 'mb-3'}`}
    >
      <span aria-hidden className="bg-tee border-stand-dark inline-block size-2 border" />
      {children}
    </h3>
  );
}

/**
 * ABOUT ME 맨 위. 사진 오른쪽 아래 모서리에 픽셀 러너가 서서 "트랙 위 캐릭터 = 사진 속 나"를 한눈에 잇는다.
 * 사진: 1배·2배 WebP를 srcset으로(브라우저가 화면 밀도에 맞는 것만 받는다). width·height(320×400)를 적어 사진이 늦게 와도 자리가 먼저 잡힌다(CLS 0).
 * 러너: 시트의 손 흔들기 팔 든 칸(5행 2번째, 32×48)을 3배로. 장식이라 aria-hidden.
 */
function Hero({ section }: { section: Extract<Section, { type: 'hero' }> }) {
  const { src, alt } = section.photo;
  return (
    <section className="grid grid-cols-[270px_minmax(0,1fr)] items-end gap-x-7 max-[699px]:grid-cols-1 max-[699px]:gap-y-5">
      <div className="relative w-[270px] max-[699px]:mx-auto max-[699px]:max-w-[calc(100%-32px)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 미리 구운 정적 파일. next/image 런타임 최적화가 필요 없다(scripts/build-photos.mjs) */}
        <img
          src={`/img/${src}-320.webp`}
          srcSet={`/img/${src}-320.webp 1x, /img/${src}-640.webp 2x`}
          alt={alt}
          width={320}
          height={400}
          decoding="async"
          className="border-ink block h-auto w-full border-2"
        />
        <div
          aria-hidden
          className="pixelated absolute"
          style={{
            right: -32,
            bottom: -7,
            width: 96,
            height: 144,
            backgroundImage: 'url(/sprites/character/runner-sheet-128x240.png)',
            backgroundSize: '384px 720px',
            backgroundPosition: '-96px -576px',
          }}
        />
      </div>
      <div className="min-w-0 pb-3">
        <p className="font-pixel text-stand-dark text-[10px] leading-relaxed">{section.eyebrow}</p>
        <h3 className="font-pixel-ko mt-3 text-2xl leading-snug font-bold">{section.title}</h3>
        <p className={`mt-3 break-keep ${todoClass(section.body)}`}>{section.body}</p>
      </div>
    </section>
  );
}

/**
 * 출발선 N개. 점선 하나를 깔고 그 위에 칸을 올린다(칸은 흰색·노란색 바탕이라 점선을 가린다).
 * PC는 가로, 좁은 화면은 세로: 세 칸이 나란히 들어가지 않아서 점선 방향만 바꾼다(.starts-line).
 * 노란 칸의 뜻은 색만으로 전하지 않는다: 연도가 글자로 있고 aria-current로도 알린다.
 */
function Starts({ section }: { section: Extract<Section, { type: 'starts' }> }) {
  return (
    <section>
      <Heading>{section.heading}</Heading>
      <div className="relative">
        <span aria-hidden className="starts-line absolute" />
        <ol className="relative grid grid-cols-3 gap-x-1 max-[699px]:grid-cols-1 max-[699px]:gap-y-4">
          {section.items.map((it) => (
            <li
              key={it.period}
              aria-current={it.current ? 'step' : undefined}
              className="relative pt-7 max-[699px]:pt-0 max-[699px]:pl-8"
            >
              <span
                aria-hidden
                className={`border-ink absolute top-0 left-0 size-5 border-2 ${it.current ? 'bg-accent' : 'bg-white'}`}
              />
              <span className="font-pixel text-stand-dark block text-[10px] leading-relaxed">
                {it.period}
              </span>
              <strong className="block text-[15px]">{it.title}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Traits({ section }: { section: Extract<Section, { type: 'traits' }> }) {
  return (
    <section>
      <Heading>{section.heading}</Heading>
      <dl className="border-ink border-y-2">
        {section.items.map((it) => (
          <div
            key={it.tag}
            className="border-metal-light grid grid-cols-[160px_minmax(0,1fr)] gap-x-8 border-b py-3 last:border-b-0 max-[699px]:grid-cols-1 max-[699px]:gap-y-1"
          >
            <dt className="font-pixel-ko text-[16px] leading-snug font-bold break-keep">
              {it.tag}
            </dt>
            <dd className={`text-[15px] break-keep ${todoClass(it.desc)}`}>{it.desc}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** 픽셀 글자 소제목(TEAM·POSITION 등). dt로 쓴다 */
const LABEL = 'font-pixel text-stand-dark text-[9px] leading-relaxed';

/**
 * 경력 요약 판. 항목 이름-값 쌍이라 dl로(스크린리더가 "TEAM 파워정보통신"처럼 묶어 읽는다).
 * 왼쪽 칸은 어두운 바탕이라 머리글을 accent로 쓴다(ink 위 대비 충분).
 */
function Summary({ section }: { section: Extract<Section, { type: 'summary' }> }) {
  const { total, team, facts } = section;
  return (
    <section className="border-ink grid grid-cols-[225px_minmax(0,1fr)] border-2 max-[699px]:grid-cols-1">
      <div className="bg-ink flex flex-col justify-center px-5 py-4 text-white">
        <p className="font-pixel text-accent text-[10px] leading-relaxed">{total.label}</p>
        <p className="font-pixel-ko mt-1 text-[30px] leading-tight font-bold">{total.value}</p>
        <p className="text-metal-light mt-1 text-sm">{total.note}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-5 py-3 max-[479px]:grid-cols-1">
        <div className="col-span-full">
          <dt className={LABEL}>{team.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-pixel-ko text-[22px] leading-tight font-bold">{team.value}</span>
            {team.note && <span className="text-metal-dark text-[13px]">{team.note}</span>}
          </dd>
        </div>
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className={LABEL}>{f.label}</dt>
            <dd className="border-ink border-b pb-0.5 text-[15px] leading-snug font-bold">
              {f.lines.map((l) => (
                <span key={l.text} className="flex flex-wrap items-center gap-x-1.5">
                  {l.text}
                  {l.badge && (
                    <span className="border-stand-dark text-stand-dark border px-1 text-[11px] font-normal">
                      {l.badge}
                    </span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * 첫 작업물 한 칸(11-13 사용자 요청: 이전 사이트의 주황 카드 "PUBLISHER → FRONTEND"를 이 사이트 컨셉으로).
 * 컨셉 옮기기: 주황 둥근 카드 → 남색 테두리 판 + 트랙색 레인 띠(흰 레인 선 2줄) 안 제목, 둥근 사진 → 픽셀 모니터(남색 틀 + 받침) 속 영상,
 *  둥근 검정 버튼 → 파란 9-slice 버튼.
 * 배치(11-13 2차): 띠(제목) → 모니터(가로 전체) → 글(가로 전체, 문단 나눔) → 버튼 + 덧붙임. 처음에는 글 옆에 280px 모니터를 뒀는데
 *  글 칸이 좁아 문장마다 두세 줄로 접혔고, 그 사이트의 특징인 움직임이 작은 그림으로는 보이지 않았다.
 * 왜 띠가 track-dark인가: 밝은 트랙색(#C0563F) 위 흰 글자는 대비 4.4:1로 작은 글자 기준(4.5:1)에 못 미친다.
 * 글 폭은 한 줄 40자 안팎이 되게 묶지 않고 칸 전체를 쓴다(사용자 요청). 대신 문단 사이를 띄우고 줄 간격을 넉넉히 둔다.
 */
function Origin({ section }: { section: Extract<Section, { type: 'origin' }> }) {
  const { video } = section;
  return (
    <section className="border-ink border-2">
      <h3 className="bg-track-dark font-pixel-ko relative px-5 pt-3 pb-4 text-[19px] leading-snug font-bold break-keep text-white">
        {section.title}
        {/* 레인 선: 띠 아래쪽 흰 줄 2개(장식) */}
        <span aria-hidden className="absolute inset-x-0 bottom-[3px] h-px bg-white/60" />
        <span aria-hidden className="absolute inset-x-0 bottom-[7px] h-px bg-white/30" />
      </h3>
      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="flex flex-col items-center">
          <div className="bg-ink w-full p-2 pb-4">
            <LoopVideo
              sources={video.sources}
              poster={video.poster}
              label={video.alt}
              width={800}
              height={450}
              className="block aspect-video h-auto w-full"
            />
          </div>
          {/* 모니터 받침(장식) */}
          <span aria-hidden className="bg-ink h-3 w-12" />
          <span aria-hidden className="bg-ink h-2 w-36" />
        </div>
        <p className="text-[15px] leading-[1.8] break-keep whitespace-pre-line">{section.body}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href={section.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="nine-tee font-pixel-ko inline-flex min-h-11 items-center gap-1.5 px-2 text-[14px] font-bold text-white"
          >
            {section.link.label}
            <span aria-hidden>↗</span>
          </a>
          {section.note && <p className="text-muted text-[13px] break-keep">{section.note}</p>}
        </div>
      </div>
    </section>
  );
}

function Callout({ section }: { section: Extract<Section, { type: 'callout' }> }) {
  const { eyebrow, title, body } = section;
  return (
    <section className="border-ink bg-menu-selected border-2 px-5 py-4">
      {eyebrow && (
        <p className="font-pixel text-stand-dark mb-2 text-[11px] leading-relaxed">{eyebrow}</p>
      )}
      {title && (
        <h3 className="font-pixel-ko mb-2 text-[19px] leading-snug font-bold break-keep">
          {title}
        </h3>
      )}
      <p className={`text-[15px] break-keep ${todoClass(body)}`}>{body}</p>
    </section>
  );
}

/**
 * 나란한 카드. 칸 높이는 grid가 맞춘다(내용이 짧은 카드도 옆 카드만큼 늘어난다).
 * 머리글 색은 tee를 어둡게 한 --color-tee-text: tee 그대로는 흰 바탕 대비 3.05:1이라 작은 글자 기준(4.5:1) 미달.
 */
function Cards({ section }: { section: Extract<Section, { type: 'cards' }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 max-[699px]:grid-cols-1">
      {section.items.map((c) => (
        <article
          key={c.title}
          className="border-ink border-2 px-4 pt-3.5 pb-5 shadow-[inset_0_-4px_0_var(--color-metal-light)]"
        >
          <p className="font-pixel mb-2 text-[10px] leading-relaxed text-tee-text">{c.eyebrow}</p>
          <h3 className="font-pixel-ko mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[17px] leading-snug font-bold break-keep">
            {c.title}
            {c.badge && (
              <span className="border-ink bg-accent font-body border px-1 text-[11px] leading-[1.6] font-bold">
                {c.badge}
              </span>
            )}
          </h3>
          {c.body && <p className="mb-2 text-[15px] break-keep">{c.body}</p>}
          <ul className="flex flex-col gap-1">
            {c.bullets.map((b) => (
              <li key={b.text} className="flex gap-2 text-[15px]">
                <span aria-hidden className="text-metal-dark">
                  ·
                </span>
                <span>
                  {b.text}
                  {b.sub && <span className="text-metal-dark ml-1.5">{b.sub}</span>}
                </span>
              </li>
            ))}
          </ul>
          {c.note && <p className="text-metal-dark mt-2 text-[13px] break-keep">{c.note}</p>}
        </article>
      ))}
    </div>
  );
}

/**
 * 문제 → 해결 → 결과. 순서가 뜻을 가지므로 ol. 화살표는 칸 사이 간격에 띄운 장식(aria-hidden, 읽는 순서는 목록이 알려 준다).
 * 좁은 화면은 칸을 세로로 쌓고 화살표를 90도 돌려 아래로 향하게 한다.
 * 제목·본문이 TODO면 "[...]" 빈칸으로.
 */
function Cases({ section }: { section: Extract<Section, { type: 'cases' }> }) {
  return (
    <section>
      <Heading>{section.heading}</Heading>
      <div className="flex flex-col gap-3">
        {section.items.map((c) => (
          <article key={c.title} className="border-ink border-2 p-4">
            <h4 className="font-pixel-ko mb-2.5 text-[16px] leading-snug font-bold break-keep">
              <TodoValue v={c.title} />
            </h4>
            <ol className="grid grid-cols-3 gap-x-7 max-[699px]:grid-cols-1 max-[699px]:gap-y-7">
              {c.steps.map((st, i) => {
                const last = i === c.steps.length - 1;
                const bodyColor = last ? 'font-bold' : i === 0 ? 'text-metal-dark' : '';
                return (
                  <li
                    key={st.label}
                    className={`relative px-3 py-2.5 ${last ? 'border-accent bg-menu-selected border-2' : 'bg-metal-light/40'}`}
                  >
                    <p className="font-pixel-ko text-stand-dark mb-1 text-[13px] font-bold">
                      {st.label}
                    </p>
                    <p className={`text-[14px] leading-relaxed break-keep ${bodyColor}`}>
                      <TodoValue v={st.body} />
                    </p>
                    {!last && (
                      <span
                        aria-hidden
                        className="text-metal-dark absolute top-1/2 -right-[22px] -translate-y-1/2 max-[699px]:top-auto max-[699px]:right-auto max-[699px]:-bottom-6 max-[699px]:left-1/2 max-[699px]:-translate-x-1/2 max-[699px]:translate-y-0 max-[699px]:rotate-90"
                      >
                        →
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 아이콘 자리: 흰 칸 안의 로고. 로고 색이 남색 판 위에서 묻히지 않게 흰 칸을 깐다(시안).
 * 이름은 옆·아래 글자가 읽히므로 alt="" 장식. width·height를 적어 늦게 와도 칸이 흔들리지 않는다.
 * 로고는 매끈한 벡터라 pixelated를 걸지 않는다(Zustand PNG도 2배로 구워 둠).
 * frame은 바깥 테두리 칸, box는 흰 칸, logo는 그림 크기(시안: 52·32 / 36·24 / 64·28).
 * 바깥 테두리가 "어디서 썼나"를 말한다(11-17 사용자 시안): 실무 = 노란 실선 + 오른쪽 위 노란 모서리 조각, 프로젝트 = 파란 점선.
 *  색만으로 나누지 않는다: 선 모양(실선·점선)과 모서리 조각이 다르고, 이름 옆에 숨은 글자로도 적는다(UseNote).
 */
function Mark({
  icon,
  frame,
  box,
  logo,
  use,
}: {
  icon: string;
  frame: number;
  box: number;
  logo: number;
  use: StackItem['use'];
}) {
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center border-2 ${use === 'work' ? 'border-accent' : 'border-tee border-dashed'}`}
      style={{ width: frame, height: frame }}
    >
      {use === 'work' && (
        <span className="bg-accent border-ink absolute -top-1.5 -right-1.5 size-2.5 border" />
      )}
      <span className="grid place-items-center bg-white" style={{ width: box, height: box }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 1~4KB 정적 SVG. next/image 최적화가 필요 없다 */}
        <img src={`/icons/tech/${icon}`} alt="" width={logo} height={logo} decoding="async" />
      </span>
    </span>
  );
}

const SKILL_NAME = 'font-pixel-ko text-[13px] leading-snug font-bold text-white';
/** 범례 글자의 문맥을 만드는 값(갈래 컴포넌트마다 내려 주지 않으려고). Stack이 넣는다 */
const LegendContext = createContext<{ work: string; project: string } | null>(null);
/** 이름 뒤 숨은 글자: 테두리 모양을 못 보는 사용자에게 "실무에서 사용"을 글로 */
function UseNote({ use }: { use: StackItem['use'] }) {
  const legend = useContext(LegendContext);
  return legend ? <span className="sr-only"> ({legend[use]})</span> : null;
}
const descClass = (d: string) =>
  `text-[12px] leading-normal break-keep ${isTodo(d) ? 'text-metal' : 'text-metal-light'}`;
/** 갈래 상자: 점선 테두리 + 갈래 이름(h3) + 기술 목록 */
function SkillGroup({
  group,
  listClass,
  children,
}: {
  group: StackGroup;
  listClass: string;
  children: (it: StackItem) => ReactNode;
}) {
  return (
    <div className="border-stand-dark flex min-w-0 flex-col gap-2.5 self-stretch border-2 border-dashed p-3">
      <h3 className={SKILL_NAME}>{group.label}</h3>
      <ul className={listClass}>
        {group.items.map((it) => (
          <li key={it.name} className="min-w-0">
            {children(it)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 옆으로 놓인 칸(왼쪽·오른쪽·아래): 작은 아이콘 + 이름 한 줄, 그 아래 설명 */
function RowSkill({ it }: { it: StackItem }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Mark icon={it.icon} frame={36} box={24} logo={18} use={it.use} />
        <span className={SKILL_NAME}>
          {it.name}
          <UseNote use={it.use} />
        </span>
      </div>
      <p className={descClass(it.desc)}>{it.desc}</p>
    </div>
  );
}

/**
 * 기술 장비창(11-12 사용자 시안 SkillAtlas). 게임 장비 창처럼 네 갈래가 가운데 러너를 둘러싼다(11-12 2차: 화살표 뺌).
 * 설명은 항상 보인다(시안 제목 "설명 상시 노출": 마우스를 올려야 보이는 설명은 터치·키보드에서 못 본다).
 * 갈래마다 h3 + ul이라 스크린리더는 "언어 · 마크업, 목록 5개"처럼 읽는다. 러너·강화 효과는 장식(aria-hidden).
 * 좁은 화면: 갈래를 한 줄씩 쌓고, 가운데(러너)는 가운데 줄의 맨 앞으로 올려 "언어 · 마크업" 바로 아래에 온다.
 * 강화 연출(번쩍·불꽃·흔들림·점 깜빡임·스캔 막대)은 sprites.css .skill-*, reduced-motion이면 전부 멈춘다.
 * 맨 위 범례(11-17 사용자 시안): 실무에서 쓴 기술과 프로젝트에서 쓴 기술을 아이콘 테두리로 나눈다(Mark 주석).
 */
function Stack({ section }: { section: Extract<Section, { type: 'stack' }> }) {
  const { groups, name, spotlight, legend } = section;
  const row = (it: StackItem) => <RowSkill it={it} />;
  return (
    <LegendContext value={legend}>
      <div className="bg-ink flex flex-col gap-2.5 p-5 max-[699px]:p-3">
        {/* 범례: 아이콘 테두리와 같은 모양의 작은 칸 + 뜻. 그림은 장식, 글자가 뜻을 말한다 */}
        <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1.5">
          {(['work', 'project'] as const).map((use) => (
            <li
              key={use}
              className="font-pixel-ko flex items-center gap-2 text-[12px] leading-none text-white"
            >
              <span
                aria-hidden
                className={`relative size-4 border-2 ${use === 'work' ? 'border-accent' : 'border-tee border-dashed'}`}
              >
                {use === 'work' && (
                  <span className="bg-accent border-ink absolute -top-1 -right-1 size-2 border" />
                )}
              </span>
              {legend[use]}
            </li>
          ))}
        </ul>
        <SkillGroup
          group={groups.top}
          // 좁은 화면 2칸: 항목이 홀수면 마지막 하나가 왼쪽에 혼자 남는다 → 두 칸을 차지해 가운데로
          listClass="grid grid-cols-5 gap-2 max-[699px]:grid-cols-2 max-[699px]:gap-y-4 max-[699px]:[&>li:last-child:nth-child(odd)]:col-span-2"
        >
          {(it) => (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Mark icon={it.icon} frame={52} box={32} logo={24} use={it.use} />
              <span className={SKILL_NAME}>
                {it.name}
                <UseNote use={it.use} />
              </span>
              <p className={descClass(it.desc)}>{it.desc}</p>
            </div>
          )}
        </SkillGroup>

        <div className="grid grid-cols-[minmax(0,1fr)_184px_minmax(0,1fr)] items-center gap-x-4 max-[699px]:grid-cols-1 max-[699px]:gap-y-2.5">
          <SkillGroup group={groups.left} listClass="flex flex-col gap-2.5">
            {row}
          </SkillGroup>

          <div className="flex flex-col items-center gap-1.5 max-[699px]:order-first max-[699px]:py-2">
            <div aria-hidden className="relative flex h-[102px] w-24 items-end justify-center">
              <span className="bg-stand-dark absolute right-3 bottom-0 left-3 h-1" />
              <div
                className="pixelated relative mb-0.5"
                style={{
                  width: 64,
                  height: 96,
                  backgroundImage: 'url(/sprites/character/runner-sheet-128x240.png)',
                  backgroundSize: '256px 480px',
                  backgroundPosition: '0 0',
                }}
              />
            </div>
            <p className="font-pixel text-[9px] leading-snug text-white">{name}</p>
            <div className="mt-3.5 flex flex-col items-center gap-2">
              <h3 className={SKILL_NAME}>{spotlight.label}</h3>
              <div className="skill-hit border-accent relative flex h-16 min-w-16 flex-col px-2 items-center justify-center gap-1 border-2">
                <span className="grid size-7 place-items-center bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 정적 SVG */}
                  <img
                    src={`/icons/tech/${spotlight.item.icon}`}
                    alt=""
                    width={20}
                    height={20}
                    decoding="async"
                  />
                </span>
                <span className="font-pixel-ko text-[10px] leading-none whitespace-nowrap text-white">
                  {spotlight.item.name}
                </span>
                <span aria-hidden className="skill-flash absolute inset-0 bg-white" />
                {BURSTS.map((b, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className={`skill-burst absolute top-7 left-[calc(50%-2px)] size-1 ${b.white ? 'bg-white' : 'bg-accent'}`}
                    style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px` } as CSSProperties}
                  />
                ))}
              </div>
              <p className="font-pixel text-accent text-[7px]">
                {spotlight.status}
                <span aria-hidden className="skill-blink">
                  ...
                </span>
              </p>
              <div
                aria-hidden
                className="border-metal relative h-2.5 w-[120px] overflow-hidden border-2"
              >
                <span className="skill-scan bg-accent absolute top-0 bottom-0 left-0 w-4" />
              </div>
            </div>
          </div>
          <SkillGroup group={groups.right} listClass="flex flex-col gap-2.5">
            {row}
          </SkillGroup>
        </div>
        <SkillGroup
          group={groups.bottom}
          listClass="grid grid-cols-4 gap-3 max-[699px]:grid-cols-1"
        >
          {row}
        </SkillGroup>
      </div>
    </LegendContext>
  );
}

/** 강화 불꽃 4개가 튀는 방향(시안 값). 위 둘은 노랑, 아래 둘은 흰색 */
const BURSTS = [
  { dx: -40, dy: -30, white: false },
  { dx: 40, dy: -30, white: false },
  { dx: -42, dy: 18, white: true },
  { dx: 42, dy: 18, white: true },
] as const;

/**
 * 프로젝트 창 맨 위 소개 판(11-12 사용자 시안 "퀘스트 로그"). 게임 대화창처럼 남색 판 위에 이름표가 걸치고, 오른쪽 아래 ▼가 깜빡인다.
 * 이중 테두리(흰 2px + 바깥 남색 2px)는 border + outline: 요소를 하나 더 감싸지 않는다.
 * 남색 판 위 빈칸은 metal-light 그대로 둔다: 흰 바탕용 회색(metal-dark)은 여기서 대비가 2:1대라 읽히지 않는다(대괄호가 빈칸 표시).
 * 주소가 아직 없는 칸은 링크가 아니라 글자(가짜 링크 금지).
 */
function Quest({ section }: { section: Extract<Section, { type: 'quest' }> }) {
  return (
    <section className="bg-ink outline-ink relative mt-3.5 flex flex-col gap-3.5 border-2 border-white px-5 pt-[26px] pb-[18px] outline-2">
      <h3 className="bg-tee border-ink text-ink absolute -top-3.5 left-4 flex items-center gap-2 border-2 px-2 py-[5px]">
        {section.badge && (
          <span className="font-pixel text-[8px] leading-none">{section.badge}</span>
        )}
        <span className="font-pixel-ko text-[13px] leading-none font-bold">{section.title}</span>
      </h3>
      <p className="text-metal-light leading-[1.7] break-keep whitespace-pre-line">
        <TodoValue v={section.body} todoClass="" />
      </p>
      <dl className="border-stand-dark grid grid-cols-2 gap-x-5 gap-y-2.5 border-t-2 pt-3.5 max-[479px]:grid-cols-1">
        {section.facts.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="font-pixel-ko text-metal text-[12px]">{f.label}</dt>
            <dd className="text-[14px] [overflow-wrap:anywhere]">
              {f.href && !isTodo(f.href) ? (
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline decoration-2 underline-offset-[3px]"
                >
                  {todoText(f.value)}
                  <span aria-hidden> ↗</span>
                </a>
              ) : (
                <TodoValue v={f.value} className="text-metal-light" todoClass="" />
              )}
            </dd>
          </div>
        ))}
      </dl>
      <span
        aria-hidden
        className="quest-next font-pixel text-accent absolute right-3.5 bottom-2 text-[8px] leading-none"
      >
        ▼
      </span>
    </section>
  );
}

/** 주요 기능: 머리글 + 고르는 목록과 그림(상태가 있어 FeatureShowcase.tsx로 뺐다) */
function Features({ section }: { section: Extract<Section, { type: 'features' }> }) {
  return (
    <section>
      <Heading>{section.heading}</Heading>
      <FeatureShowcase section={section} />
    </section>
  );
}

/** 이름표 한 칸. 값이 TODO면 점선 테두리 빈칸(시안) */
function Tag({ v }: { v: string }) {
  return (
    <li
      className={`font-pixel-ko border-2 px-1.5 py-[3px] text-[12px] leading-normal ${isTodo(v) ? 'border-metal-dark text-metal-dark border-dashed' : 'border-ink'}`}
    >
      {todoText(v)}
    </li>
  );
}

/**
 * 사용 기술. 분류 이름이 있으면 "분류 | 이름표들" 표(이름-값 쌍이라 dl, 디자인 시스템 표와 같은 96px 이름 칸),
 * 없으면 이름표만 한 줄(아직 분류하지 않은 창). 좁은 화면은 분류 이름을 이름표 위로 올린다.
 */
function Tags({ section }: { section: Extract<Section, { type: 'tags' }> }) {
  const list = (items: readonly string[]) => (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((v, i) => (
        <Tag key={i} v={v} />
      ))}
    </ul>
  );
  const labeled = section.groups.some((g) => g.label);
  return (
    <section>
      <Heading>{section.heading}</Heading>
      {labeled ? (
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2.5 max-[699px]:grid-cols-1 max-[699px]:gap-y-1.5">
          {section.groups.map((g, i) => (
            <Fragment key={i}>
              <dt
                className={`font-pixel-ko text-stand-dark text-[12px] ${i > 0 ? 'max-[699px]:mt-2' : ''}`}
              >
                {g.label}
              </dt>
              <dd>{list(g.items)}</dd>
            </Fragment>
          ))}
        </dl>
      ) : (
        list(section.groups.flatMap((g) => g.items))
      )}
    </section>
  );
}

/**
 * 디자인 시스템 요약 표(시안): 왼쪽 이름(Color·Typography·Components) | 오른쪽 값. 이름-값 쌍이라 dl.
 * 색 견본은 칠한 칸 아래에 이름과 값을 글자로도 적는다(색만으로 전하지 않기). 값이 아직 없으면 점선 빈 칸.
 * 다크 값이 있으면 칸을 반씩 칠한다(왼쪽 라이트 · 오른쪽 다크): 견본 수를 두 배로 늘리지 않고 두 테마를 한 칸에서 비교한다.
 * 이름·값이 여러 줄이 되므로 표의 줄은 위쪽 정렬.
 * 좁은 화면은 이름을 값 위로 올린다(96px 이름 칸을 빼면 견본 5개가 한 줄에 안 들어간다).
 */
function DesignSystem({ section }: { section: Extract<Section, { type: 'designSystem' }> }) {
  const { link, colors, typography, components } = section;
  const dt = 'font-pixel-ko text-stand-dark text-[12px]';
  const small = 'text-muted text-[12px] leading-normal';
  const linkClass = 'font-pixel-ko text-[13px] font-bold';
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Heading flush>{section.heading}</Heading>
        {isTodo(link.href) ? (
          <TodoValue v={link.label} className={linkClass} />
        ) : (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} underline decoration-2 underline-offset-[3px]`}
          >
            {todoText(link.label)}
            <span aria-hidden> ↗</span>
          </a>
        )}
      </div>
      <dl className="border-metal-light grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-4 gap-y-4 border-2 p-3.5 max-[699px]:grid-cols-1 max-[699px]:gap-y-1.5">
        <dt className={dt}>{colors.label}</dt>
        <dd>
          <ul className="flex flex-wrap gap-x-2 gap-y-3">
            {colors.items.map((c, i) => (
              <li key={i} className="flex w-[74px] flex-col items-center gap-0.5 text-center">
                <span
                  aria-hidden
                  className={`mb-1 h-9 w-11 border-2 ${isTodo(c.hex) ? 'border-metal-dark border-dashed' : 'border-ink'}`}
                  style={
                    isTodo(c.hex)
                      ? undefined
                      : {
                          background: c.dark
                            ? `linear-gradient(90deg, ${c.hex} 50%, ${c.dark} 50%)`
                            : c.hex,
                        }
                  }
                />
                <TodoValue v={c.name} className="text-[12px] leading-tight font-bold break-keep" />
                <TodoValue v={c.hex} className="text-[11px] leading-normal" />
                {c.dark && (
                  <span className="text-muted text-[11px] leading-normal">
                    {colors.darkLabel} {c.dark}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {colors.note && <p className={`${small} mt-2.5`}>{colors.note}</p>}
        </dd>
        <dt className={`${dt} max-[699px]:mt-2`}>{typography.label}</dt>
        <dd className="text-[14px] break-keep">
          <TodoValue v={typography.value} />
          {typography.note && <p className={`${small} mt-1`}>{typography.note}</p>}
        </dd>
        <dt className={`${dt} max-[699px]:mt-2`}>{components.label}</dt>
        <dd>
          <ul className="flex flex-wrap gap-1.5">
            {components.items.map((v, i) => (
              <Tag key={i} v={v} />
            ))}
          </ul>
          {components.note && (
            <p className={`${small} mt-1.5 [overflow-wrap:anywhere]`}>{components.note}</p>
          )}
        </dd>
      </dl>
    </section>
  );
}

export function SectionView({ section }: { section: Section }) {
  switch (section.type) {
    case 'hero':
      return <Hero section={section} />;
    case 'starts':
      return <Starts section={section} />;
    case 'origin':
      return <Origin section={section} />;
    case 'callout':
      return <Callout section={section} />;
    case 'summary':
      return <Summary section={section} />;
    case 'cards':
      return <Cards section={section} />;
    case 'cases':
      return <Cases section={section} />;
    case 'traits':
      return <Traits section={section} />;
    case 'stack':
      return <Stack section={section} />;
    case 'resume':
      return <Resume doc={section.doc} />;
    case 'text':
      return (
        <section>
          {section.heading && <Heading>{section.heading}</Heading>}
          <p>{section.body}</p>
        </section>
      );
    case 'quest':
      return <Quest section={section} />;
    case 'features':
      return <Features section={section} />;
    case 'tags':
      return <Tags section={section} />;
    case 'designSystem':
      return <DesignSystem section={section} />;
    case 'laps':
      return <LapLog section={section} />;
  }
}

export function SectionList({ sections }: { sections: readonly Section[] }) {
  return (
    // whitespace-pre-line은 상속된다: 여기 한 번으로 content/의 모든 문구에서 줄바꿈 표시가 먹는다(섹션마다 걸면 빠뜨리기 쉽다)
    <div className="flex flex-col gap-7 whitespace-pre-line">
      {sections.map((s, i) => (
        <SectionView key={i} section={s} />
      ))}
    </div>
  );
}
