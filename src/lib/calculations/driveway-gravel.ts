export type DensityUnit = 'ton/yd3' | 'lb/ft3' | 'kg/m3';
export type PriceBasis = 'ton' | 'yd3';
export type SupplyMode = 'bulk' | 'bags';
export type SectionOperation = 'add' | 'subtract';

export interface DrivewayFootprintSectionInput {
  id: string;
  label: string;
  enabled: boolean;
  lengthFt: number;
  widthFt: number;
  operation?: SectionOperation;
}

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
  supplyMode?: SupplyMode;
  bagWeightLb?: number;
  bagPrice?: number;
  supplierIncrementTons?: number;
  supplierMinimumTons?: number;
}

export interface DrivewayGeotextileInput {
  enabled: boolean;
  overlapPct: number;
  rollWidthFt: number;
  rollLengthFt: number;
  pricePerRoll: number;
}

export interface DrivewayEdgingInput {
  enabled: boolean;
  lengthFt: number;
  pricePerFt: number;
}

export interface DrivewayGravelInput {
  lengthFt: number;
  widthFt: number;
  extraAreaFt2?: number;
  sections?: DrivewayFootprintSectionInput[];
  layers: DrivewayGravelLayerInput[];
  truckCapacityTons: number;
  delivery: number;
  taxPct: number;
  geotextile?: DrivewayGeotextileInput;
  edging?: DrivewayEdgingInput;
}

export interface DrivewayGravelLayerResult {
  id: string;
  label: string;
  supplyMode: SupplyMode;
  installedYd3: number;
  installedM3: number;
  orderYd3: number;
  orderM3: number;
  densityTonYd3: number;
  tons: number;
  pounds: number;
  kilograms: number;
  supplierOrderTons: number;
  supplierOrderYd3: number;
  supplierRoundingOverageTons: number;
  bags: number;
  bagWeightLb: number;
  materialCost: number;
  truckLoads: number;
  finalLoadTons: number;
  finalLoadUtilizationPct: number;
}

export interface DrivewayGeotextileResult {
  enabled: boolean;
  requiredAreaFt2: number;
  requiredAreaM2: number;
  rollAreaFt2: number;
  rolls: number;
  cost: number;
}

export interface DrivewayEdgingResult {
  enabled: boolean;
  lengthFt: number;
  lengthM: number;
  cost: number;
}

export interface DrivewayGravelResult {
  areaFt2: number;
  areaM2: number;
  installedYd3: number;
  installedM3: number;
  orderYd3: number;
  orderM3: number;
  tons: number;
  pounds: number;
  kilograms: number;
  tonnes: number;
  supplierOrderTons: number;
  supplierOrderYd3: number;
  supplierRoundingOverageTons: number;
  layerMaterialCost: number;
  ancillaryCost: number;
  materialCost: number;
  tax: number;
  delivery: number;
  totalCost: number;
  truckLoads: number;
  layers: DrivewayGravelLayerResult[];
  geotextile: DrivewayGeotextileResult;
  edging: DrivewayEdgingResult;
}

const YD3_TO_M3 = 0.764554857984;
const FT2_TO_M2 = 0.09290304;
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
  if (unit === 'm2') return value / FT2_TO_M2;
  throw new Error('Unsupported area unit');
}

export function densityToTonYd3(value: number, unit: DensityUnit): number {
  if (unit === 'ton/yd3') return value;
  if (unit === 'lb/ft3') return value * 27 / 2000;
  if (unit === 'kg/m3') return value * YD3_TO_M3 / KG_PER_SHORT_TON;
  throw new Error('Unsupported density unit');
}

export function roundSupplierTons(requiredTons: number, incrementTons = 0, minimumTons = 0): number {
  let order = requiredTons;
  if (incrementTons > 0) order = Math.ceil(order / incrementTons - 1e-12) * incrementTons;
  if (minimumTons > 0) order = Math.max(order, minimumTons);
  return order;
}

