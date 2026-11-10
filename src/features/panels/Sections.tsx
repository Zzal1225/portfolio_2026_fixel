/**
 * 창 본문 섹션 렌더러. content/panels.ts의 섹션 타입(text·stats·list·timeline·links·portrait·photo)만 보고 그린다.
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

function Portrait() {
  // 러너 시트(128×240)의 정면 첫 칸(32×48)을 4배로. 장식이므로 aria-hidden
  return (
    <div
      aria-hidden
      className="pixelated mx-auto"
      style={{
        width: 128,
        height: 192,
        backgroundImage: 'url(/sprites/character/runner-sheet-128x240.png)',
        backgroundSize: '512px 960px',
        backgroundPosition: '0 0',
      }}
    />
  );
}

/**
 * 사진: 1배·2배 WebP 두 장을 srcset으로(브라우저가 화면 밀도에 맞는 것만 받는다).
 * width·height(320×426, 3:4)를 적어 두는 이유: 사진이 늦게 와도 자리가 먼저 잡혀 창 내용이 밀리지 않는다(CLS 0).
 * 창은 열 때 지연 로딩되므로 loading="lazy"는 필요 없다(열면 바로 보이는 맨 위 그림).
 */
function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 미리 구운 정적 파일. next/image 런타임 최적화가 필요 없다(scripts/build-photos.mjs)
    <img
      src={`/img/${src}-320.webp`}
      srcSet={`/img/${src}-320.webp 1x, /img/${src}-640.webp 2x`}
      alt={alt}
      width={320}
      height={426}
      decoding="async"
      className="border-ink mx-auto block h-auto w-full max-w-[280px] border-2"
    />
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
    case 'portrait':
      return <Portrait />;
    case 'photo':
      return <Photo src={section.src} alt={section.alt} />;
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
