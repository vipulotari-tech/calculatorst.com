import fs from 'node:fs/promises';
import path from 'node:path';
import { hubCalculators, hubCategories } from '../src/data/hubCalculators.ts';
import { calculators } from '../src/data/calculators.ts';

const origin = process.env.AUDIT_ORIGIN || 'https://calculatorst.com';
const stage = process.argv[2] || 'baseline';
if (!/^[a-z-]+$/.test(stage)) throw new Error('Invalid audit stage');
const directory = path.resolve('audit', stage);
await fs.mkdir(directory, { recursive: true });
const registry = [...new Map([...hubCalculators, ...calculators].map(c => [c.slug, c])).values()];
const paths = ['/', '/calculators/', '/construction/', '/about/', '/contact/', '/privacy/', '/terms/', '/disclaimer/', '/author/vipul-otari/', ...hubCategories.map(c => `/construction/${c.slug}/`), '/construction/decking/', '/construction/fencing/', ...registry.map(c => `/${c.slug}/`)];
const special = ['/robots.txt', '/sitemap.xml', '/ads.txt', '/audit-nonexistent-route-20260911/'];
const clean = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
function inspect(html) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attrs(m[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0]));
  const schemas = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => { try { return JSON.parse(m[1]); } catch { return { error: 'Invalid JSON' }; } });
  return {
    title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''),
    description: metas.find(m => m.name === 'description')?.content || '',
    robots: metas.filter(m => /robots|googlebot/.test(m.name || '')).map(m => m.content),
    canonical: links.filter(l => l.rel === 'canonical').map(l => l.href),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => clean(m[1])),
    headings: [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({level: +m[1], text: clean(m[2])})),
    internalLinks: [...new Set([...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]).filter(h => h.startsWith('/') || h.startsWith(origin)))],
    schemaTypes: schemas.map(s => s['@type'] || s.error),
    schemas,
    ogImage: metas.find(m => m.property === 'og:image')?.content,
    gaIds: [...new Set(html.match(/G-[A-Z0-9]{6,}/g) || [])],
    scriptBytes: [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].reduce((n,m) => n + Buffer.byteLength(m[1]), 0),
    bytes: Buffer.byteLength(html),
    words: clean(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')).split(' ').length,
  };
}
const queue = [...new Set([...paths, ...special])];
const results = [];
await Promise.all(Array.from({length: 5}, async () => {
  while (queue.length) {
    const route = queue.shift();
    const started = performance.now();
    try {
      const response = await fetch(origin + route, {signal: AbortSignal.timeout(30000), headers: {'User-Agent': 'CalculatorstSiteAudit/1.0'}});
      const html = await response.text();
      const record = {route, status: response.status, finalUrl: response.url, durationMs: Math.round(performance.now()-started), headers: Object.fromEntries(response.headers), ...(/text\/html/.test(response.headers.get('content-type') || '') ? inspect(html) : {body: html})};
      // Raw HTML stays local; it is useful for reproducing before/after findings.
      await fs.writeFile(path.join(directory, route === '/' ? 'home.html' : route.replace(/^\//,'').replaceAll('/','__') + (route.endsWith('/') ? '.html' : '.txt')), html);
      results.push(record);
    } catch(error) { results.push({route,error:error.message}); }
    if (results.length % 25 === 0) console.log(`${stage}: ${results.length} URLs checked`);
  }
}));
results.sort((a,b) => a.route.localeCompare(b.route));
const sitemap = results.find(r=>r.route==='/sitemap.xml')?.body || '';
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
for (const r of results) { r.inSitemap = sitemapUrls.includes(origin+r.route); r.inboundPages = results.filter(p => p.route!==r.route && p.internalLinks?.some(h => h===r.route || h===origin+r.route)).length; }
const summary = {date:new Date().toISOString(), origin, calculators:registry.length, paths:paths.length, checked:results.length, errors:results.filter(r=>r.error), non200:results.filter(r=>r.status!==200).map(r=>({route:r.route,status:r.status})), noindex:results.filter(r=>r.robots?.some(v=>v.includes('noindex'))).length, sitemapUrls:sitemapUrls.length, calculatorOmissions:registry.filter(c=>!sitemapUrls.includes(`${origin}/${c.slug}/`)).map(c=>c.slug), results};
await fs.writeFile(path.join(directory,'routes.json'),JSON.stringify(summary,null,2));
await fs.writeFile(path.join(directory,'calculator-inventory.json'),JSON.stringify(registry,null,2));
console.log(JSON.stringify({...summary,results:undefined,calculatorOmissions:summary.calculatorOmissions.length},null,2));
