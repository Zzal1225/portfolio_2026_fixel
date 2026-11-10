// Lighthouse CI 결과(.lighthouseci/reports/*.json) 요약: 점수·핵심 지표·LCP 요소·JS 전송량.
// docs/performance.md에 옮겨 적을 숫자를 뽑는 용도. 실행: node scripts/lh-summary.mjs
import fs from 'node:fs';
import path from 'node:path';

const dir = '.lighthouseci/reports';
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('manifest'))
  .map((f) => path.join(dir, f));

for (const f of files) {
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const a = r.audits;
  const cats = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, v.score]));
  console.log('\n#', path.basename(f), r.configSettings.formFactor, cats);
  for (const k of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
  ]) {
    console.log('  ', k.padEnd(26), a[k]?.displayValue, a[k]?.score);
  }
  const items = a['network-requests']?.details?.items ?? [];
  const js = items.filter((i) => i.resourceType === 'Script');
  const kb = (n) => (n / 1024).toFixed(1);
  console.log('   JS 전송량(KB, 압축)', kb(js.reduce((s, i) => s + (i.transferSize ?? 0), 0)), '/', js.length, '개');
  console.log('   전체 전송량(KB)', kb(items.reduce((s, i) => s + (i.transferSize ?? 0), 0)));
  const lcpEl = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node;
  if (lcpEl) console.log('   LCP 요소', lcpEl.snippet?.slice(0, 160));
  const failed = Object.values(a)
    .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'metricSavings')
    .map((x) => `${x.id}(${x.displayValue ?? ''})`);
  console.log('   개선 후보', failed.join(', '));
}
