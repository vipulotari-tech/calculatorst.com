import type { Model } from './calculator-types.ts';
import { structureModels } from './models-structure.ts';
import { materialModels } from './models-materials.ts';
import { finishModels } from './models-finishes.ts';
import { outdoorModels } from './models-outdoor.ts';

export const allModels: Record<string, Model> = {
  ...structureModels,
  ...materialModels,
  ...finishModels,
  ...outdoorModels,
};

export function getModel(key: string): Model {
  const m = allModels[key];
  if (!m) {
    throw new Error(`Model not found for key: ${key}`);
  }
  return m;
}
