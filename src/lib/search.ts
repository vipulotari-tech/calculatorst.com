import { hubCalculators } from '../data/hubCalculators';
import { calculators } from '../data/calculators';

const aliases: Record<string, string> = {
  cmu: 'concrete block masonry unit', cinder: 'concrete block', cement: 'cement concrete',
  timber: 'lumber', sheetrock: 'drywall', plasterboard: 'drywall',
  reinforcement: 'reinforcement rebar', aggregate: 'aggregate gravel',
  'concrete masonry unit': 'cmu', 'concrete block': 'cmu',
  'sq ft': 'square feet', 'sqft': 'square feet', 'square foot': 'square feet',
  'cu yd': 'cubic yards', 'cuyd': 'cubic yards', 'cubic yard': 'cubic yards',
  'rebar': 'reinforcement bar', 'rebars': 'reinforcement bars',
  'stud': 'wall stud', 'studs': 'wall studs',
  'joist': 'floor joist', 'joists': 'floor joists',
  'rafter': 'roof rafter', 'rafters': 'roof rafters',
  'truss': 'roof truss', 'trusses': 'roof trusses',
  'beam': 'support beam', 'beams': 'support beams',
  'post': 'fence post', 'posts': 'fence posts',
  'panel': 'fence panel', 'panels': 'fence panels',
  'picket': 'fence picket', 'pickets': 'fence pickets',
  'bag': 'cement bag', 'bags': 'cement bags',
  'board': 'lumber board', 'boards': 'lumber boards',
  'sheet': 'drywall sheet', 'sheets': 'drywall sheets',
  'tube': 'concrete tube', 'tubes': 'concrete tubes',
  'pipe': 'drain pipe', 'pipes': 'drain pipes',
  'gate': 'fence gate', 'gates': 'fence gates',
  'brick': 'clay brick', 'bricks': 'clay bricks',
  'block': 'concrete block', 'blocks': 'concrete blocks',
  'slab': 'concrete slab', 'slabs': 'concrete slabs',
  'footing': 'concrete footing', 'footings': 'concrete footings',
  'wall': 'concrete wall', 'walls': 'concrete walls',
  'column': 'concrete column', 'columns': 'concrete columns',
  'stair': 'concrete stair', 'stairs': 'concrete stairs',
  'ramp': 'concrete ramp', 'ramps': 'concrete ramps',
  'curb': 'concrete curb', 'curbs': 'concrete curbs',
  'tube': 'concrete tube', 'tubes': 'concrete tubes',
  'waste': 'concrete waste',
  'mix': 'concrete mix',
  'weight': 'concrete weight',
  'volume': 'concrete volume',
  'cost': 'concrete cost',
  'pour': 'concrete pour',
};
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function distance(a: string, b: string): number {
  const matrix = Array.from({length: a.length + 1}, (_, i) => Array.from({length: b.length + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    matrix[i][j] = Math.min(matrix[i-1][j]+1, matrix[i][j-1]+1, matrix[i-1][j-1]+(a[i-1] === b[j-1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) matrix[i][j] = Math.min(matrix[i][j], matrix[i-2][j-2]+1);
  }
  return matrix[a.length][b.length];
}
export const searchCatalog = [...new Map([...hubCalculators, ...calculators].map(c => [c.slug, c])).values()];
const index = searchCatalog.map(c => ({
  ...c, name: normalize(c.h1),
  words: normalize(`${c.h1} ${c.category} ${c.description} ${(c.keywords ?? []).join(' ')}`).split(' '),
}));
export function searchCalculators(query: string) {
  const q = normalize(query).slice(0, 120);
  if (!q) return searchCatalog;
  const terms = q.split(' ').slice(0, 12).map(t => t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);
  return index.map(c => {
    let score = c.name === q ? 100 : c.name.startsWith(q) ? 50 : c.name.includes(q) ? 30 : 0;
    for (const term of terms) {
      const variants = [term, ...(aliases[term]?.split(' ') ?? [])];
      const exact = variants.some(t => c.words.includes(t));
      const partial = variants.some(t => c.words.some(w => w.startsWith(t)));
      const fuzzy = !exact && !partial && term.length >= 4 && c.words.some(w => Math.abs(w.length-term.length) <= 1 && distance(term, w) <= 1);
      if (!exact && !partial && !fuzzy) return { c, score: -1 };
      score += exact ? 10 : partial ? 5 : 1;
      if (c.name.includes(term)) score += 10;
    }
    return { c, score };
  }).filter(x => x.score >= 0).sort((a,b) => b.score-a.score || a.c.h1.localeCompare(b.c.h1)).map(x => x.c);
}
