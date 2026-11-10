// 왜: Next 기본(core-web-vitals + typescript) 위에 any 금지와 Prettier 충돌 해제만 얹는다.
// 규칙을 많이 늘리면 lint가 "스타일 논쟁"이 되므로, CLAUDE.md 4장에 적힌 것만 강제한다.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'design/**', 'private/**']),
]);
