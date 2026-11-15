// WL16 (MSG-6106 item 2): store-links.js decides whether the store badges show, so a browser must never keep an old
// copy. Firebase Hosting applies matching `headers` rules in the order they're defined (later wins, as the site's own
// "immutable" rule after "**" already relies on). This check reads firebase.json and fails unless the last rule that
// matches /store-links.js sets Cache-Control to `no-cache` (revalidate on every load; an unchanged file is a 304).
// The HTML can stay cached an hour: every page already holds the badges, hidden until the script shows them.
// Usage: node tools/check-store-links-cache.mjs [root]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PATH = '/store-links.js';

/** Firebase's glob subset the site uses: `**` (any path), `*` (one segment), extglob `@(a|b)` and `+([0-9a-f])`. */
export function matches(source, path) {
  let re = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (source.startsWith('**', i)) { re += '.*'; i++; continue; }
    if (c === '*') { re += '[^/]*'; continue; }
    if ((c === '@' || c === '+') && source[i + 1] === '(') {
      const end = source.indexOf(')', i);
      const inner = source.slice(i + 2, end);
      re += c === '@' ? `(?:${inner})` : `(?:${inner})+`;
      i = end;
      continue;
    }
    re += /[.?^${}()|\\]/.test(c) ? `\\${c}` : c;
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  const s = source.startsWith('/') || source.startsWith('**') ? source : `/${source}`;
  return new RegExp(`^${s === source ? re : `/${re}`}$`).test(p) || new RegExp(`^${re}$`).test(p.slice(1));
}

/** The Cache-Control value the last matching rule gives `path`, or null. */
export function cacheControlFor(config, path) {
  let value = null;
  for (const rule of config?.hosting?.headers ?? []) {
    if (!matches(rule.source, path)) continue;
    for (const h of rule.headers ?? []) if (String(h.key).toLowerCase() === 'cache-control') value = h.value;
  }
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Planted cases: "**" alone gives an hour (fails); a later /store-links.js rule with no-cache passes; the same rule
  // placed before "**" loses (fails); the hashed-asset rule never matches store-links.js.
  const hour = { source: '**', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] };
  const fresh = { source: '/store-links.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] };
  const hashed = { source: '**/*.+([0-9a-f]).@(css|png|svg)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] };
  const planted = [
    [[hour, hashed], 'public, max-age=3600'],
    [[hour, hashed, fresh], 'no-cache'],
    [[fresh, hour, hashed], 'public, max-age=3600'],
  ];
  for (const [headers, want] of planted) {
    const got = cacheControlFor({ hosting: { headers } }, PATH);
    if (got !== want) {
      console.log(`WL16 fail: the check's own planted case went wrong (got ${got}, want ${want})`);
      process.exit(1);
    }
  }
  if (cacheControlFor({ hosting: { headers: [hashed] } }, PATH) !== null || !matches(hashed.source, '/img/a.1f2e.png')) {
    console.log('WL16 fail: the glob matcher is wrong on the hashed-asset rule');
    process.exit(1);
  }
  const root = resolve(process.argv[2] ?? '.');
  const got = cacheControlFor(JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8')), PATH);
  if (got !== 'no-cache') {
    console.log(`WL16 fail: ${PATH} is served with Cache-Control "${got}"; it must be "no-cache" (a later headers rule in firebase.json)`);
    process.exit(1);
  }
  console.log('WL16 ok: store-links.js is served with Cache-Control no-cache, so the badges follow its links at once');
}
