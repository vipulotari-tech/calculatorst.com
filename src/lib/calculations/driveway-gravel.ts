export type DensityUnit = 'ton/yd3' | 'lb/ft3' | 'kg/m3';
export type PriceBasis = 'ton' | 'yd3';

export interface DrivewayGravelLayerInput {
  id: string;
  label: string;
  enabled: boolean;
  depthFt: number;
  densityValue: number;
  densityUnit: DensityUnit;
  compactionPct: number;
  wastePct: number;
  price: number;
  priceBasis: PriceBasis;
}

export interface DrivewayGravelInput {
  lengthFt: number;
  widthFt: number;
  extraAreaFt2?: number;
  layers: DrivewayGravelLayerInput[];
  truckCapacityTons: number;
  delivery: number;
  taxPct: number;
}

export interface DrivewayGravelLayerResult {
  id: string;
  label: string;
  installedYd3: number;
  orderYd3: number;
  densityTonYd3: number;
  tons: number;
  pounds: number;
  kilograms: number;
  materialCost: number;
  truckLoads: number;
  finalLoadTons: number;
  finalLoadUtilizationPct: number;
}

export interface DrivewayGravelResult {
  areaFt2: number;
  installedYd3: number;
  orderYd3: number;
  tons: number;
  pounds: number;
  kilograms: number;
  tonnes: number;
  materialCost: number;
  tax: number;
  delivery: number;
  totalCost: number;
  truckLoads: number;
  finalLoadTons: number;
  finalLoadUtilizationPct: number;
  layers: DrivewayGravelLayerResult[];
}

const YD3_TO_M3 = 0.764554857984;
const KG_PER_SHORT_TON = 907.18474;

export function lengthToFeet(value: number, unit: string): number {
  if (unit === 'ft') return value;
  if (unit === 'in') return value / 12;
  if (unit === 'yd') return value * 3;
  if (unit === 'm') return value / 0.3048;
  if (unit === 'cm') return value / 30.48;
  if (unit === 'mm') return value / 304.8;
  throw new Error('Unsupported length unit');
}

export function areaToFt2(value: number, unit: string): number {
  if (unit === 'ft2') return value;
  if (unit === 'yd2') return value * 9;
  if (unit === 'm2') return value * (1 / 0.3048) ** 2;
  throw new Error('Unsupported area unit');
}

export function densityToTonYd3(value: number, unit: DensityUnit): number {
  if (unit === 'ton/yd3') return value;
  if (unit === 'lb/ft3') return value * 27 / 2000;
  if (unit === 'kg/m3') return value * YD3_TO_M3 / KG_PER_SHORT_TON;
  throw new Error('Unsupported density unit');
}

export function calculateDrivewayGravel(input: DrivewayGravelInput): DrivewayGravelResult {
  if (!(input.lengthFt > 0) || !(input.widthFt > 0)) throw new Error('Driveway length and width must be greater than zero.');
  if ((input.extraAreaFt2 ?? 0) < 0) throw new Error('Additional area cannot be negative.');
  if (!(input.truckCapacityTons > 0)) throw new Error('Truck payload capacity must be greater than zero.');
  if (input.taxPct < 0 || input.delivery < 0) throw new Error('Cost inputs cannot be negative.');

  const areaFt2 = input.lengthFt * input.widthFt + (input.extraAreaFt2 ?? 0);
  const layers: DrivewayGravelLayerResult[] = [];

  for (const layer of input.layers) {
    if (!layer.enabled || layer.depthFt <= 0) continue;
    if (!(layer.densityValue > 0)) throw new Error(`${layer.label} density must be greater than zero.`);
    if (layer.compactionPct < 0 || layer.wastePct < 0 || layer.price < 0) throw new Error(`${layer.label} allowances and price cannot be negative.`);

    const densityTonYd3 = densityToTonYd3(layer.densityValue, layer.densityUnit);
    const installedYd3 = areaFt2 * layer.depthFt / 27;
    const looseBeforeWasteYd3 = installedYd3 * (1 + layer.compactionPct / 100);
    const orderYd3 = looseBeforeWasteYd3 * (1 + layer.wastePct / 100);
    const tons = orderYd3 * densityTonYd3;
    const pounds = tons * 2000;
    const kilograms = pounds * 0.45359237;
    const materialCost = layer.priceBasis === 'yd3' ? orderYd3 * layer.price : tons * layer.price;
    const truckLoads = Math.ceil(tons / input.truckCapacityTons);
    const finalLoadTons = truckLoads > 0 ? tons - (truckLoads - 1) * input.truckCapacityTons : 0;
    const finalLoadUtilizationPct = truckLoads > 0 ? finalLoadTons / input.truckCapacityTons * 100 : 0;

    layers.push({
      id: layer.id,
      label: layer.label,
      installedYd3,
      orderYd3,
      densityTonYd3,
      tons,
      pounds,
      kilograms,
      materialCost,
      truckLoads,
      finalLoadTons,
      finalLoadUtilizationPct,
    });
  }

  if (layers.length === 0) throw new Error('Enter a depth greater than zero for at least one driveway layer.');

  const installedYd3 = layers.reduce((sum, layer) => sum + layer.installedYd3, 0);
  const orderYd3 = layers.reduce((sum, layer) => sum + layer.orderYd3, 0);
  const tons = layers.reduce((sum, layer) => sum + layer.tons, 0);
  const pounds = tons * 2000;
  const kilograms = pounds * 0.45359237;
  const tonnes = kilograms / 1000;
  const materialCost = layers.reduce((sum, layer) => sum + layer.materialCost, 0);
  const tax = materialCost * input.taxPct / 100;
  const totalCost = materialCost + tax + input.delivery;
  // Different driveway courses commonly use different aggregate products, so
  // transport planning must not assume partial loads can be mixed together.
  // Sum whole loads per enabled layer/product instead of rounding combined weight once.
  const truckLoads = layers.reduce((sum, layer) => sum + layer.truckLoads, 0);
  const finalLoadTons = layers.length === 1 ? layers[0].finalLoadTons : 0;
  const finalLoadUtilizationPct = layers.length === 1 ? layers[0].finalLoadUtilizationPct : 0;

  return {
    areaFt2,
    installedYd3,
    orderYd3,
    tons,
    pounds,
    kilograms,
    tonnes,
    materialCost,
    tax,
    delivery: input.delivery,
    totalCost,
    truckLoads,
    finalLoadTons,
    finalLoadUtilizationPct,
    layers,
  };
}
