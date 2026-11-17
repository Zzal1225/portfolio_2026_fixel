/**
 * 이력서 PDF용 인쇄 페이지(11-12). scripts/build-resume-pdf.mjs가 이 주소를 열어 A4 PDF(public/resume.pdf)로 굽는다.
 *
 * 왜 따로 페이지를 두나: RESUME 창은 게임 위 Radix Dialog 안이라 그대로 인쇄하면 월드·딤·창 테두리가 같이 찍힌다.
 * 같은 content(PANELS.resume)와 같은 컴포넌트(Resume)를 쓰므로, 창 내용을 고치면 스크립트만 다시 돌리면 PDF도 같아진다.
 * 버린 대안: PDF 라이브러리(react-pdf 등)로 따로 그리기 — 레이아웃을 두 번 짜야 하고 웹과 모양이 어긋난다.
 *
 * 검색에 걸리지 않게 noindex. 사람이 들어와도 이력서 한 장이 보일 뿐이라 막지는 않는다.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PANELS } from '@/content/panels';
import { Resume } from '@/features/panels/Resume';

export const metadata: Metadata = {
  title: 'Resume',
  robots: { index: false, follow: false },
};

export default function ResumePrintPage() {
  const section = PANELS.resume.sections.find((s) => s.type === 'resume');
  if (section?.type !== 'resume') notFound();
  return (
    // 사이트 body는 잔디색 바탕이라 이 페이지만 흰 종이로(인쇄 여백까지 흰색)
    <main className="resume-print font-body text-ink mx-auto max-w-[794px] bg-white">
      <Resume doc={section.doc} />
    </main>
  );
}
