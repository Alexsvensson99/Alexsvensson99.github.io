import {loadGuides} from './guide-data.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.svensson.design';
const published = '2026-09-07';
const guides = loadGuides(root);
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/tools.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absolute = url => new URL(url, origin).href;
const route = guide => `/guides/${guide.slug}/`;
const write = (url, html) => { const file = path.join(root, url, 'index.html'); fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, html); };

for (const g of guides) {
  if (!/^[a-z0-9-]+$/.test(g.slug) || !products.some(p => p.slug === g.product)) throw new Error(`Invalid guide: ${g.slug}`);
  const ids = g.sections.map(s => s.id);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9-]+$/.test(id))) throw new Error(`Invalid section IDs: ${g.slug}`);
  for (const s of g.sections) {
    if (/<(?:script|iframe|form|style|h1|h2)\b|\bon\w+\s*=|javascript:/i.test(s.html)) throw new Error(`Unsupported guide markup: ${g.slug}`);
  }
}

function head(title, description, url, image, schema, article = false) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#10233f"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<meta name="author" content="Alexander Svensson"><meta name="robots" content="index, follow">
<link rel="canonical" href="${origin}${url}">
<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:locale" content="en_US"><meta property="og:site_name" content="Svensson.design">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin}${url}"><meta property="og:image" content="${origin}${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${origin}${image}">
<link rel="icon" href="/img/favicon.ico"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/tools.css"><link rel="stylesheet" href="/css/guides.css">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
<script src="/js/analytics.js" defer></script>
</head><body class="tools-page guides-page"><a class="skip-link" href="#main">Skip to content</a>
<header class="tools-header"><div class="shell"><a class="tools-brand" href="/">Svensson<span>.design</span></a><nav aria-label="Main navigation"><a href="/apps/">Apps (Swedish)</a><a href="/guider/" lang="sv">Svenska guider</a><a href="/guides/">Guides</a><a href="/tools/">All tools</a><a href="/#about-tools">About Alexander</a></nav></div></header>`;
}

const foot = `<footer class="tools-footer"><div class="shell"><p>Practical guides by Alexander Svensson · Tools sold as Voxlessa on Gumroad</p><a href="/guides/">All guides</a><a href="/tools/">Tools</a><a href="/">Svensson.design</a><button class="footer-button" type="button" data-consent-settings>Cookie settings</button></div></footer></body></html>\n`;
const card = g => `<article class="guide-card"><p class="eyebrow">${esc(products.find(p => p.slug === g.product).name)} workflow</p><h3><a href="${route(g)}">${esc(g.title)}</a></h3><p>${esc(g.summary)}</p><a class="text-link" href="${route(g)}">Read the guide<span class="visually-hidden">: ${esc(g.title)}</span> →</a></article>`;

const hubTitle = 'Practical guides for app screenshots and website handovers';
const hubDescription = 'Prepare App Store screenshots, organise localised copy, and hand over a website with practical walkthroughs, a free CSV template and client handover examples.';
const hubSchema = {'@context':'https://schema.org','@type':'CollectionPage',name:hubTitle,description:hubDescription,url:origin+'/guides/',inLanguage:'en',mainEntity:{'@type':'ItemList',itemListElement:guides.map((g,i)=>({'@type':'ListItem',position:i+1,name:g.title,url:origin+route(g)}))}};
write('/guides/', head(hubTitle,hubDescription,'/guides/','/tools/assets/shotlattice-cover.png',hubSchema)+`
<main id="main"><section class="shell guides-intro"><p class="eyebrow">Workflows &amp; free resources</p><h1>Make the next handoff easier.</h1><p class="tools-lead">From App Store screenshot sets to a client’s first website update. Work through a concrete example, take a template, and adapt it to your own project.</p><p class="subtle">Written by <a href="/#about-tools">Alexander Svensson</a>, creator of the tools used in these guides.</p></section>
${products.filter(p=>guides.some(g=>g.product===p.slug)).map(p=>`<section class="shell guide-catalog" aria-labelledby="${p.slug}-guides"><h2 id="${p.slug}-guides">${esc(p.slug==='shotlattice'?'Prepare your app’s screenshot set':p.slug==='relayfolio'?'Give your client a usable handover':p.en.headline)}</h2><div class="guide-grid">${guides.filter(g=>g.product===p.slug).map(card).join('')}</div></section>`).join('')}
<section class="shell guide-open-source"><p class="eyebrow">For native Xcode projects</p><h2>Moving from CocoaPods to Swift Package Manager?</h2><p>PkgLift’s documentation covers migration planning, compatibility and verification for supported native Xcode projects.</p><p><a class="text-link" href="/PkgLift/cocoapods-to-swiftpm/">Read the CocoaPods to SwiftPM guide →</a></p><p><a href="/PkgLift/case-study/">Explore the documented case study</a> · <a href="/PkgLift/troubleshooting/">Troubleshoot a migration</a></p></section>
</main>`+foot);

for (const g of guides) {
  const p = products.find(p=>p.slug===g.product);
  const url = route(g);
  const image = g.product === 'shotlattice' ? '/tools/assets/shotlattice-cover.png' : '/tools/assets/relayfolio-preview.webp';
  const wordCount = g.sections.map(s=>s.title+' '+s.html.replace(/<[^>]+>/g,' ')).join(' ').split(/\s+/).length;
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'Article','@id':origin+url+'#article',headline:g.title,description:g.description,url:origin+url,mainEntityOfPage:origin+url,inLanguage:'en',datePublished:published,dateModified:published,image:[origin+image],author:{'@type':'Person','@id':origin+'/#alexander',name:'Alexander Svensson',url:origin+'/#about-tools'},publisher:{'@type':'Person','@id':origin+'/#alexander',name:'Alexander Svensson',url:origin+'/'},wordCount},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Guides',item:origin+'/guides/'},{'@type':'ListItem',position:2,name:g.title,item:origin+url}]}
  ]};
  write(url,head(g.title+' | Svensson.design',g.description,url,image,schema,true)+`
