/**
 * RESUME 창 본문: 이력서 한 장(11-12 사용자 시안). content/panels.ts의 ResumeDoc만 보고 그린다.
 *
 * 왜 섹션 여러 개가 아니라 한 덩어리인가: 시안이 "종이 한 장"(굵은 테두리 + 위 남색 띠) 안에 모든 블록을 담는다.
 * 다른 창의 섹션 타입(text·timeline 등)으로 나누면 이 테두리 하나를 표현할 수 없고, 띠 머리글 모양도 이력서 전용이다.
 *
 * 빈칸: 값이 TODO로 시작하면 "[나머지]" 회색으로(시안의 [YYYY.MM] 표기). 링크 주소가 TODO면 링크 대신 글자만(가짜 링크 금지).
 * 제목 단계: 창 제목 h2 → 띠 머리글 h3 → 항목 제목은 굵은 글자(목록 안이라 제목으로 만들지 않는다).
 */
import type { ReactNode } from 'react';
import { isTodo, type ResumeDoc } from '@/content/panels';
import { TodoValue as Val } from './TodoValue';

/** 남색 띠 머리글. eyebrow는 장식에 가까운 영어 라벨이라 h3 안에서 제목 앞에 둔다(스크린리더: "PROFILE 자기소개") */
function Bar({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <h3 className="bg-ink flex items-center gap-3 px-3 py-2">
      <span className="font-pixel text-accent text-[9px] leading-none">{eyebrow}</span>
      <span className="font-pixel-ko text-[15px] leading-none font-bold text-white">{title}</span>
    </h3>
  );
}

