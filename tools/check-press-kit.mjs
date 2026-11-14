// MSG-6109 item 5 (#20, the press kit): (b) every file the press pages offer for download is clean, with no C2PA /
// Content Credentials, XMP or EXIF embedded; (c) the price line reads exactly as verified (App Store listing; 6098).
// A PNG may hold only image and colour chunks; text, EXIF and C2PA chunks (tEXt, zTXt, iTXt, eXIf, caBX) fail. An SVG
// may hold no <metadata>, no XMP packet and no C2PA. Usage: node tools/check-press-kit.mjs [root]
import { readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';

const PAGES = ['press/index.html', 'es/press/index.html'];
const PRICES = {
  'press/index.html': 'Free to start · Pro $4.99/month or $34.99/year · 7-day free trial',
  'es/press/index.html': 'Gratis para empezar · Pro US$4.99/mes o US$34.99/año · 7 días de prueba gratis',
};
const PNG_BAD = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'caBX']);
const SVG_BAD = [/<metadata[\s>]/i, /<x:xmpmeta/i, /<\?xpacket/i, /c2pa/i, /rdf:RDF/i];

/** The files a page offers with `download`, as repo paths. */
export function downloads(page, html) {
  return [...html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*\sdownload\b/g)].map((m) =>
    m[1].startsWith('/') ? m[1].slice(1) : normalize(join(dirname(page), m[1])),
  );
}

/** What metadata a file carries, as short words; empty when it's clean. */
export function metadataIn(name, bytes) {
  if (name.endsWith('.png')) {
    const out = [];
    for (let i = 8; i + 8 <= bytes.length; ) {
      const len = bytes.readUInt32BE(i);
      const type = bytes.toString('latin1', i + 4, i + 8);
      if (PNG_BAD.has(type)) out.push(type);
      i += 12 + len;
    }
    return out;
  }
  if (name.endsWith('.svg')) {
    const text = bytes.toString('utf8');
    return SVG_BAD.filter((re) => re.test(text)).map((re) => re.source);
  }
  return [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Planted cases: a PNG with a caBX chunk and an SVG with <metadata> fail; plain ones pass; an href without download
  // isn't a download.
  const chunk = (type, data = Buffer.alloc(0)) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return Buffer.concat([len, Buffer.from(type, 'latin1'), data, Buffer.alloc(4)]);
  };
  const png = (...types) => Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', Buffer.alloc(13)), ...types.map((t) => chunk(t)), chunk('IEND')]);
  const ok =
    metadataIn('a.png', png('IDAT')).length === 0 &&
    metadataIn('a.png', png('caBX', 'IDAT')).join() === 'caBX' &&
    metadataIn('a.svg', Buffer.from('<svg><path d="M0 0"/></svg>')).length === 0 &&
    metadataIn('a.svg', Buffer.from('<svg><metadata>c2pa</metadata></svg>')).length > 0 &&
    downloads('press/index.html', '<a href="../img/a.png" download>x</a><a href="../b/">y</a>').join() === 'img/a.png';
  if (!ok) {
    console.log("press kit fail: the check's own planted cases went wrong");
    process.exit(1);
  }
  const root = resolve(process.argv[2] ?? '.');
  const problems = [];
  for (const page of PAGES) {
    const html = readFileSync(resolve(root, page), 'utf8');
    if (!html.includes(PRICES[page])) problems.push(`${page} doesn't read exactly "${PRICES[page]}"`);
    for (const f of downloads(page, html)) {
      const found = metadataIn(f, readFileSync(resolve(root, f)));
      if (found.length) problems.push(`${f} carries metadata: ${[...new Set(found)].join(', ')}`);
    }
  }
  if (problems.length) {
    for (const p of [...new Set(problems)]) console.log(p);
    console.log('press kit fail: every download must be free of C2PA, XMP and EXIF, and the price line must read exactly as verified');
    process.exit(1);
  }
  console.log('press kit ok: every download is free of C2PA, XMP and EXIF, and the price line reads exactly as verified');
}
