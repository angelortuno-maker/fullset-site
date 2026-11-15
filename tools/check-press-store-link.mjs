// MSG-6116 item 1 (the press kit's follow-up): /press and /es/press carry the App Store link themselves, not only a
// pointer to the home page. Each press page's "Get the app" card holds the official badge as a store button
// (`a[data-store="apple"]`, hidden until store-links.js gives it the listing's link, as on every other page), in its
// language's artwork (ES: Apple's es-MX badge, WL13), and the page loads store-links.js. The link itself lives only in
// store-links.js.
// Usage: node tools/check-press-store-link.mjs [root]
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PAGES = [
  { file: 'press/index.html', badge: /app-store-badge\.svg/ },
  { file: 'es/press/index.html', badge: /app-store-badge-es\.svg/ },
];

/** A press page's problems: the store button, its artwork, and the script. */
export function pageProblems(html, { file, badge }) {
  const problems = [];
  const button = html.match(/<a\b[^>]*data-store="apple"[^>]*>[\s\S]*?<\/a>/)?.[0];
  if (!button) problems.push(`${file}: no App Store button (a[data-store="apple"])`);
  else {
    if (!/\bdata-hide-empty\b/.test(button) || !/\bhidden\b/.test(button)) problems.push(`${file}: the App Store button isn't hidden until it has a link (data-hide-empty hidden)`);
    if (!badge.test(button)) problems.push(`${file}: the App Store button doesn't use its language's badge`);
    if (/apps\.apple\.com/.test(button)) problems.push(`${file}: the listing's link is typed in the page; it lives in store-links.js`);
  }
  // W10: the script loads in <head>, not deferred (tools/check-store-links-head.mjs checks the placement on every page).
  if (!/<script src="\/?(\.\.\/)?store-links\.js"><\/script>/.test(html)) problems.push(`${file}: doesn't load store-links.js`);
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`press store link fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: no button, a button shown with no link, the EN badge on the ES page, a typed link and no script
  // fail; the shipped shape passes.
  const en = PAGES[0];
  const es = PAGES[1];
  const btn = (img, extra = 'data-hide-empty hidden') => `<a class="badge" data-store="apple" ${extra} href="#get"><img src="${img}"></a>`;
  const script = '<script src="../store-links.js"></script>';
  const planted = [
    [pageProblems(script, en).length > 0, 'a page with no button passed'],
    [pageProblems(btn('../img/app-store-badge.svg', '') + script, en).length > 0, 'a button shown with no link passed'],
    [pageProblems(btn('/img/app-store-badge.svg') + script, es).length > 0, 'the EN badge on the ES page passed'],
    [pageProblems(`<a class="badge" data-store="apple" data-hide-empty hidden href="https://apps.apple.com/app/x"><img src="../img/app-store-badge.svg"></a>${script}`, en).length > 0, 'a typed link passed'],
    [pageProblems(btn('../img/app-store-badge.svg'), en).length > 0, 'a page with no script passed'],
    [pageProblems(btn('../img/app-store-badge.svg') + script, en).length === 0, 'the shipped EN shape failed'],
    [pageProblems(btn('/img/app-store-badge-es.svg') + '<script src="/store-links.js"></script>', es).length === 0, 'the shipped ES shape failed'],
  ];
  for (const [ok, why] of planted) if (!ok) fail(`the check's own planted case went wrong: ${why}`);
  const root = resolve(process.argv[2] ?? '.');
  const problems = PAGES.flatMap((p) => pageProblems(readFileSync(join(root, p.file), 'utf8'), p));
  if (problems.length) fail(problems.join('; '));
  console.log('press store link ok: /press and /es/press carry the App Store badge, linked from store-links.js');
}
