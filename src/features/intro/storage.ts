/**
 * 첫 방문 기억(localStorage.introSeen). 읽기·쓰기 모두 try/catch.
 *
 * 실패하면 "본 것"으로 취급한다(CLAUDE.md 2장): 사생활 보호 모드·저장소 차단에서 매번 7초 인트로를
 * 강제하는 것보다, 한 번 못 보는 쪽이 채용 담당자에게 덜 불편하다.
 * 저장소를 인자로 받는 이유: 테스트에서 가짜 저장소(실패하는 것 포함)를 넣기 위해.
 */
export const INTRO_SEEN_KEY = 'introSeen';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'> | null;

export function browserStorage(): StorageLike {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readSeen(storage: StorageLike): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function writeSeen(storage: StorageLike): void {
  try {
    storage?.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // 저장 실패는 무시: 다음 방문에 인트로를 한 번 더 볼 뿐
  }
}