/** 기간 | 내용 한 줄. 아래 회색 선으로 줄을 나눈다. 좁은 화면은 기간을 위로 */
function Row({
  period,
  sub,
  children,
}: {
  /** 여러 줄이면 줄마다 { text, badge? }(경력: 재입사로 기간이 둘) */
  period: string | readonly { text: string; badge?: string }[];
  /** 기간 아래 작은 글자(경력의 총 경력, 기타 경력의 근무 기간) */
  sub?: string;
  children: ReactNode;
}) {
  const lines = typeof period === 'string' ? [{ text: period }] : period;
  return (
    <li className="border-metal-light grid grid-cols-[150px_minmax(0,1fr)] gap-x-6 border-b-2 py-3 max-[699px]:grid-cols-1 max-[699px]:gap-y-1">
      <div>
        {lines.map((l) => (
          <span
            key={l.text}
            className="text-stand-dark block text-[14px] leading-normal whitespace-nowrap"
          >
            <Val v={l.text} />
            {l.badge && (
              <span className="bg-accent text-ink font-pixel-ko ml-1.5 px-1 align-middle text-[11px] leading-normal">
                {l.badge}
              </span>
            )}
          </span>
        ))}
        {sub && <span className="text-metal-dark mt-0.5 block text-[13px]">{sub}</span>}
      </div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

/** 링크 칸. 주소가 TODO면 글자만 */
function InfoValue({ value, href, kind }: ResumeDoc['info'][number]) {
  const icon = kind === 'mail' ? ' ✉' : kind === 'external' ? ' ↗' : '';
  if (!href || isTodo(href)) return <Val v={value} />;
  const external = kind === 'external';
  return (
    <a
      href={href}
      className="decoration-ink underline decoration-2 underline-offset-4"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {value}
      <span aria-hidden>{icon}</span>
    </a>
  );
}

export function Resume({ doc }: { doc: ResumeDoc }) {
  const { profile, career, skills, education, license, other } = doc;
  const pdfReady = !isTodo(doc.pdf.href);
  return (
    <article className="border-ink border-2 bg-white">
      {/* 위 띠: 문서 이름 · 최종 수정 · PDF */}
      <div className="bg-ink flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
        <p className="flex items-center gap-3 text-[13px] text-white">
          <span className="font-pixel text-accent text-[9px] leading-none">{doc.badge}</span>
          <span>
            {doc.updated.label} <Val v={doc.updated.value} className="text-metal-light" />
          </span>
        </p>
        {/* PDF 안에서는 자기 자신을 받는 버튼이 필요 없어 인쇄 때 숨긴다 */}
        {pdfReady ? (
          <a
            href={doc.pdf.href}
            download={doc.pdf.fileName}
            className="font-pixel-ko print:hidden text-accent text-[15px] font-bold underline decoration-2 underline-offset-4"
          >
            {doc.pdf.label} <span aria-hidden>↓</span>
          </a>
        ) : (
          // 파일이 아직 없으면 누를 수 없는 표시만
          <span
            aria-disabled="true"
            className="font-pixel-ko text-metal print:hidden text-[15px] font-bold"
          >
            {doc.pdf.label} <span aria-hidden>↓</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 px-8 pt-7 pb-8 max-[699px]:px-4">
        {/* 머리: 사진 + 이름 + 연락처 */}
        {/*
          증명사진(11-12 사용자 요청): 테두리 없이 220px로 크게. 파일은 480w·750w(원본 폭) 두 장을 품질 90으로 굽고,
          w 서술자 + sizes로 브라우저가 고른다(1배 화면 480, 2배 화면 750). 1x/2x 서술자 대신 w를 쓴 이유:
          원본이 750px뿐이라 정확한 2배(440→880)가 없어, 화면 밀도에 맞는 가장 가까운 파일을 브라우저가 고르게 둔다.
        */}
        <header className="grid grid-cols-[220px_minmax(0,1fr)] gap-x-7 max-[699px]:grid-cols-1 max-[699px]:gap-y-5">
          <div className="bg-metal-light aspect-[3/4] w-[220px] max-[699px]:mx-auto max-[699px]:w-48">
            {doc.photo && (
              // eslint-disable-next-line @next/next/no-img-element -- 미리 구운 정적 WebP(scripts/build-photos.mjs)
              <img
                src={`/img/${doc.photo.src}-480.webp`}
                srcSet={`/img/${doc.photo.src}-480.webp 480w, /img/${doc.photo.src}-750.webp 750w`}
                sizes="(max-width: 699px) 192px, 220px"
                alt={doc.photo.alt}
                width={220}
                height={293}
                decoding="async"
                className="block size-full object-cover"
              />
            )}
          </div>
          {/*
            글 영역의 위아래를 사진의 위아래에 맞춘다(11-12 사용자 요청): 이름은 위, 연락처는 아래 끝(mt-auto).
            연락처는 "라벨 | 값" 한 줄씩. 두 칸 배치에서는 긴 주소(GitHub·포트폴리오)만 한 줄을 따로 차지해 어색했다.
            모든 항목이 같은 줄 모양이라 사진 높이(293px) 안에 6줄이 고르게 들어간다.
            폭 480px 미만(휴대폰)은 값 칸이 200px도 안 돼 긴 주소가 꺾이므로 라벨을 값 위로 올린다.
          */}
          <div className="flex min-w-0 flex-col">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-pixel-ko text-[32px] leading-tight font-bold">{doc.name}</span>
              <span className="text-metal-dark text-[16px]">{doc.nameEn}</span>
            </p>
            <p className="font-pixel-ko text-stand-dark mt-1 text-[16px] font-bold">{doc.role}</p>
            <dl className="border-metal-light mt-auto flex flex-col gap-2 border-t-2 pt-4 max-[699px]:mt-4">
              {doc.info.map((it) => (
                <div
                  key={it.label}
                  className="grid min-w-0 grid-cols-[80px_minmax(0,1fr)] items-baseline gap-x-3 max-[699px]:grid-cols-[64px_minmax(0,1fr)] max-[699px]:gap-x-2 max-[479px]:grid-cols-1"
                >
                  <dt className="text-stand-dark text-[14px]">{it.label}</dt>
                  <dd className="text-[15px] [overflow-wrap:anywhere]">
                    <InfoValue {...it} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section>
          <Bar {...profile} />
          <p className={`mt-3 text-[15px] leading-relaxed break-keep`}>
            <Val v={profile.body} />
          </p>
        </section>

        <section>
          <Bar {...career} />
          <ul>
            {career.items.map((c) => (
              <Row key={c.title + (c.periods[0]?.text ?? '')} period={c.periods} sub={c.duration}>
                <p className="text-[15px]">
                  <strong>
                    <Val v={c.title} />
                  </strong>
                  <span className="text-metal-dark">
                    {' · '}
                    <Val v={c.org} />
                  </span>
                </p>
                <ul className="mt-1.5 flex list-disc flex-col gap-0.5 pl-5 text-[14px]">
                  {c.bullets.map((b) => (
                    <li key={b}>
                      <Val v={b} />
                    </li>
                  ))}
                </ul>
              </Row>
            ))}
          </ul>
        </section>

        <section>
          <Bar {...skills} />
          <dl className="mt-3 flex flex-col gap-2.5">
            {skills.rows.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-x-3 max-[699px]:grid-cols-1 max-[699px]:gap-y-1.5"
              >
                <dt className="text-stand-dark text-[15px]">{r.label}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {r.items.map((s) => (
                    <span key={s} className="border-ink border-2 px-1.5 text-[14px] leading-7">
                      {s}
                    </span>
                  ))}
                  {r.learning && (
                    <span className="border-metal-dark text-metal-dark border-2 border-dashed px-1.5 text-[15px] leading-7">
                      {r.learning}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 학력·교육은 한 섹션(11-12): 경력과 같은 "기간 | 이름 + 기관" 줄 */}
        <section>
          <Bar {...education} />
          <ul>
            {education.items.map((t) => (
              <Row key={t.title + t.period} period={t.period}>
                <p className="text-[15px] font-bold">
                  <Val v={t.title} />
                </p>
                <p className="text-[13px]">
                  <Val v={t.desc} />
                </p>
              </Row>
            ))}
          </ul>
        </section>

        {/* 자격증도 같은 줄 모양(11-12): 한 줄을 다 쓰는 섹션이 되면서 이름만 있는 목록은 허전해 보였다 */}
        <section>
          <Bar {...license} />
          <ul>
            {license.items.map((it) => (
              <Row key={it.title + it.period} period={it.period}>
                <p className="text-[15px] font-bold">
                  <Val v={it.title} />
                </p>
                <p className="text-[13px]">
                  <Val v={it.desc} />
                </p>
              </Row>
            ))}
          </ul>
        </section>

        <section>
          <Bar {...other} />
          <ul>
            {/* 회사명(굵게) 옆에 직책(작게, 회색), 설명은 있는 줄만(11-12 사용자 시안) */}
            {other.items.map((o) => (
              <Row key={o.org + o.period} period={o.period} sub={o.duration}>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <strong className="text-[16px]">{o.org}</strong>
                  <span className="text-metal-dark text-[13px]">{o.role}</span>
                </p>
                {o.desc && <p className="mt-1.5 text-[14px]">{o.desc}</p>}
              </Row>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