function calculateFootprintArea(input: DrivewayGravelInput): number {
  const enabledSections = (input.sections ?? []).filter(section => section.enabled);
  if (enabledSections.length === 0) {
    if (!(input.lengthFt > 0) || !(input.widthFt > 0)) {
      throw new Error('Driveway length and width must be greater than zero.');
    }
    return input.lengthFt * input.widthFt + (input.extraAreaFt2 ?? 0);
  }

  let area = 0;
  for (const section of enabledSections) {
    if (!(section.lengthFt > 0) || !(section.widthFt > 0)) {
      throw new Error(`${section.label} length and width must be greater than zero.`);
    }
    const sectionArea = section.lengthFt * section.widthFt;
    area += (section.operation ?? 'add') === 'subtract' ? -sectionArea : sectionArea;
  }
  area += input.extraAreaFt2 ?? 0;
  if (!(area > 0)) throw new Error('The combined driveway footprint must be greater than zero.');
  return area;
}

function emptyGeotextile(): DrivewayGeotextileResult {
  return { enabled: false, requiredAreaFt2: 0, requiredAreaM2: 0, rollAreaFt2: 0, rolls: 0, cost: 0 };
}

function emptyEdging(): DrivewayEdgingResult {
  return { enabled: false, lengthFt: 0, lengthM: 0, cost: 0 };
}

