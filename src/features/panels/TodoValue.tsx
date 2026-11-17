/**
 * 아직 정하지 않은 값(content에서 "TODO"로 시작)을 "[나머지]" 빈칸으로 그린다(시안의 [YYYY.MM] 표기).
 * 이력서(Resume)와 프로젝트 창(Sections)이 같이 쓴다. 따로 파일인 이유: Sections가 Resume을 불러오므로
 * 어느 한쪽에 두면 서로를 불러오는 고리가 생긴다.
 *
 * todoClass: 빈칸 글자색. 기본은 흰 바탕용 회색(metal-dark, 대비 6.6:1).
 * 남색 판 위에서는 그 회색이 대비 2:1대로 떨어지므로 부르는 쪽이 밝은 색을 넘긴다(대괄호가 빈칸임을 알린다, 색만으로 전하지 않음).
 */
import { isTodo } from '@/content/panels';

export function todoText(v: string): string {
  return isTodo(v) ? `[${v.replace(/^TODO:?\s*/, '')}]` : v;
}

export function TodoValue({
  v,
  className = '',
  todoClass = 'text-metal-dark',
}: {
  v: string;
  className?: string;
  todoClass?: string;
}) {
  if (!isTodo(v)) return <span className={className}>{v}</span>;
  return <span className={`${todoClass} ${className}`}>{todoText(v)}</span>;
}
