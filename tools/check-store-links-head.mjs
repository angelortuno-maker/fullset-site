// W10 (Lighthouse mobile >= 95): no layout shift from the store buttons. A page with a store button, a coach-web link
// or the "Get the app" fallback loads store-links.js once, in <head>, without defer or async, so the buttons are filled
// as the parser adds them, before the first paint. A deferred run unhid them after the page had painted (CLS 0.18 on
// /, 0.26 on /coaches, Nov 15). store-links.js must fill elements as they're added (a MutationObserver) and keep a
// last full pass at DOMContentLoaded.
// Usage: node tools/check-store-links-head.mjs [root]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/** A page's problems: store-links.js missing from <head>, deferred or async, or loaded more than once. */
export function pageProblems(html, name) {
  if (!/data-store=|data-coach-web|data-store-fallback/.test(html)) return [];
  const tags = html.match(/<script[^>]*src="[^"]*store-links\.js"[^>]*><\/script>/g) ?? [];
  const head = html.match(/<head[\s\S]*?<\/head>/)?.[0] ?? '';
  const problems = [];
  if (tags.length !== 1) problems.push(`${name}: store-links.js is loaded ${tags.length} times, not once`);
  const inHead = tags.filter((t) => head.includes(t));
  if (inHead.length !== 1) problems.push(`${name}: store-links.js isn't loaded in <head>`);
  if (tags.some((t) => /\s(defer|async)\b/.test(t))) problems.push(`${name}: store-links.js is deferred or async, so the buttons appear after the first paint`);
  return problems;
}

/** store-links.js's problems: it must fill elements as the parser adds them, then do a full pass when parsing ends. */
export function scriptProblems(js) {
  const problems = [];
  if (!/new MutationObserver\(/.test(js) || !/\.observe\(document\.documentElement,\s*\{\s*childList:\s*true,\s*subtree:\s*true\s*\}\)/.test(js)) problems.push('store-links.js does not fill elements as they are added (no MutationObserver on the document)');
  if (!/DOMContentLoaded/.test(js) || !/\.disconnect\(\)/.test(js)) problems.push('store-links.js has no last pass at DOMContentLoaded that stops the observer');
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`W10 fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: a deferred tag in the body fails, a head tag with defer fails, two tags fail, one plain head tag
  // passes, a page with no store elements passes; a script with no observer fails, the shipped shape passes.
  const btn = '<a class="badge" data-store="apple" data-hide-empty hidden href="#get">x</a>';
  const page = (head, body) => `<html><head>${head}</head><body>${btn}${body}</body></html>`;
  const tag = (extra = '') => `<script src="store-links.js"${extra}></script>`;
  const goodJs = "var o = new MutationObserver(f); o.observe(document.documentElement, { childList: true, subtree: true }); document.addEventListener('DOMContentLoaded', function () { o.disconnect(); });";
  const planted = [
    [pageProblems(page('', tag(' defer')), 'a').length > 0, 'a deferred tag in the body passed'],
    [pageProblems(page(tag(' defer'), ''), 'a').length > 0, 'a head tag with defer passed'],
    [pageProblems(page(tag(), tag()), 'a').length > 0, 'two tags passed'],
    [pageProblems(page(tag(), ''), 'a').length === 0, 'one plain head tag failed'],
    [pageProblems('<html><head></head><body>no buttons</body></html>', 'a').length === 0, 'a page with no store elements failed'],
    [scriptProblems("document.querySelectorAll('a[data-store]')").length > 0, 'a script with no observer passed'],
    [scriptProblems(goodJs).length === 0, 'the shipped shape failed'],
  ];
  for (const [ok, why] of planted) if (!ok) fail(`the check's own planted case went wrong: ${why}`);

  const root = resolve(process.argv[2] ?? '.');
  const problems = scriptProblems(readFileSync(join(root, 'store-links.js'), 'utf8'));
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (name.startsWith('.') || ['node_modules', 'docs', 'tools'].includes(name)) continue;
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.html')) problems.push(...pageProblems(readFileSync(path, 'utf8'), relative(root, path)));
    }
  };
  walk(root);
  if (problems.length) fail(problems.join('; '));
  console.log('W10 ok: every page with store buttons loads store-links.js once in <head>, filling them before the first paint');
}
