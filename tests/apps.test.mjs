import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.svensson.design';
const apps=JSON.parse(fs.readFileSync(path.join(root,'data/apps.json'),'utf8'));
const routes=['/apps/','/guider/','/guider/koka-agg-olika-konsistens/','/guider/svenskt-ordspel-utan-reklam/',...apps.map(app=>`/apps/${app.slug}/`)];
const read=route=>fs.readFileSync(path.join(root,route,'index.html'),'utf8');

test('app routes have Swedish accessibility, metadata and truthful app schemas',()=>{
  for(const app of apps){const route=`/apps/${app.slug}/`,html=read(route);assert.match(html,/<html lang="sv">/);assert.match(html,/<a class="skip-link" href="#main">Hoppa till innehållet<\/a>/);assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`));assert.ok(html.includes(app.storeUrl));assert.ok(html.includes(app.guide));assert.ok(html.includes('data-consent-settings'));assert.doesNotMatch(html,/aggregateRating|ratingValue|reviewCount/);const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);const application=schema['@graph'].find(x=>x['@type']==='SoftwareApplication');assert.equal(application.name,app.name);assert.equal(application.downloadUrl,app.storeUrl);assert.equal(application.url,origin+route);}
});
test('app pages and guides are substantive, linked and locally resolvable',()=>{
  for(const route of routes){const html=read(route);assert.equal((html.match(/<h1\b/g)||[]).length,1,route);assert.ok(html.includes('href="/apps/"'));assert.ok(html.includes('href="/verktyg/"'));assert.ok(html.includes('href="/guides/"'));for(const ref of [...html.matchAll(/href="(\/[^"]+)"/g)].map(x=>x[1])){const pathname=ref.split('#')[0];if(pathname.endsWith('/'))assert.ok(fs.existsSync(path.join(root,pathname,'index.html')),`${route}: missing ${ref}`);}}
  for(const app of apps)assert.ok(fs.existsSync(path.join(root,'apps/assets',`${app.slug}-icon.jpg`)));
  for(const route of routes.filter(route=>route.startsWith('/guider/')&&route!=='/guider/')){const html=read(route),schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),article=schema['@graph'].find(x=>x['@type']==='Article');assert.ok(article.wordCount>350,route);assert.equal(article.datePublished,undefined);assert.equal(article.dateModified,undefined);}
});
