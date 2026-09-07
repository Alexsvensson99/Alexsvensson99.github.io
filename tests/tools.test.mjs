import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.svensson.design';
const expected={shotlattice:29,tendercairn:19,brieflattice:29,relayfolio:19,overlayhearth:12,captionweave:15};
const routes=['/verktyg/','/tools/',...Object.keys(expected).flatMap(slug=>[`/verktyg/${slug}/`,`/tools/${slug}/`])];
const read=url=>fs.readFileSync(path.join(root,url,'index.html'),'utf8');

test('every tool page has readable static copy, one H1, self canonical and reciprocal languages',()=>{
 for(const url of routes){const html=read(url),sv=url.startsWith('/verktyg/'),alternate=url.replace(sv?'/verktyg/':'/tools/',sv?'/tools/':'/verktyg/');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,url);
  assert.ok(html.includes(`<html lang="${sv?'sv':'en'}">`),url);
  assert.ok(html.includes(`rel="canonical" href="${origin}${url}"`),url);
  assert.ok(html.includes(`hreflang="${sv?'en':'sv'}" href="${origin}${alternate}"`),url);
  assert.ok(read(alternate).includes(`href="${origin}${url}"`),alternate);
  assert.match(html,/<meta name="robots" content="index, follow">/);
  assert.doesNotMatch(html,/<meta[^>]+noindex/);
  assert.doesNotMatch(html,/<script[^>]+src=|<form\b|\/Users\/|sourceDir|localhost|127\.0\.0\.1/);
  assert.match(html,/<meta name="description" content="[^\"]{60,220}">/);
 }
});

test('prices and purchase links match the six published Gumroad offers',()=>{
 for(const [slug,price] of Object.entries(expected)) for(const prefix of ['/verktyg/','/tools/']){
  const html=read(prefix+slug+'/');
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const app=json['@graph'].find(x=>x['@type']==='SoftwareApplication');
  assert.equal(Number(app.offers.price),price,slug);
  assert.equal(app.offers.priceCurrency,'USD');
  assert.equal(app.offers.url,`https://itsjustmeal3x.gumroad.com/l/${slug}`);
  assert.equal(app.operatingSystem,'macOS');
  assert.equal(app.aggregateRating,undefined);assert.equal(app.review,undefined);
  const links=[...html.matchAll(/href="(https:\/\/itsjustmeal3x.gumroad.com[^\"]+)"/g)];
  assert.equal(links.length,2,slug);
  for(const [,link] of links){const target=new URL(link.replaceAll('&amp;','&'));assert.equal(target.pathname,`/l/${slug}`);assert.equal(target.searchParams.get('utm_source'),'svensson-design');}
  assert.doesNotMatch(html,/\$\$/);
 }
});

test('sitemap lists every canonical route, and home and catalog link to each tool',()=>{
 const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert.equal(new Set(urls).size,15);
 for(const url of routes)assert.ok(urls.includes(origin+url),url);
 assert.doesNotMatch(xml,/\/demo\//);
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const slug of Object.keys(expected)){assert.ok(home.includes(`href="/verktyg/${slug}/"`));for(const prefix of ['/tools/','/verktyg/'])assert.ok(read(prefix).includes(`href="${prefix}${slug}/"`));}
 assert.match(fs.readFileSync(path.join(root,'robots.txt'),'utf8'),/Allow: \/\s/);
});

test('all page assets, internal links and in-page anchors resolve',()=>{
 for(const url of routes){const html=read(url);
  const refs=[...html.matchAll(/(?:href|src|poster)="([^\"]+)"/g)].map(x=>x[1]);
  for(const ref of refs){
   if(ref.startsWith('#')){assert.ok(html.includes(`id="${ref.slice(1)}"`),`${url} ${ref}`);continue;}
   if(!ref.startsWith('/'))continue;
   const [pathname,hash]=ref.split(/[?#]/);
   const file=path.join(root,pathname,pathname.endsWith('/')?'index.html':'');
   assert.ok(fs.existsSync(file),`${url}: missing ${ref}`);
   if(hash&&file.endsWith('.html'))assert.ok(fs.readFileSync(file,'utf8').includes(`id="${hash}"`),`${url}: missing #${hash}`);
  }
 }
});

test('public demo is explicitly limited, excluded from search, and cannot send files over the network',()=>{
 const html=read('/tools/shotlattice/demo/');
 assert.match(html,/<body data-demo="true">/);
 assert.match(html,/<meta name="robots" content="noindex, follow">/);
 assert.ok(html.includes("connect-src 'none'"));
 assert.ok(html.includes("form-action 'none'"));
 assert.match(html,/Free evaluation demo/);
 assert.doesNotMatch(html,/googletagmanager|google-analytics|<script[^>]+src=/);
 assert.ok(fs.existsSync(path.join(root,'tools/shotlattice/demo/THIRD_PARTY_NOTICES.md')));
 assert.ok(!fs.existsSync(path.join(root,'tools/shotlattice/START.html')),'Paid application must not be published');
});
