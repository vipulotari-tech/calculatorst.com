import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

// Check the produced HTML, not just metadata source records. No network needed.
const root = resolve(process.argv[2] ?? 'dist');
const origin = 'https://calculatorst.com';
const failures = [];
const assert = (value, message) => { if (!value) failures.push(message); };
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), m[2]]));
const files = async (dir) => (await Promise.all((await readdir(dir)).map(async name => {
  const path = resolve(dir, name);
  return (await stat(path)).isDirectory() ? files(path) : [path];
}))).flat();
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert(urls.length > 0, 'Sitemap contains no URLs');
assert(new Set(urls).size === urls.length, 'Duplicate sitemap URLs');
const pages = new Map();
let schemaCount = 0;
for (const file of (await files(root)).filter(path => path.endsWith('/index.html'))) {
  const path = '/' + relative(root, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0])).filter(a => a.rel === 'canonical');
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => attrs(m[0]));
  const noindex = metas.some(a => a.name?.toLowerCase() === 'robots' && /noindex/i.test(a.content ?? ''));
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map(m => attrs(m[0]).href).filter(Boolean).flatMap(href => {
    try { const u = new URL(href, origin + path); return u.origin === origin ? [u.pathname] : []; } catch { return []; }
  });
  pages.set(path, { links, noindex });
  assert((head.match(/<title\b/g) ?? []).length === 1, `${path}: expected one head title`);
  assert(metas.filter(a => a.name === 'description' && a.content?.trim()).length === 1, `${path}: expected one meaningful description`);
  assert(canonicals.length === 1 && canonicals[0].href === origin + path, `${path}: wrong or duplicate canonical`);
  assert((html.match(/<h1\b/g) ?? []).length === 1, `${path}: expected one H1`);
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(script[1]); schemaCount++; } catch { failures.push(`${path}: invalid JSON-LD`); }
  }
}
for (const url of urls) {
  const u = new URL(url);
  assert(u.origin === origin && u.pathname.endsWith('/') && !u.search && !u.hash, `Noncanonical sitemap URL: ${url}`);
  assert(pages.has(u.pathname), `Sitemap URL lacks built page: ${url}`);
  assert(!pages.get(u.pathname)?.noindex, `Noindex sitemap URL: ${url}`);
}
for (const [path, page] of pages) {
  if (!page.noindex) assert(urls.includes(origin + path), `Indexable built route missing from sitemap: ${path}`);
  for (const target of page.links) {
    assert(pages.has(target) || (await stat(resolve(root, '.' + target)).catch(() => null)), `${path}: broken internal link ${target}`);
  }
}
const depths = new Map([['/', 0]]);
const queue = ['/'];
for (const path of queue) {
  for (const target of pages.get(path)?.links ?? []) {
    if (pages.has(target) && !depths.has(target)) { depths.set(target, depths.get(path) + 1); queue.push(target); }
  }
}
for (const url of urls) {
  const path = new URL(url).pathname;
  assert(depths.has(path), `Orphan sitemap page: ${path}`);
  assert((depths.get(path) ?? Infinity) <= 3, `Crawl depth exceeds three: ${path}`);
}
const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'Robots sitemap declaration missing');
assert(!/^Disallow:\s*\/\s*$/im.test(robots), 'Robots contains site-wide disallow');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed: ${pages.size} HTML pages, ${urls.length} sitemap URLs, ${schemaCount} valid JSON-LD blocks; all sitemap pages reachable within three clicks.`);
}
