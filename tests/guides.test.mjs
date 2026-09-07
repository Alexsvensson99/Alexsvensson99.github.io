import {loadGuides} from '../scripts/guide-data.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.svensson.design';
const guides = loadGuides(root);
const external = JSON.parse(fs.readFileSync(path.join(root,'data/external-pages.json'),'utf8'));
const routes = ['/guides/',...guides.map(g=>`/guides/${g.slug}/`)];
const read = url => fs.readFileSync(path.join(root,url,'index.html'),'utf8');

test('guides are complete static articles with consistent author, dates and canonical metadata',()=>{
  assert.ok(guides.length >= 4);
  for(const g of guides){
    const route=`/guides/${g.slug}/`, html=read(route);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,route);
    assert.match(html,/<html lang="en">/);
    assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`));
    assert.match(html,/<meta name="robots" content="index, follow">/);
    assert.doesNotMatch(html,/<script[^>]+src=|<form\b|<meta[^>]+noindex|hreflang="sv"|googletagmanager|google-analytics/);
    const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const article=schema['@graph'].find(x=>x['@type']==='Article');
    assert.equal(article.mainEntityOfPage,origin+route);
    assert.equal(article.headline,g.title);
    assert.equal(article.author['@id'],origin+'/#alexander');
    assert.ok(html.includes(`datetime="${article.datePublished}"`));
    assert.ok(article.wordCount>400,'Substantial content must survive rendering');
    for(const s of g.sections){assert.ok(html.includes(`id="${s.id}"`));assert.ok(html.includes(s.html));}
    assert.ok(html.includes(`/tools/${g.product}/`));
  }
});

test('guide navigation, local images, downloads and fragments resolve without exposing paid assets',()=>{
  for(const route of routes){
    const html=read(route), ids=[...html.matchAll(/\sid=["']([^"']+)["']/g)].map(x=>x[1]);
    assert.equal(ids.length,new Set(ids).size,route);
    const refs=[...html.matchAll(/(?:href|src|poster)=["']([^"']+)["']/g)].map(x=>x[1]);
    for(const ref of refs){
      if(!ref.startsWith('/')&&!ref.startsWith('#'))continue;
      const target=new URL(ref,origin+route), pathname=decodeURIComponent(target.pathname);
      if(external.includes(pathname))continue;
      const file=path.join(root,pathname,pathname.endsWith('/')?'index.html':'');
      assert.ok(fs.existsSync(file),`${route}: missing ${ref}`);
      if(target.hash){const dest=fs.readFileSync(file,'utf8');assert.ok(new RegExp(`id=["']${target.hash.slice(1)}["']`).test(dest),`${route}: missing ${ref}`);}
    }
    assert.doesNotMatch(html,/\/Users\/|localhost|127\.0\.0\.1|href=["'][^"']*START\.html|href=["'][^"']*handoffpack-1\.0\.0/);
  }
  for(const g of guides)for(const d of g.downloads){
    assert.ok(d.url.startsWith('/guides/assets/'));
    const content=fs.readFileSync(path.join(root,d.url),'utf8');
    assert.ok(content.trim().length>50);
    assert.doesNotMatch(content,/\/Users\/|google-site-verification|BEGIN PRIVATE KEY/);
  }
});

test('the single sitemap contains all local pages and reviewed project pages, with no duplicate or demo route',()=>{
  const products=JSON.parse(fs.readFileSync(path.join(root,'data/tools.json'),'utf8'));
  const expected=['/',...['tools','verktyg'].flatMap(prefix=>[`/${prefix}/`,...products.map(p=>`/${prefix}/${p.slug}/`)]),...routes,...external].map(p=>origin+p);
  const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  const actual=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.deepEqual([...actual].sort(),[...expected].sort());
  assert.equal(new Set(actual).size,actual.length);
  assert.doesNotMatch(xml,/\/demo\/|\/assets\/|work-preview|google-site-verification/);
});

test('home, product pages and the guide library provide reciprocal discoverable links',()=>{
  const home=read('/'),hub=read('/guides/');
  assert.ok(home.includes('id="about-tools"'));
  assert.ok(home.includes('href="/guides/"'));
  for(const g of guides){
    const link=`href="/guides/${g.slug}/"`;
    assert.ok(hub.includes(link));
    for(const prefix of ['tools','verktyg'])assert.ok(read(`/${prefix}/${g.product}/`).includes(link));
  }
});
