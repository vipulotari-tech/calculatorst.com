import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const origin = 'https://calculatorst.com';
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((m) => [m[1].toLowerCase(), m[2]]));
const listFiles = async (dir) => (await Promise.all((await readdir(dir)).map(async (name) => {
  const path = resolve(dir, name);
  return (await stat(path)).isDirectory() ? listFiles(path) : [path];
}))).flat();
const stripMarkup = (value) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const normalize = (value) => value.toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
const groupDuplicates = (items, key) => {
  const grouped = new Map();
  for (const item of items) {
    const value = normalize(item[key] ?? '');
    if (!value) continue;
    const group = grouped.get(value) ?? [];
    group.push(item);
    grouped.set(value, group);
  }
  return [...grouped.values()].filter((group) => group.length > 1).sort((a, b) => b.length - a.length);
};
const files = (await listFiles(root)).filter((path) => path.endsWith('/index.html'));
if (!files.length) {
  console.error('No rendered index.html files found under ' + root + '. Run npm run build first.');
  process.exit(1);
}
const pages = [];
const missingAlt = [];
for (const file of files) {
  const path = '/' + relative(root, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const title = stripMarkup(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metaTags = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const description = stripMarkup(metaTags.find((m) => m.name?.toLowerCase() === 'description')?.content ?? '');
  const h1 = stripMarkup(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
  pages.push({ path, title, description, h1 });
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const imageAttrs = attrs(match[0]);
    if (!Object.prototype.hasOwnProperty.call(imageAttrs, 'alt')) {
      missingAlt.push({ path, src: imageAttrs.src ?? '(src missing)' });
    }
  }
}
const duplicateTitles = groupDuplicates(pages, 'title');
const duplicateDescriptions = groupDuplicates(pages, 'description');
const duplicateH1s = groupDuplicates(pages, 'h1');
const titleLengthWarnings = pages.filter((p) => p.title && (p.title.length < 25 || p.title.length > 70));
const descriptionLengthWarnings = pages.filter((p) => p.description && (p.description.length < 100 || p.description.length > 170));
const showGroups = (label, groups) => {
  console.log('\n' + label + ': ' + groups.length);
  for (const group of groups.slice(0, 25)) {
    console.log('  [' + group.length + '] ' + (group[0].title || group[0].description || group[0].h1));
    console.log('      ' + group.map((p) => p.path).join(', '));
  }
};
console.log('SEO content diagnostics for ' + origin);
console.log('Rendered pages: ' + pages.length);
console.log('Title length outside 25–70 characters (heuristic only): ' + titleLengthWarnings.length);
console.log('Description length outside 100–170 characters (heuristic only): ' + descriptionLengthWarnings.length);
console.log('Images missing an alt attribute: ' + missingAlt.length);
showGroups('Duplicate normalized titles', duplicateTitles);
showGroups('Duplicate normalized meta descriptions', duplicateDescriptions);
showGroups('Repeated normalized H1s (review intent; not automatically an error)', duplicateH1s);
if (missingAlt.length) {
  console.log('\nImages missing alt (first 50):');
  for (const image of missingAlt.slice(0, 50)) console.log('  ' + image.path + ' — ' + image.src);
}
if (titleLengthWarnings.length) {
  console.log('\nTitle length warnings (first 30):');
  for (const p of titleLengthWarnings.slice(0, 30)) console.log('  ' + p.path + ' (' + p.title.length + '): ' + p.title);
}
if (descriptionLengthWarnings.length) {
  console.log('\nDescription length warnings (first 30):');
  for (const p of descriptionLengthWarnings.slice(0, 30)) console.log('  ' + p.path + ' (' + p.description.length + '): ' + p.description);
}
console.log('\nNote: length bands are diagnostic heuristics, not Google ranking rules. Review findings manually; similar metadata alone does not prove duplicate main content.');
