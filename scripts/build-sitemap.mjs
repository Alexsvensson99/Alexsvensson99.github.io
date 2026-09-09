import {loadGuides} from './guide-data.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.svensson.design';
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/tools.json'), 'utf8'));
const guides = loadGuides(root);
const external = JSON.parse(fs.readFileSync(path.join(root, 'data/external-pages.json'), 'utf8'));
const local = ['/', '/apps/', '/apps/perfeggtion/', '/apps/bokstavsbrus/', '/guider/', '/guider/koka-agg-olika-konsistens/', '/guider/svenskt-ordspel-utan-reklam/', ...['tools','verktyg'].flatMap(prefix => [`/${prefix}/`, ...products.map(p=>`/${prefix}/${p.slug}/`)]), '/guides/', ...guides.map(g=>`/guides/${g.slug}/`)];
for (const url of local) {
  const html = fs.readFileSync(path.join(root, url, 'index.html'), 'utf8');
  if (!html.includes(`rel="canonical" href="${origin}${url}"`) || /<meta[^>]+(?:name="robots"[^>]+content="[^"]*noindex|content="[^"]*noindex[^>]+name="robots")/i.test(html)) throw new Error(`Page is not self-canonical and indexable: ${url}`);
}
for (const url of external) if (!/^\/PkgLift\/(?:[a-z0-9-]+\/)?$/.test(url)) throw new Error(`Unexpected external project route: ${url}`);
const urls = [...local, ...external];
if (urls.length !== new Set(urls).size) throw new Error('Duplicate sitemap URL');
// lastmod is optional. Omit it rather than reporting rebuild dates as content changes.
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url=>`  <url><loc>${origin}${url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated sitemap with ${local.length} local pages and ${external.length} project pages.`);
