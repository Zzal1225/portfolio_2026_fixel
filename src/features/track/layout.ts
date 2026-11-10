/**
 * 월드 배치 데이터(640×360 월드 픽셀, 배율 적용 전).
 *
 * 이 파일은 "데이터만" 둔다. 좌표 변환(t → x,y)·방향 계산은 trackPath.ts(사용자 작성) 한 곳에서 한다.
 * 반응 구역 판정·소품 거리 검사 같은 규칙은 이 데이터만 보고 하므로, 구조물을 옮길 때는 여기 숫자만 바꾸면 된다.
 *
 * 값의 출처: design/design_handoff_track_portfolio/README.md 표 + scripts/extract-design-layout.mjs 출력.
 * 시안 코드를 옮긴 것이 아니라 결과 숫자만 적었다(CLAUDE.md 2장).
 *
 * 왜 구조물 위치를 t가 아니라 s(트랙 거리 px)로 적나:
 *   s는 "출발선에서 몇 픽셀"이라 그림과 대조하기 쉽다(위 직선 x=416 ↔ s=498).
 *   t는 상태·계산용이라 아래에서 한 번만 나눠 둔다.
 */

// ---------------------------------------------------------------------------
// 트랙: 스타디움형(직선 2 + 반원 2). 타원이 아니므로 점 근사 없이 구간별 식으로 정확히 풀린다.
// ---------------------------------------------------------------------------

const STRAIGHT = 280; // 반원 중심 사이 거리 (460 − 180)
const LANE_RADIUS = 100; // 러너가 달리는 선(레인 84~116의 가운데쯤)

export const TRACK = {
  /** 왼쪽·오른쪽 반원 중심 */
  centerLeft: { x: 180, y: 180 },
  centerRight: { x: 460, y: 180 },
  /** 레인 안쪽·바깥 경계. 소품이 트랙 위에 놓였는지 검사할 때 쓴다 */
  innerRadius: 84,
  outerRadius: 116,
  laneRadius: LANE_RADIUS,
  straight: STRAIGHT,
  /** s = 0 인 x (아래 직선의 분필 출발선). s 증가 = 화면상 반시계 */
  startX: 320,
  /** 발 위치 = 달리는 선 + 12. 스프라이트 32×48은 (x − 16, footY − 48)에 그린다 */
  footOffsetY: 12,
  /** 둘레(px). 2·280 + 2π·100 ≈ 1188.32 */
  length: 2 * STRAIGHT + 2 * Math.PI * LANE_RADIUS,
} as const;

/** 트랙 거리(px) → t. layout 값을 적을 때만 쓰는 작은 도우미(trackPath와 중복이 아니라 데이터 정규화) */
const sToT = (s: number): number => s / TRACK.length;

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export type LandmarkId = 'about' | 'career' | 'project1' | 'project2' | 'education' | 'resume';

/** public/sprites/structures/{sprite}.png 파일 이름과 같다 */
export type LandmarkSprite =
  | 'arch-96x64'
  | 'scoreboard-96x32'
  | 'water-a-64x32'
  | 'water-b-64x32'
  | 'tent-64x64'
  | 'reception-table-64x32';

export type PropKind =
  'bench' | 'cone' | 'bottle' | 'bag' | 'grassA' | 'grassB' | 'towel' | 'cooler';

export interface Point {
  x: number;
  y: number;
}
export interface Size {
  w: number;
  h: number;
}
/** 양 끝 포함 사각형(x1·y1도 그 픽셀에 속함) */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Landmark {
  id: LandmarkId;
  sprite: LandmarkSprite;
  /** 트랙 거리(px). 러너가 이 구조물 앞에 서는 지점 */
  s: number;
  /** 0 이상 1 미만. s / 둘레 */
  t: number;
  /** 반응 구역: |트랙 거리 차| ≤ 이 값(px)이면 `!`를 띄운다. 트랙 위 이동이라 2D 사각형이 필요 없다 */
  zoneHalfLength: number;
  /** 스프라이트 가운데 x, 바닥 y. 좌상단 = (x − w/2, y − h) */
  anchor: Point;
  size: Size;
  /** 구조물 안 HTML 이름: 글자 중심(스프라이트 좌상단 기준)과 월드 px 글자 크기 */
  label: { dx: number; dy: number; fontSize: number };
}

