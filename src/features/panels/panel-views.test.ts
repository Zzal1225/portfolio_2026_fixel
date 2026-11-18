import { describe, expect, it, vi } from 'vitest';
import { PANEL_PATH, createPanelViewTracker } from './panel-views';

describe('창별 조회 집계', () => {
  it('창이 처음 열리면 그 창의 경로를 보낸다', () => {
    const send = vi.fn((path: string) => path.length > 0);
    const track = createPanelViewTracker(send);
    track('career');
    expect(send).toHaveBeenCalledWith('/career');
  });

  it('같은 창을 다시 열어도 한 번만 보낸다(방문당 창마다 한 번)', () => {
    const send = vi.fn((path: string) => path.length > 0);
    const track = createPanelViewTracker(send);
    track('career');
    track('resume');
    track('career');
    expect(send.mock.calls.map((c) => c[0])).toEqual(['/career', '/resume']);
  });

  it('보내지 못했으면(집계 스크립트 없음) 기억하지 않아 다음에 다시 시도한다', () => {
    let ready = false;
    const send = vi.fn((path: string) => ready && path.length > 0);
    const track = createPanelViewTracker(send);
    track('about');
    ready = true;
    track('about');
    track('about');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('경로는 창 6개가 서로 다르고 첫 화면(/)과 겹치지 않는다', () => {
    const paths = Object.values(PANEL_PATH);
    expect(new Set(paths).size).toBe(6);
    for (const p of paths) expect(p).toMatch(/^\/[a-z-]+$/);
  });
});
