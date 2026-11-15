// W6 item 4 (site-es-copy.md, the Architect, Oct 15): the pages never name a store button that doesn't exist. Since W3 the
// buttons are Apple's badge ("Download on the App Store" / "Descárgalo en el App Store") and "Join the Android test" /
// "Únete a la prueba de Android", so the old names ("Download for iPhone/Android", "Descargar para iPhone/Android",
// "Get the Android build", "Download the APK") fail anywhere in a page's text.
// Usage: node tools/check-button-words.mjs [root]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const OLD = [/Download for (iPhone|Android)/i, /Descargar para (iPhone|Android)/i, /Get the Android build/i, /download the APK/i];

/** A page's problems: any old button name in its text. */
export function pageProblems(html, name) {
  const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  return OLD.filter((re) => re.test(text)).map((re) => `${name}: names an old store button (${re.source})`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`W6 fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: the old EN and ES FAQ lines fail, the current one passes, an old name inside a comment passes.
  const planted = [
    [pageProblems('<p>tap Download for iPhone or Download for Android.</p>', 'a').length > 0, 'the old EN line passed'],
    [pageProblems('<p>toca Descargar para iPhone o Descargar para Android.</p>', 'a').length > 0, 'the old ES line passed'],
    [pageProblems('<p>tap Download on the App Store (iPhone) or Join the Android test.</p>', 'a').length === 0, 'the current line failed'],
    [pageProblems('<!-- was: Download for Android --><p>ok</p>', 'a').length === 0, 'a comment failed'],
  ];
  for (const [ok, why] of planted) if (!ok) fail(`the check's own planted case went wrong: ${why}`);

  const root = resolve(process.argv[2] ?? '.');
  const problems = [];
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
  console.log('W6 ok: no page names a store button that no longer exists');
}