export interface Actor {
  id: 'signal' | 'referee';
  anchor: Point;
  size: Size;
}

export interface Prop {
  kind: PropKind;
  /** 32×32 칸 좌상단 */
  x: number;
  y: number;
}

/** 창이 없는 장식. 판 위 글자는 content/intro.ts의 signLines */
export interface Decor {
  id: 'signpost';
  topLeft: Point;
  size: Size;
  /** 글자 줄마다 중심(좌상단 기준) */
  lines: readonly Point[];
}

// ---------------------------------------------------------------------------
// 값
// ---------------------------------------------------------------------------

export const WORLD = { w: 640, h: 360, tile: 32 } as const;
export const PROP_SIZE = 32;

/** 반응 구역 반 길이(px). 러너 폭 32의 3/4 — 구조물 사이 최소 간격 96px보다 충분히 작다(11-09 D4) */
const ZONE = 24;

/**
 * 구조물 6개, s 오름차순(= 반시계로 도는 순서 = 창 이전·다음 순서).
 *
 * PROJECT 1·2(11-09 D1): 반시계로 돌 때 1 → 2 순서가 되도록 오른쪽 급수대(x 416)를 project1로 했다.
 * 그 자리 그림이 노란 지붕(water-b)이라 project1의 sprite가 water-b다. 이름이 엇갈려 보이는 건 의도.
 */
export const LANDMARKS: readonly Landmark[] = [
  {
    id: 'about',
    sprite: 'arch-96x64',
    s: 0,
    t: sToT(0),
    zoneHalfLength: ZONE,
    anchor: { x: 320, y: 299 },
    size: { w: 96, h: 64 },
    label: { dx: 48, dy: 15, fontSize: 8 },
  },
  {
    id: 'project1',
    sprite: 'water-b-64x32',
    s: 498,
    t: sToT(498),
    zoneHalfLength: ZONE,
    anchor: { x: 416, y: 64 },
    size: { w: 64, h: 32 },
    label: { dx: 32, dy: 22, fontSize: 5 },
  },
  {
    id: 'career',
    sprite: 'scoreboard-96x32',
    s: 594,
    t: sToT(594),
    zoneHalfLength: ZONE,
    anchor: { x: 320, y: 140 },
    size: { w: 96, h: 32 },
    label: { dx: 48, dy: 11, fontSize: 8 },
  },
  {
    id: 'project2',
    sprite: 'water-a-64x32',
    s: 690,
    t: sToT(690),
    zoneHalfLength: ZONE,
    anchor: { x: 224, y: 64 },
    size: { w: 64, h: 32 },
    label: { dx: 32, dy: 22, fontSize: 5 },
  },
  {
    id: 'education',
    sprite: 'tent-64x64',
    s: 823,
    t: sToT(823),
    zoneHalfLength: ZONE,
    anchor: { x: 40, y: 98 },
    size: { w: 64, h: 64 },
    label: { dx: 32, dy: 54, fontSize: 7 },
  },
  {
    id: 'resume',
    sprite: 'reception-table-64x32',
    s: 1085,
    t: sToT(1085),
    zoneHalfLength: ZONE,
    anchor: { x: 216, y: 340 },
    size: { w: 64, h: 32 },
    label: { dx: 32, dy: 21, fontSize: 6 },
  },
];

/** 인트로에만 보이는 신호등·심판. 반응 구역 없음 */
export const ACTORS: readonly Actor[] = [
  { id: 'signal', anchor: { x: 392, y: 360 }, size: { w: 32, h: 64 } },
  { id: 'referee', anchor: { x: 428, y: 356 }, size: { w: 32, h: 48 } },
];

