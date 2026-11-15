// WL7 (S2, MSG-6042): "Coach login" is reachable on phones. Under 1024 px styles.css hides the header's link row
// (.nav__links), so every page whose header carries the coach web link must also carry it in the phone row
// (.nav__sub) right after </header>, with the same words. styles.css must show that row under 1024 px and hide it at
// 1024 and up, where the header row has the link. store-links.js fills both links' href and unhides them.
// Usage: node tools/check-coach-login.mjs [root]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/** A page's problems: the header's coach link words, and whether the phone row repeats them right after </header>. */
export function pageProblems(html, name) {
  const header = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  const words = header.match(/<a data-coach-web hidden href="#">([^<]+)<\/a>/)?.[1];
  if (!words) return [];
  const after = html.slice(html.indexOf('</header>') + '</header>'.length).trimStart();
  const row = after.match(/^<div class="wrap nav__sub"><a data-coach-web hidden href="#">([^<]+)<\/a><\/div>/);
  if (!row) return [`${name}: no phone row for "${words}" right after </header>`];
  return row[1] === words ? [] : [`${name}: the phone row says "${row[1]}", the header "${words}"`];
}

/** styles.css's problems: the phone row must show under 1024 px and hide at 1024 and up. */
export function cssProblems(css) {
  const problems = [];
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (!/(^|\n)\s*\.nav__sub\s*\{[^}]*display:\s*flex/.test(plain)) problems.push('.nav__sub has no display: flex rule for phones');
  if (!/@media\s*\(min-width:\s*1024px\)\s*\{\s*\.nav__sub\s*\{\s*display:\s*none;?\s*\}\s*\}/.test(plain)) problems.push('.nav__sub is not hidden at 1024 px and up');
  if (/@media\s*\(max-width:[^)]*\)\s*\{[^{}]*\.nav__sub\s*\{[^}]*display:\s*none/.test(plain)) problems.push('.nav__sub is hidden at some phone width');
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`WL7 fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: a header link with no phone row fails, a row with other words fails, a matching row passes, a page
  // with no coach link passes; CSS with no 1024 rule fails, the shipped rules pass.
  const head = '<header class="wrap nav"><nav class="nav__links"><a data-coach-web hidden href="#">Coach login</a></nav></header>\n';
  const row = (w) => `  <div class="wrap nav__sub"><a data-coach-web hidden href="#">${w}</a></div>\n<main>`;
  const goodCss = '.nav__sub { display: flex; }\n@media (min-width: 1024px) { .nav__sub { display: none; } }';
  const planted = [
    [pageProblems(`${head}<main>`, 'a').length > 0, 'a header link with no phone row passed'],
    [pageProblems(head + row('Acceso coaches'), 'a').length > 0, 'a phone row with other words passed'],
    [pageProblems(head + row('Coach login'), 'a').length === 0, 'a matching phone row failed'],
    [pageProblems('<header class="wrap nav"></header><main>', 'a').length === 0, 'a page with no coach link failed'],
    [cssProblems('.nav__sub { display: flex; }').length > 0, 'CSS with no 1024 px rule passed'],
    [cssProblems(goodCss).length === 0, 'the shipped CSS failed'],
  ];
  for (const [ok, why] of planted) if (!ok) fail(`the check's own planted case went wrong: ${why}`);

  const root = resolve(process.argv[2] ?? '.');
  const problems = cssProblems(readFileSync(join(root, 'styles.css'), 'utf8'));
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
  console.log('WL7 ok: every page with a header Coach login also has it in the phone row, shown under 1024 px');
}
