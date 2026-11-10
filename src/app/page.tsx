// 게임 모드 한 페이지(일반 모드 페이지 없음, 11-09 결정).
// 페이지 자체는 서버 컴포넌트로 두고, 상태가 필요한 Game만 클라이언트로 내린다.
// h1은 화면에 보이지 않지만 스크린리더·검색 엔진이 "무슨 페이지인지" 먼저 읽게 둔다.
import { SITE_TITLE } from '@/content/world';
import { Game } from '@/features/track/Game';

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">{SITE_TITLE}</h1>
      <Game />
    </main>
  );
}
