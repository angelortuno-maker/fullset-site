// S2-3 (MSG-6042): bigger phone shots at 375 px. A page whose hero shows three frames marks its `.shots` row
// `shots--big`, keeps all three (W1, MSG-5951: the Coach frame shows at every width), and each frame's `sizes` names the
// 42vw phone width. styles.css must, under 640 px, widen the frames to (100% + 128px) / 3 - 4px (capped at 200 px)
// with a 64 px overlap, so they stay inside the gutters: 150 px at 375 instead of 123.
// Usage: node tools/check-phone-shots.mjs [root]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/** A page's problems: a multi-frame `.shots` row without `shots--big`, fewer than three frames, or a `sizes` missing 42vw. */
export function pageProblems(html, name) {
  const row = html.match(/<div class="shots[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (!row) return [];
  const frames = row[1].match(/<img [^>]*class="shot[^"]*"[^>]*>/g) ?? [];
  if (frames.length < 2) return [];
  const problems = [];
  if (!/^<div class="shots shots--big">/.test(row[0])) problems.push(`${name}: ${frames.length} frames but no shots--big`);
  if (frames.length !== 3 || !/class="shot shot--third"/.test(frames[2])) problems.push(`${name}: the hero doesn't keep its three frames with the Coach frame third (W1)`);
  frames.forEach((img, i) => {
    if (!/sizes="[^"]*\(max-width: 639px\) 42vw/.test(img)) problems.push(`${name}: frame ${i + 1}'s sizes doesn't name 42vw under 640 px`);
  });
  return problems;
}

/** styles.css's problems: the under-640 px width and overlap for `shots--big`. */
export function cssProblems(css) {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = plain.match(/@media\s*\(max-width:\s*639px\)\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) return ['styles.css has no @media (max-width: 639px) block'];
  const problems = [];
  if (!/\.shots--big \.shot\s*\{\s*width:\s*min\(200px,\s*calc\(\(100% \+ 128px\) \/ 3 - 4px\)\);?\s*\}/.test(block)) problems.push('the shots--big frames are not min(200px, calc((100% + 128px) / 3 - 4px))');
  if (!/\.shots--big \.shot \+ \.shot\s*\{\s*margin-left:\s*-64px;?\s*\}/.test(block)) problems.push('the shots--big frames do not overlap by 64 px');
  if (/\.shots--big\s*\{[^}]*margin-inline/.test(block)) problems.push('the shots--big row reaches into the gutters (the turned third frame would scroll the page)');
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`S2-3 fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: three frames with no shots--big fail, a 33vw-only sizes fails, two frames (Coach dropped) fail, the
  // shipped markup passes, a single frame passes; CSS with no 639 px block fails, a bleed into the gutters fails, the
  // shipped CSS passes.
  const img = (sizes, third = false) => `<img class="shot${third ? ' shot--third' : ''}" src="a.png" sizes="${sizes}" width="390" height="844" alt="a">`;
  const good = '(min-width: 1024px) 210px, (max-width: 639px) 42vw, 33vw';
  const three = (s) => img(s) + img(s) + img(s, true);
  const goodCss = '@media (max-width: 639px) {\n  .shots--big .shot { width: min(200px, calc((100% + 128px) / 3 - 4px)); }\n  .shots--big .shot + .shot { margin-left: -64px; }\n}';
  const planted = [
    [pageProblems(`<div class="shots">${three(good)}</div>`, 'a').length > 0, 'three frames with no shots--big passed'],
    [pageProblems(`<div class="shots shots--big">${three('(min-width: 1024px) 210px, 33vw')}</div>`, 'a').length > 0, 'a 33vw-only sizes passed'],
    [pageProblems(`<div class="shots shots--big">${img(good)}${img(good)}</div>`, 'a').length > 0, 'two frames with the Coach frame dropped passed'],
    [pageProblems(`<div class="shots shots--big">${three(good)}</div>`, 'a').length === 0, 'the shipped markup failed'],
    [pageProblems(`<div class="shots">${img('64vw')}</div>`, 'a').length === 0, 'a single frame failed'],
    [cssProblems('.shots .shot { width: 123px; }').length > 0, 'CSS with no 639 px block passed'],
    [cssProblems(goodCss.replace('{\n', '{\n  .shots--big { margin-inline: -12px; }\n')).length > 0, 'a bleed into the gutters passed'],
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
  console.log('S2-3 ok: every three-frame hero keeps its fan with bigger frames under 640 px, inside the gutters');
}