<main id="main"><div class="shell breadcrumbs"><a href="/guides/">Guides</a><span aria-hidden="true">/</span><span>${esc(p.name)}</span></div>
<article class="shell guide-article"><header class="guide-heading"><p class="eyebrow">${esc(p.name)} workflow</p><h1>${esc(g.title)}</h1><p class="tools-lead">${esc(g.summary)}</p><p class="guide-byline">By <a href="/#about-tools">Alexander Svensson</a> · <time datetime="${published}">7 September 2026</time> · ${Math.ceil(wordCount/180)} min read</p></header>
<div class="guide-layout"><aside class="guide-toc"><nav aria-label="On this page"><h2>On this page</h2><ol>${g.sections.map(s=>`<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('')}<li><a href="#downloads">Free resources</a></li></ol></nav></aside>
<div class="guide-body">${g.sections.map(s=>`<section id="${s.id}"><h2>${esc(s.title)}</h2>${s.html}</section>`).join('')}
<section id="downloads" class="guide-downloads"><p class="eyebrow">Keep a working copy</p><h2>Free resources</h2><p>Download, adapt and use these examples in your own work. No signup is needed.</p><ul>${g.downloads.map(d=>`<li><a href="${esc(d.url)}" download>${esc(d.label)} ↓</a></li>`).join('')}</ul></section>
<aside class="guide-product"><p class="eyebrow">Continue with ${esc(p.name)}</p><h2>${esc(p.en.headline)}</h2><p>${esc(p.en.intro)}</p><p>One-time purchase: $${p.price} USD. Review the supported workflow, compatibility and purchase terms on the product page.</p><div class="tool-actions"><a class="button button-primary" href="/tools/${p.slug}/">Explore ${esc(p.name)} →</a>${p.slug==='shotlattice'?'<a class="button button-secondary" href="/prova/shotlattice/">Try the limited demo</a>':''}</div><p class="subtle">I built ${esc(p.name)} and sell it through my Voxlessa Gumroad store.</p></aside>
${g.sources.length?`<section class="guide-sources" aria-labelledby="sources-title"><h2 id="sources-title">References</h2><ul>${g.sources.map(s=>`<li><a href="${esc(absolute(s.url))}">${esc(s.title)}</a></li>`).join('')}</ul></section>`:''}
</div></div></article>
<section class="shell guide-catalog"><h2>Keep going</h2><div class="guide-grid">${guides.filter(s=>s.product===g.product&&s.slug!==g.slug).map(card).join('')}</div></section></main>`+foot);
}
console.log(`Generated ${guides.length} guides and the guide library.`);
