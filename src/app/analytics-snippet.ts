/**
 * 방문 집계 스크립트(/_vercel/insights/script.js)보다 먼저 도는 짧은 머리말을 만든다(app/layout.tsx가 인라인 <script>로 넣는다).
 *
 * 하는 일
 *  1) va 대기열: 집계 스크립트가 오기 전에 생긴 호출을 쌓아 두는 Vercel의 정해진 머리말.
 *  2) 본인 제외(11-18 사용자 요청: 내가 들어가 본 것은 집계에서 빼고 싶다):
 *     - `?owner=on`으로 한 번 들어오면 이 브라우저에 표시(localStorage `va-owner`)를 남기고, `?owner=off`면 지운다.
 *     - 표시가 있으면 집계 스크립트의 beforeSend에 "보내지 않음(null)"을 걸어 방문·창 조회를 전부 버린다.
 *
 * 왜 이 방식인가: Vercel 대시보드에는 내 접속을 빼는 기능이 없다. IP로 거르는 것은 집·이동통신 IP가 수시로 바뀌어 믿을 수 없다.
 *   브라우저에 표시를 남기는 방식은 브라우저마다 한 번씩 해야 하고 시크릿 창·기록 삭제에는 풀리지만, 평소 쓰는 기기에서는 확실하다.
 * 왜 인라인 스크립트인가: 첫 방문 조회는 집계 스크립트가 실행되자마자 나간다. React가 뜬 뒤(하이드레이션)에 걸면 이미 늦다.
 *   대기열에 beforeSend를 먼저 넣어 두면 집계 스크립트가 첫 조회를 보내기 전에 그것부터 처리한다(스크립트 코드에서 순서 확인).
 * 왜 alert인가: 이 주소는 주인만 쓰고, 휴대폰에는 콘솔이 없다. 됐는지 알려 줄 가장 작은 방법이다. 평소 방문자는 볼 일이 없다.
 * try/catch: 저장소가 막힌 브라우저(일부 시크릿 모드)에서도 사이트는 그대로 떠야 한다. 그 경우 제외만 되지 않는다.
 * localStorage 규칙(CLAUDE.md "방문 기록은 저장하지 않는다")의 예외: 방문자의 기록이 아니라 주인이 스스로 켜는 표시 하나다.
 *
 * 문자열로 만드는 이유: 서버 컴포넌트에서 인라인 스크립트로 넣어야 해서. 함수로 두어 단위 테스트가 그대로 실행해 본다.
 */
export const OWNER_FLAG = 'va-owner';

export function analyticsSnippet(notice: { on: string; off: string }): string {
  return `(function(){
window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
try{
var m=/[?&]owner=(on|off)(?:&|$)/.exec(location.search);
if(m){
if(m[1]==='on')localStorage.setItem('${OWNER_FLAG}','1');else localStorage.removeItem('${OWNER_FLAG}');
alert(m[1]==='on'?${JSON.stringify(notice.on)}:${JSON.stringify(notice.off)});
}
if(localStorage.getItem('${OWNER_FLAG}'))window.va('beforeSend',function(){return null});
}catch(e){}
})();`;
}
