#!/usr/bin/env node
/**
 * Content Specificity Audit v2 — focuses on TRUE cross-family contamination
 *
 * Checks calculatorDetails.ts for:
 * 1. Concrete/brand references on non-concrete pages (real contamination)
 * 2. ACI 318 on non-rebar/non-concrete pages
 * 3. Concrete-specific terms (slump, psi, ready-mix, bag yield) on non-concrete
 * 4. Thin content
 *
 * Does NOT flag same-family related calculators (deck/deck-cost etc.) as those
 * legitimately share model-derived content.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(process.cwd());
const DETAILS_PATH = join(ROOT, 'src', 'data', 'calculatorDetails.ts');

if (!existsSync(DETAILS_PATH)) {
  console.error('ERROR: calculatorDetails.ts not found at', DETAILS_PATH);
  process.exit(1);
}

const content = readFileSync(DETAILS_PATH, 'utf-8');

// Parse calculator entries
const calculators = [];
const entryRegex = /^  "([a-z0-9-]+)":\s*\{$/gm;
let m;
while ((m = entryRegex.exec(content)) !== null) {
  const slug = m[1];
  if (['example', 'formula', 'inputs', 'variables', 'howToUse'].includes(slug)) continue;
  let pos = m.index + m[0].length;
  let depth = 1;
  let bodyStart = pos;
  while (pos < content.length && depth > 0) {
    if (content[pos] === '{') depth++;
    else if (content[pos] === '}') depth--;
    pos++;
  }
  const body = content.slice(bodyStart, pos - 1);
  const ciMatch = body.match(/"constructionInfo":\s*"((?:[^"\\]|\\.)*)"/);
  const miMatch = body.match(/"materialInfo":\s*"((?:[^"\\]|\\.)*)"/);
  if (ciMatch || miMatch) {
    calculators.push({
      slug,
      constructionInfo: ciMatch ? ciMatch[1].replace(/\\"/g, '"') : '',
      materialInfo: miMatch ? miMatch[1].replace(/\\"/g, '"') : '',
      combined: (ciMatch ? ciMatch[1] : '') + ' ' + (miMatch ? miMatch[1] : ''),
    });
  }
}

console.log(`\n=== Content Specificity Audit (Cross-Family) ===\n`);
console.log(`Scanned ${calculators.length} calculator entries\n`);

if (calculators.length === 0) {
  console.error('No calculator entries parsed.');
  process.exit(1);
}

// Domain families — calculators that legitimately share concrete content
const concreteFamily = new Set([
  'concrete-calculator', 'concrete-volume-calculator', 'concrete-cost-calculator',
  'concrete-pour-calculator', 'concrete-mix-calculator', 'concrete-weight-calculator',
  'concrete-slab-calculator', 'concrete-footing-calculator', 'concrete-foundation-calculator',
  'concrete-wall-calculator', 'concrete-column-calculator', 'concrete-curb-calculator',
  'concrete-stair-calculator', 'concrete-ramp-calculator', 'concrete-tube-calculator',
  'concrete-waste-calculator',
  'slab-thickness-calculator', 'slab-cost-calculator', 'slab-reinforcement-calculator',
  'patio-concrete-calculator', 'patio-cost-calculator',
  'driveway-concrete-calculator', 'driveway-cost-calculator', 'driveway-thickness-calculator',
  'garage-slab-calculator', 'shed-foundation-calculator',
  'strip-footing-calculator', 'pad-footing-calculator', 'pier-footing-calculator',
  'footing-volume-calculator', 'footing-concrete-calculator',
  'foundation-cost-calculator', 'foundation-excavation-calculator',
  'foundation-wall-calculator', 'basement-wall-calculator', 'crawl-space-calculator',
]);

const rebarFamily = new Set([
  'rebar-calculator', 'rebar-weight-calculator', 'rebar-spacing-calculator',
  'rebar-length-calculator', 'rebar-quantity-calculator', 'rebar-cost-calculator',
  'rebar-grid-calculator', 'rebar-lap-length-calculator', 'reinforcement-mesh-calculator',
  'rebar-chair-calculator', 'slab-reinforcement-calculator', 'cmu-reinforcement-calculator',
]);

// Get family for a slug
function familyOf(slug) {
  if (concreteFamily.has(slug)) return 'concrete';
  if (rebarFamily.has(slug)) return 'rebar';
  return 'other';
}

const issues = [];

// 1. Concrete-specific terms on non-concrete calculators
const concreteTerms = [
  /\b\d+\s*psi\b/i,              // 4000 psi
  /\bslump\b/i,                   // slump 4 in
  /ready[- ]mix/i,                // ready-mix
  /\bbag\s*yield/i,              // bag yield
  /0\.60\s*ft/i,                  // 0.60 ft³ per bag
  /4000\s*psi/i,                  // 4000 psi
  /3000\s*psi/i,                  // 3000 psi
  /Keep\s+slump/i,                // Keep slump
];
for (const calc of calculators) {
  if (familyOf(calc.slug) === 'concrete') continue;
  for (const term of concreteTerms) {
    if (term.test(calc.combined)) {
      const match = calc.combined.match(term);
      issues.push(`[concrete-term] "${match?.[0]}" on ${calc.slug}`);
    }
  }
}

// 2. Brand references on non-concrete
const brands = ['QUIKRETE', 'Quikrete', 'Sakrete', 'concrete.org', 'cmha.org'];
for (const calc of calculators) {
  if (familyOf(calc.slug) === 'concrete') continue;
  for (const brand of brands) {
    if (calc.combined.includes(brand)) {
      issues.push(`[brand-ref] "${brand}" on ${calc.slug}`);
    }
  }
}

// 3. ACI 318 on non-rebar/non-concrete
const aciPattern = /ACI 318|aci 318/i;
for (const calc of calculators) {
  if (familyOf(calc.slug) === 'concrete' || familyOf(calc.slug) === 'rebar') continue;
  if (aciPattern.test(calc.combined)) {
    issues.push(`[inappropriate-aci] ACI 318 on ${calc.slug}`);
  }
}

// 4. Thin content (< 100 chars combined constructionInfo + materialInfo)
for (const calc of calculators) {
  if (calc.combined.trim().length < 100) {
    issues.push(`[thin-content] ${calc.slug} (${calc.combined.trim().length} chars)`);
  }
}

if (issues.length === 0) {
  console.log('✓ NO CROSS-FAMILY CONTAMINATION ISSUES FOUND');
  console.log('  - No concrete terms on non-concrete pages');
  console.log('  - No brand references on non-concrete pages');
  console.log('  - No inappropriate ACI 318 references');
  console.log('  - No thin content');
} else {
  console.log(`Found ${issues.length} issue(s):\n`);
  // Deduplicate
  const unique = [...new Set(issues)];
  for (const issue of unique) console.log('  ' + issue);
}

console.log('\n=== Audit Complete ===\n');
