// WL9 (S2, MSG-6042; marketing support, file 6094 item 3): robots.txt lets crawlers in and names the sitemap, and
// sitemap.xml lists every public page of thefullsetapp.com, EN and ES, each with its own canonical URL and its
// language twin. A public page is an index.html the site serves (firebase.json's `ignore` aside) with a canonical on
// thefullsetapp.com and no robots noindex; the legacy privacy.html and support.html redirect, so they're not pages.
// A new page with no sitemap entry fails, and so does an entry with no page, or one that disagrees with the page.
// Usage: node tools/check-seo.mjs [root]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const HOST = 'https://thefullsetapp.com';
const SITEMAP = `${HOST}/sitemap.xml`;

/** robots.txt's problems: it must name the sitemap and must not shut the whole site. */
export function robotsProblems(text) {
  if (text === null) return ['robots.txt is missing'];
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim());
  const problems = [];
  if (!lines.some((l) => /^sitemap:\s*/i.test(l) && l.replace(/^sitemap:\s*/i, '') === SITEMAP)) problems.push(`robots.txt doesn't name ${SITEMAP}`);
  if (lines.some((l) => /^disallow:\s*\/\s*$/i.test(l))) problems.push('robots.txt disallows the whole site');
  return problems;
}

/** The sitemap's entries: each <url>'s <loc> and its hreflang alternates. */
export function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: body.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1] ?? null,
    alternates: Object.fromEntries([...body.matchAll(/<xhtml:link\s+rel="alternate"\s+hreflang="([a-z-]+)"\s+href="([^"]+)"\s*\/>/g)].map(([, l, h]) => [l, h])),
  }));
}

/** A page's canonical, its hreflang alternates and whether it says noindex. */
export function pageFacts(html) {
  return {
    canonical: html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] ?? null,
    alternates: Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/g)].map(([, l, h]) => [l, h])),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
  };
}

/** The sitemap's problems against the pages (`pages`: canonical URL → facts, for every public page). */
export function sitemapProblems(entries, pages) {
  const problems = [];
  const locs = new Set();
  for (const { loc, alternates } of entries) {
    if (!loc) { problems.push('a <url> with no <loc>'); continue; }
    if (locs.has(loc)) problems.push(`${loc} is listed twice`);
    locs.add(loc);
    const page = pages.get(loc);
    if (!page) { problems.push(`${loc} isn't a public page's canonical URL`); continue; }
    for (const lang of ['en', 'es']) {
      if (alternates[lang] !== page.alternates[lang]) problems.push(`${loc}: its ${lang} alternate is ${alternates[lang] ?? 'missing'}, the page says ${page.alternates[lang] ?? 'nothing'}`);
    }
  }
  for (const url of pages.keys()) if (!locs.has(url)) problems.push(`${url} is a public page missing from the sitemap`);
  return problems;
}

/** Every public page under `root`: canonical URL → facts. */
export function publicPages(root) {
  const config = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
  const ignored = (config.hosting?.ignore ?? []).map((g) => g.replace(/\/\*\*$/, '/')).filter((g) => /^[a-z]/.test(g) && g.endsWith('/'));
  const pages = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative(root, path);
      if (name.startsWith('.') || name === 'node_modules' || ignored.some((g) => `${rel}/`.startsWith(g))) continue;
      if (statSync(path).isDirectory()) walk(path);
      else if (name === 'index.html') {
        const facts = pageFacts(readFileSync(path, 'utf8'));
        if (!facts.noindex && facts.canonical?.startsWith(HOST)) pages.set(facts.canonical, facts);
      }
    }
  };
  walk(root);
  return pages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fail = (why) => {
    console.log(`WL9 fail: ${why}`);
    process.exit(1);
  };
  // Planted cases: a missing robots.txt, one that shuts the site, and one with no sitemap line fail; a page left out of
  // the sitemap, an entry with no page, and an alternate that disagrees with the page fail; the matching pair passes.
  const good = 'User-agent: *\nAllow: /\nSitemap: https://thefullsetapp.com/sitemap.xml\n';
  const planted = [
    [robotsProblems(null).length > 0, 'a missing robots.txt passed'],
    [robotsProblems('User-agent: *\nDisallow: /\nSitemap: https://thefullsetapp.com/sitemap.xml').length > 0, 'a robots.txt shutting the site passed'],
    [robotsProblems('User-agent: *\nAllow: /\n').length > 0, 'a robots.txt with no sitemap passed'],
    [robotsProblems(good).length === 0, 'a good robots.txt failed'],
  ];
  const facts = (path, en, es) => ({ canonical: `${HOST}${path}`, alternates: { en: `${HOST}${en}`, es: `${HOST}${es}` }, noindex: false });
  const pair = new Map([[`${HOST}/press`, facts('/press', '/press', '/es/press')], [`${HOST}/es/press`, facts('/es/press', '/press', '/es/press')]]);
  const url = (path, en, es) => `<url><loc>${HOST}${path}</loc><xhtml:link rel="alternate" hreflang="en" href="${HOST}${en}"/><xhtml:link rel="alternate" hreflang="es" href="${HOST}${es}"/></url>`;
  const both = url('/press', '/press', '/es/press') + url('/es/press', '/press', '/es/press');
  planted.push(
    [sitemapProblems(sitemapEntries(both), pair).length === 0, 'a matching sitemap failed'],
    [sitemapProblems(sitemapEntries(url('/press', '/press', '/es/press')), pair).length > 0, 'a page left out of the sitemap passed'],
    [sitemapProblems(sitemapEntries(both + url('/blog', '/blog', '/es/blog')), pair).length > 0, 'an entry with no page passed'],
    [sitemapProblems(sitemapEntries(url('/press', '/press', '/es/prensa') + url('/es/press', '/press', '/es/press')), pair).length > 0, 'a wrong alternate passed'],
  );
  for (const [ok, why] of planted) if (!ok) fail(`the check's own planted case went wrong: ${why}`);

  const root = resolve(process.argv[2] ?? '.');
  const read = (name) => (existsSync(join(root, name)) ? readFileSync(join(root, name), 'utf8') : null);
  const problems = robotsProblems(read('robots.txt'));
  const xml = read('sitemap.xml');
  const pages = publicPages(root);
  if (xml === null) problems.push('sitemap.xml is missing');
  else problems.push(...sitemapProblems(sitemapEntries(xml), pages));
  if (problems.length) fail(problems.join('; '));
  console.log(`WL9 ok: robots.txt names the sitemap, and sitemap.xml lists every public page, EN and ES, each with its twin`);
}
