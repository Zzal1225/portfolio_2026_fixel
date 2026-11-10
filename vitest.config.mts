// 왜: 로직(trackPath·layout·store)은 DOM 없이 node 환경으로 빠르게 돌리고,
// 컴포넌트 테스트만 파일 상단 주석 `// @vitest-environment jsdom`으로 jsdom을 켠다.
// 전부 jsdom으로 돌리면 순수 함수 테스트까지 느려진다.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
