import { describe, expect, it, vi } from 'vitest';
import { OWNER_FLAG, analyticsSnippet } from './analytics-snippet';

const NOTICE = { on: 'ON', off: 'OFF' };

/** 머리말을 가짜 브라우저에서 실행한다. 저장소는 호출 사이에 이어 쓸 수 있게 밖에서 받는다 */
function run(search: string, store: Map<string, string>, storageBroken = false) {
  const alert = vi.fn();
  const win: { va?: (...a: unknown[]) => void; vaq?: ArrayLike<unknown>[] } = {};
  const localStorage = {
    getItem: (k: string) => {
      if (storageBroken) throw new Error('blocked');
      return store.get(k) ?? null;
    },
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  new Function('window', 'location', 'localStorage', 'alert', analyticsSnippet(NOTICE))(
    win,
    { search },
    localStorage,
    alert,
  );
  // 대기열에 쌓인 호출: [이름, 값]
  const queued = (win.vaq ?? []).map((a) => Array.from(a) as [string, unknown]);
  return { alert, queued, win };
}

const blocks = (queued: [string, unknown][]) => {
  const hook = queued.find(([name]) => name === 'beforeSend')?.[1];
  return typeof hook === 'function' && hook({ type: 'pageview', url: '/' }) === null;
};

describe('방문 집계 머리말', () => {
  it('평소 방문자: 대기열만 만들고 아무것도 막지 않는다', () => {
    const { alert, queued, win } = run('', new Map());
    expect(typeof win.va).toBe('function');
    expect(queued).toEqual([]);
    expect(alert).not.toHaveBeenCalled();
  });

  it('?owner=on: 표시를 남기고 알리고, 이번 방문부터 보내지 않는다', () => {
    const store = new Map<string, string>();
    const { alert, queued } = run('?owner=on', store);
    expect(store.get(OWNER_FLAG)).toBe('1');
    expect(alert).toHaveBeenCalledWith('ON');
    expect(blocks(queued)).toBe(true);
  });

  it('표시가 남은 브라우저는 평소 주소로 와도 보내지 않는다(알림은 없다)', () => {
    const store = new Map([[OWNER_FLAG, '1']]);
    const { alert, queued } = run('?ref=company', store);
    expect(blocks(queued)).toBe(true);
    expect(alert).not.toHaveBeenCalled();
  });

  it('?owner=off: 표시를 지우고 다시 집계된다', () => {
    const store = new Map([[OWNER_FLAG, '1']]);
    const { alert, queued } = run('?ref=x&owner=off', store);
    expect(store.has(OWNER_FLAG)).toBe(false);
    expect(alert).toHaveBeenCalledWith('OFF');
    expect(blocks(queued)).toBe(false);
  });

  it('비슷한 주소(owner=online 등)는 무시한다', () => {
    const store = new Map<string, string>();
    const { alert } = run('?owner=online', store);
    expect(store.size).toBe(0);
    expect(alert).not.toHaveBeenCalled();
  });

  it('저장소가 막혀 있어도 오류 없이 대기열은 만들어진다', () => {
    const { win, queued } = run('', new Map(), true);
    expect(typeof win.va).toBe('function');
    expect(queued).toEqual([]);
  });
});