export function calculateDrivewayGravel(input: DrivewayGravelInput): DrivewayGravelResult {
  if ((input.extraAreaFt2 ?? 0) < 0) throw new Error('Additional area cannot be negative.');
  if (!(input.truckCapacityTons > 0)) throw new Error('Truck payload capacity must be greater than zero.');
  if (input.taxPct < 0 || input.delivery < 0) throw new Error('Cost inputs cannot be negative.');

  const areaFt2 = calculateFootprintArea(input);
  const areaM2 = areaFt2 * FT2_TO_M2;
  const layers: DrivewayGravelLayerResult[] = [];

  for (const layer of input.layers) {
    if (!layer.enabled || layer.depthFt <= 0) continue;
    if (!(layer.densityValue > 0)) throw new Error(`${layer.label} density must be greater than zero.`);
    if (layer.compactionPct < 0 || layer.wastePct < 0 || layer.price < 0) {
      throw new Error(`${layer.label} allowances and price cannot be negative.`);
    }

    const supplyMode: SupplyMode = layer.supplyMode ?? 'bulk';
    const densityTonYd3 = densityToTonYd3(layer.densityValue, layer.densityUnit);
    const installedYd3 = areaFt2 * layer.depthFt / 27;
    const installedM3 = installedYd3 * YD3_TO_M3;
    const looseBeforeWasteYd3 = installedYd3 * (1 + layer.compactionPct / 100);
    const orderYd3 = looseBeforeWasteYd3 * (1 + layer.wastePct / 100);
    const orderM3 = orderYd3 * YD3_TO_M3;
    const tons = orderYd3 * densityTonYd3;
    const pounds = tons * 2000;
    const kilograms = pounds * 0.45359237;

    let supplierOrderTons = tons;
    let supplierOrderYd3 = orderYd3;
    let supplierRoundingOverageTons = 0;
    let bags = 0;
    let bagWeightLb = 0;
    let materialCost = 0;
    let truckLoads = 0;
    let finalLoadTons = 0;
    let finalLoadUtilizationPct = 0;

    if (supplyMode === 'bags') {
      bagWeightLb = layer.bagWeightLb ?? 50;
      if (!(bagWeightLb > 0)) throw new Error(`${layer.label} bag weight must be greater than zero.`);
      if ((layer.bagPrice ?? 0) < 0) throw new Error(`${layer.label} bag price cannot be negative.`);
      bags = Math.ceil(pounds / bagWeightLb);
      supplierOrderTons = bags * bagWeightLb / 2000;
      supplierOrderYd3 = supplierOrderTons / densityTonYd3;
      supplierRoundingOverageTons = Math.max(0, supplierOrderTons - tons);
      materialCost = bags * (layer.bagPrice ?? 0);
    } else {
      const incrementTons = Math.max(0, layer.supplierIncrementTons ?? 0);
      const minimumTons = Math.max(0, layer.supplierMinimumTons ?? 0);
      supplierOrderTons = roundSupplierTons(tons, incrementTons, minimumTons);
      supplierOrderYd3 = supplierOrderTons / densityTonYd3;
      supplierRoundingOverageTons = Math.max(0, supplierOrderTons - tons);
      materialCost = layer.priceBasis === 'yd3' ? supplierOrderYd3 * layer.price : supplierOrderTons * layer.price;
      truckLoads = Math.ceil(supplierOrderTons / input.truckCapacityTons);
      finalLoadTons = truckLoads > 0 ? supplierOrderTons - (truckLoads - 1) * input.truckCapacityTons : 0;
      finalLoadUtilizationPct = truckLoads > 0 ? finalLoadTons / input.truckCapacityTons * 100 : 0;
    }

    layers.push({
      id: layer.id,
      label: layer.label,
      supplyMode,
      installedYd3,
      installedM3,
      orderYd3,
      orderM3,
      densityTonYd3,
      tons,
      pounds,
      kilograms,
      supplierOrderTons,
      supplierOrderYd3,
      supplierRoundingOverageTons,
      bags,
      bagWeightLb,
      materialCost,
      truckLoads,
      finalLoadTons,
      finalLoadUtilizationPct,
    });
  }

  if (layers.length === 0) throw new Error('Enter a depth greater than zero for at least one driveway layer.');

  let geotextile = emptyGeotextile();
  if (input.geotextile?.enabled) {
    const overlapPct = input.geotextile.overlapPct;
    const rollWidthFt = input.geotextile.rollWidthFt;
    const rollLengthFt = input.geotextile.rollLengthFt;
    const pricePerRoll = input.geotextile.pricePerRoll;
    if (overlapPct < 0 || !(rollWidthFt > 0) || !(rollLengthFt > 0) || pricePerRoll < 0) {
      throw new Error('Check geotextile overlap, roll size and price.');
    }
    const requiredAreaFt2 = areaFt2 * (1 + overlapPct / 100);
    const rollAreaFt2 = rollWidthFt * rollLengthFt;
    const rolls = Math.ceil(requiredAreaFt2 / rollAreaFt2);
    geotextile = {
      enabled: true,
      requiredAreaFt2,
      requiredAreaM2: requiredAreaFt2 * FT2_TO_M2,
      rollAreaFt2,
      rolls,
      cost: rolls * pricePerRoll,
    };
  }

  let edging = emptyEdging();
  if (input.edging?.enabled) {
    if (!(input.edging.lengthFt > 0) || input.edging.pricePerFt < 0) {
      throw new Error('Check edging length and price.');
    }
    edging = {
      enabled: true,
      lengthFt: input.edging.lengthFt,
      lengthM: input.edging.lengthFt * 0.3048,
      cost: input.edging.lengthFt * input.edging.pricePerFt,
    };
  }

  const installedYd3 = layers.reduce((sum, layer) => sum + layer.installedYd3, 0);
  const installedM3 = installedYd3 * YD3_TO_M3;
  const orderYd3 = layers.reduce((sum, layer) => sum + layer.orderYd3, 0);
  const orderM3 = orderYd3 * YD3_TO_M3;
  const tons = layers.reduce((sum, layer) => sum + layer.tons, 0);
  const supplierOrderTons = layers.reduce((sum, layer) => sum + layer.supplierOrderTons, 0);
  const supplierOrderYd3 = layers.reduce((sum, layer) => sum + layer.supplierOrderYd3, 0);
  const supplierRoundingOverageTons = layers.reduce((sum, layer) => sum + layer.supplierRoundingOverageTons, 0);
  const pounds = tons * 2000;
  const kilograms = pounds * 0.45359237;
  const tonnes = kilograms / 1000;
  const layerMaterialCost = layers.reduce((sum, layer) => sum + layer.materialCost, 0);
  const ancillaryCost = geotextile.cost + edging.cost;
  const materialCost = layerMaterialCost + ancillaryCost;
  const tax = materialCost * input.taxPct / 100;
  const totalCost = materialCost + tax + input.delivery;
  const truckLoads = layers.reduce((sum, layer) => sum + layer.truckLoads, 0);

  return {
    areaFt2,
    areaM2,
    installedYd3,
    installedM3,
    orderYd3,
    orderM3,
    tons,
    pounds,
    kilograms,
    tonnes,
    supplierOrderTons,
    supplierOrderYd3,
    supplierRoundingOverageTons,
    layerMaterialCost,
    ancillaryCost,
    materialCost,
    tax,
    delivery: input.delivery,
    totalCost,
    truckLoads,
    layers,
    geotextile,
    edging,
  };
}
