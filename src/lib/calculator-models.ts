import type { Model } from './calculator-types.ts';
import { structureModels } from './models-structure.ts';
import { materialModels } from './models-materials.ts';
import { finishModels } from './models-finishes.ts';
import { outdoorModels } from './models-outdoor.ts';
import { slabModels } from './models-slab.ts';
import { foundationModels } from './models-foundation.ts';
import { rebarModels } from './models-rebar.ts';
import { masonryDedicatedModels } from './models-masonry-dedicated.ts';

export const allModels: Record<string, Model> = {
  ...structureModels,
  ...materialModels,
  ...finishModels,
  ...outdoorModels,
  ...slabModels,
  ...foundationModels,
  ...rebarModels,
  ...masonryDedicatedModels,
};

export function getModel(key: string): Model {
  const m = allModels[key];
  if (!m) {
    throw new Error(`Model not found for key: ${key}`);
  }
  return m;
}