/** 인필드 왼쪽 아래 이정표(11-10 시안 채택). 트랙 밖이라 이동과 무관 */
export const SIGNPOST: Decor = {
  id: 'signpost',
  topLeft: { x: 200, y: 186 },
  size: { w: 48, h: 50 },
  lines: [
    { x: 21.5, y: 10.5 },
    { x: 26.5, y: 23.5 },
    { x: 21.5, y: 36.5 },
  ],
};

/**
 * 트랙 고리 그림(곡선 레인 띠만 담은 투명 PNG, scripts/build-track-ring.mjs가 굽는다).
 * 곡선은 타일 반복으로 안 나와서 이것만 한 장 그림이다(11-10 결정, design-vs-plan #15).
 */
export const TRACK_RING = { topLeft: { x: 64, y: 64 }, size: { w: 512, h: 232 } } as const;

/** 전광판 그림 안의 검은 화면 영역(월드 px). 평소 "CAREER"·인트로 문구를 이 안에 얹는다 */
export const SCOREBOARD_SCREEN: Rect = { x0: 277, y0: 111, x1: 362, y1: 126 };

/**
 * 관중석(타일 반복 범위). 시안 규칙 "y<32 전체 / x≥592 / x≥512 & y<64 / x<48 & y≥128"을 사각형 4개로.
 * 세 번째 칸은 시안에서 "트랙에서 8px 이상"이라는 조건이 붙지만, 이 사각형 안 모든 점이 이미 그 조건을 만족해 단순 사각형이 된다.
 */
export const STANDS: readonly Rect[] = [
  { x0: 0, y0: 0, x1: 639, y1: 31 },
  { x0: 592, y0: 32, x1: 639, y1: 359 },
  { x0: 512, y0: 32, x1: 591, y1: 63 },
  { x0: 0, y0: 128, x1: 47, y1: 359 },
];

/** 소품 11개(scripts/extract-design-layout.mjs 출력). 상태 없음, aria-hidden */
export const PROPS: readonly Prop[] = [
  { kind: 'bench', x: 560, y: 81 },
  { kind: 'grassA', x: 144, y: 129 },
  { kind: 'cone', x: 432, y: 145 },
  { kind: 'bag', x: 480, y: 145 },
  { kind: 'bottle', x: 144, y: 177 },
  { kind: 'grassB', x: 432, y: 193 },
  { kind: 'towel', x: 480, y: 209 },
  { kind: 'cooler', x: 560, y: 241 },
  { kind: 'bench', x: 48, y: 257 },
  { kind: 'grassA', x: 48, y: 305 },
  { kind: 'cone', x: 528, y: 305 },
];

// ---------------------------------------------------------------------------
// 사각형 도우미(배치 검사·클릭 판정에서 같이 쓴다)
// ---------------------------------------------------------------------------

/** anchor(가운데 x, 바닥 y) + 크기 → 사각형. 시안과 같이 왼쪽은 floor(w/2) */
export function rectFromAnchor(anchor: Point, size: Size): Rect {
  const x0 = anchor.x - Math.floor(size.w / 2);
  const y0 = anchor.y - size.h;
  return { x0, y0, x1: x0 + size.w - 1, y1: anchor.y - 1 };
}

export function rectFromTopLeft(p: Point, size: Size): Rect {
  return { x0: p.x, y0: p.y, x1: p.x + size.w - 1, y1: p.y + size.h - 1 };
}

/**
 * 두 사각형 사이 빈 픽셀 수(체비쇼프 방식: 가로·세로 중 큰 쪽).
 * 0이면 맞닿음, 음수면 겹침. "반경 2칸 밖" = gap ≥ 64.
 */
export function rectGap(a: Rect, b: Rect): number {
  return Math.max(b.x0 - a.x1 - 1, a.x0 - b.x1 - 1, b.y0 - a.y1 - 1, a.y0 - b.y1 - 1);
}
