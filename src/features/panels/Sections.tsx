/**
 * 창 본문 섹션 렌더러. content/panels.ts의 섹션 타입(text·stats·list·timeline·links·hero·starts·callout·traits)만 보고 그린다.
 *
 * 왜 섹션 타입 방식인가: 창 6개가 "수치 → 문제 → 고민 → 품질 → 회고" 같은 비슷한 뼈대를 공유한다.
 * 창마다 JSX를 따로 짜면 문구 수정이 컴포넌트 수정이 되고, 문구가 content/ 밖으로 샌다.
 * 버린 대안: MDX — 글은 편하지만 빌드 설정이 늘고, 섹션 모양(수치 카드 등)을 강제하기 어렵다.
 *
 * TODO로 시작하는 값은 회색(metal-dark)으로 그려 빈칸이 눈에 띄게 한다(시안 규칙).
 */
import type { ReactNode } from 'react';
import { isTodo, type Section } from '@/content/panels';

const todoClass = (s: string) => (isTodo(s) ? 'text-metal-dark' : '');

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-pixel-ko mb-3 flex items-center gap-2 text-[15px] font-bold">
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
        <h3 className="font-pixel-ko mt-3 text-2xl leading-snug font-bold whitespace-pre-line">
          {section.title}
        </h3>
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
      <ol className="relative grid grid-cols-3 gap-x-1 max-[699px]:grid-cols-1 max-[699px]:gap-y-4">
        <span aria-hidden className="starts-line absolute" />
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
            <span className={`text-metal-dark block text-[14px] ${todoClass(it.desc)}`}>
              {it.desc}
            </span>
          </li>
        ))}
      </ol>
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

function Links({ items }: { items: Extract<Section, { type: 'links' }>['items'] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((l) => {
        const cls = `${l.primary ? 'nine-tee text-ink' : 'nine-white text-ink'} inline-flex min-h-11 items-center px-2 text-[15px] font-bold`;
        if (isTodo(l.href)) {
          // 주소가 아직 없으면 누를 수 없는 표시만(가짜 링크 금지)
          return (
            <span key={l.label} aria-disabled="true" className={`${cls} opacity-50`}>
              {l.label}
            </span>
          );
        }
        const external = l.href.startsWith('http');
        return (
          <a
            key={l.label}
            href={l.href}
            className={cls}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            {...(l.download ? { download: '' } : {})}
          >
            {l.label}
          </a>
        );
      })}
    </div>
  );
}

export function SectionView({ section }: { section: Section }) {
  switch (section.type) {
    case 'hero':
      return <Hero section={section} />;
    case 'starts':
      return <Starts section={section} />;
    case 'callout':
      return (
        <p
          className={`border-ink border-2 bg-[var(--color-menu-selected)] px-5 py-4 text-[15px] break-keep ${todoClass(section.body)}`}
        >
          {section.body}
        </p>
      );
    case 'traits':
      return <Traits section={section} />;
    case 'text':
      return (
        <section>
          {section.heading && <Heading>{section.heading}</Heading>}
          <p className={todoClass(section.body)}>{section.body}</p>
        </section>
      );
    case 'stats':
      return (
        <section>
          {section.heading && <Heading>{section.heading}</Heading>}
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {section.items.map((s, i) => (
              <div key={i} className="border-ink border-2 px-3 py-2">
                <dt className={`text-metal-dark text-[13px] ${todoClass(s.label)}`}>{s.label}</dt>
                <dd className={`font-pixel-ko text-[22px] font-bold ${todoClass(s.value)}`}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case 'list': {
      const Tag = section.numbered ? 'ol' : 'ul';
      return (
        <section>
          <Heading>{section.heading}</Heading>
          <Tag className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-6 gap-y-3">
            {section.items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="font-pixel text-tee shrink-0 pt-1 text-[10px]">
                  {section.numbered ? String(i + 1).padStart(2, '0') : '·'}
                </span>
                <span>
                  <strong className={todoClass(it.tag)}>{it.tag}</strong>
                  <span className={`block text-[15px] ${todoClass(it.desc)}`}>{it.desc}</span>
                </span>
              </li>
            ))}
          </Tag>
        </section>
      );
    }
    case 'timeline':
      return (
        <section>
          <Heading>{section.heading}</Heading>
          <ol>
            {section.items.map((it, i) => (
              <li
                key={i}
                className="border-metal-light grid grid-cols-[120px_1fr] gap-3 border-b-2 py-2"
              >
                <span
                  className={`font-pixel-ko text-stand-dark text-[14px] font-bold ${todoClass(it.period)}`}
                >
                  {it.period}
                </span>
                <span>
                  <strong>{it.title}</strong>
                  <span className={`block text-[15px] ${todoClass(it.desc)}`}>{it.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      );
    case 'links':
      return (
        <section>
          {section.heading && <Heading>{section.heading}</Heading>}
          <Links items={section.items} />
        </section>
      );
  }
}

export function SectionList({ sections }: { sections: readonly Section[] }) {
  return (
    <div className="flex flex-col gap-7">
      {sections.map((s, i) => (
        <SectionView key={i} section={s} />
      ))}
    </div>
  );
}
