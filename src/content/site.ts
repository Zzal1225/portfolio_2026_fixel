/**
 * 사이트 메타 문구(탭 제목·검색 설명·링크 미리보기). layout.tsx가 읽는다.
 *
 * SITE_URL이 필요한 이유: 링크 미리보기(og:image)는 절대 주소여야 카카오톡·슬랙이 그림을 받는다.
 * Next는 metadataBase가 없으면 Vercel 환경변수로 추측하지만, 미리보기 배포 주소가 섞일 수 있어 운영 주소를 못박는다.
 * 도메인을 바꾸면 여기만 고친다.
 */
export const SITE_URL = 'https://portfolio2026fixel.vercel.app';
export const SITE_TITLE = '박찬령 포트폴리오';
export const SITE_DESCRIPTION = '400m 트랙을 달리며 보는 프론트엔드 개발자 박찬령의 포트폴리오';
