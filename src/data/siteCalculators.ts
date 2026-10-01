import { calculators, type CalculatorMeta } from './calculators';
import { hubCalculators, hubCategories } from './hubCalculators';
import { slugToCluster } from './categoryContent';
import { supplementalCalculators } from './supplementalCalculators';

// Public discovery catalog: generated calculators plus dedicated Astro pages.
// Keep the generic model registry's hubCalculators inventory separate.
export const siteCalculators: CalculatorMeta[] = [...new Map(
  [...hubCalculators, ...calculators, ...supplementalCalculators].map(calculator => [calculator.slug, calculator]),
).values()];

export const siteCategories = hubCategories.map(category => ({
  ...category,
  count: siteCalculators.filter(calculator => calculator.cluster === (slugToCluster[category.slug] ?? category.slug)).length,
}));
