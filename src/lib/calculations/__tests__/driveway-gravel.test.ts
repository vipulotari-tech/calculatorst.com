import { describe, expect, it } from 'vitest';
import { calculateDrivewayGravel, densityToTonYd3, lengthToFeet, roundSupplierTons } from '../driveway-gravel';

const baseInput = {
  truckCapacityTons: 20,
  delivery: 0,
  taxPct: 0,
};

describe('driveway gravel calculation', () => {
  it('keeps base and surface layers separate', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 50,
      widthFt: 12,
      layers: [
        { id:'base', label:'Base course', enabled:true, depthFt:4/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
        { id:'surface', label:'Surface course', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
      ],
      ...baseInput,
    });
    expect(res.layers).toHaveLength(2);
    expect(res.layers[0].installedYd3).toBeCloseTo(7.4074074074, 8);
    expect(res.layers[0].orderYd3).toBeCloseTo(8.1481481481, 8);
    expect(res.layers[0].tons).toBeCloseTo(11.4074074074, 8);
    expect(res.layers[1].installedYd3).toBeCloseTo(3.7037037037, 8);
    expect(res.tons).toBeCloseTo(17.1111111111, 8);
    expect(res.truckLoads).toBe(2);
    expect(res.layers.map(layer => layer.truckLoads)).toEqual([1, 1]);
  });

  it('applies compaction allowance and waste separately and once', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 30,
      widthFt: 10,
      layers: [
        { id:'base', label:'Base', enabled:true, depthFt:0.5, densityValue:1.5, densityUnit:'ton/yd3', compactionPct:20, wastePct:10, price:50, priceBasis:'ton' },
      ],
      truckCapacityTons:10,
      delivery:100,
      taxPct:5,
    });
    const installed = 30*10*0.5/27;
    const order = installed*1.2*1.1;
    const tons = order*1.5;
    expect(res.installedYd3).toBeCloseTo(installed, 8);
    expect(res.orderYd3).toBeCloseTo(order, 8);
    expect(res.tons).toBeCloseTo(tons, 8);
    expect(res.materialCost).toBeCloseTo(tons*50, 8);
    expect(res.totalCost).toBeCloseTo(tons*50*1.05+100, 8);
  });

  it('adds a measured extra area without repeating the whole driveway', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 40,
      widthFt: 12,
      extraAreaFt2:120,
      layers: [
        { id:'surface', label:'Surface', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton' },
      ],
      ...baseInput,
    });
    expect(res.areaFt2).toBe(600);
    expect(res.orderYd3).toBeCloseTo(600*(2/12)/27, 8);
  });

  it('supports L-shape subtraction and multiple added sections', () => {
    const layer = { id:'surface', label:'Surface', enabled:true, depthFt:3/12, densityValue:1.4, densityUnit:'ton/yd3' as const, compactionPct:0, wastePct:0, price:0, priceBasis:'ton' as const };
    const lShape = calculateDrivewayGravel({
      lengthFt:50,
      widthFt:20,
      sections:[
        { id:'primary', label:'Primary', enabled:true, lengthFt:50, widthFt:20, operation:'add' },
        { id:'cut', label:'Cutout', enabled:true, lengthFt:10, widthFt:5, operation:'subtract' },
      ],
      layers:[layer],
      ...baseInput,
    });
    expect(lShape.areaFt2).toBe(950);

    const multi = calculateDrivewayGravel({
      lengthFt:40,
      widthFt:10,
      sections:[
        { id:'primary', label:'Primary', enabled:true, lengthFt:40, widthFt:10, operation:'add' },
        { id:'s2', label:'Section 2', enabled:true, lengthFt:10, widthFt:10, operation:'add' },
        { id:'s3', label:'Section 3', enabled:true, lengthFt:20, widthFt:5, operation:'add' },
      ],
      layers:[layer],
      ...baseInput,
    });
    expect(multi.areaFt2).toBe(600);
  });

  it('supports metric density and output conversion fields', () => {
    expect(lengthToFeet(1,'m')).toBeCloseTo(3.280839895, 8);
    expect(densityToTonYd3(1600,'kg/m3')).toBeCloseTo(1.3484439484, 8);
    const res = calculateDrivewayGravel({
      lengthFt:10,
      widthFt:10,
      layers:[
        { id:'surface', label:'Surface', enabled:true, depthFt:0.25, densityValue:1600, densityUnit:'kg/m3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton' },
      ],
      ...baseInput,
    });
    expect(res.areaM2).toBeCloseTo(9.290304, 8);
    expect(res.installedM3).toBeCloseTo(res.installedYd3 * 0.764554857984, 8);
    expect(res.tonnes).toBeCloseTo(res.kilograms / 1000, 8);
  });

  it('rounds bulk supplier orders by increment and minimum before costing and hauling', () => {
    expect(roundSupplierTons(12.96, 2, 0)).toBe(14);
    expect(roundSupplierTons(12.96, 2, 15)).toBe(15);
    const res = calculateDrivewayGravel({
      lengthFt:100,
      widthFt:10,
      layers:[
        { id:'base', label:'Base', enabled:true, depthFt:3/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:50, priceBasis:'ton', supplierIncrementTons:2, supplierMinimumTons:15 },
      ],
      truckCapacityTons:10,
      delivery:0,
      taxPct:0,
    });
    const row = res.layers[0];
    expect(row.tons).toBeCloseTo(12.962962963, 8);
    expect(row.supplierOrderTons).toBe(15);
    expect(row.supplierRoundingOverageTons).toBeCloseTo(2.037037037, 8);
    expect(row.materialCost).toBe(750);
    expect(row.truckLoads).toBe(2);
    expect(row.finalLoadTons).toBe(5);
    expect(row.finalLoadUtilizationPct).toBe(50);
  });

  it('converts a bagged surface course to whole bags and removes bulk truck loads', () => {
    const res = calculateDrivewayGravel({
      lengthFt:10,
      widthFt:10,
      layers:[
        { id:'surface', label:'Surface', enabled:true, depthFt:1/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton', supplyMode:'bags', bagWeightLb:50, bagPrice:6 },
      ],
      ...baseInput,
    });
    const row = res.layers[0];
    expect(row.pounds).toBeCloseTo(864.197530864, 6);
    expect(row.bags).toBe(18);
    expect(row.supplierOrderTons).toBeCloseTo(0.45, 8);
    expect(row.materialCost).toBe(108);
    expect(row.truckLoads).toBe(0);
    expect(res.truckLoads).toBe(0);
  });

  it('calculates geotextile rolls and edging as BOM project extras', () => {
    const res = calculateDrivewayGravel({
      lengthFt:50,
      widthFt:12,
      layers:[
        { id:'surface', label:'Surface', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton' },
      ],
      geotextile:{ enabled:true, overlapPct:10, rollWidthFt:12, rollLengthFt:50, pricePerRoll:100 },
      edging:{ enabled:true, lengthFt:100, pricePerFt:5 },
      ...baseInput,
    });
    expect(res.geotextile.requiredAreaFt2).toBeCloseTo(660, 8);
    expect(res.geotextile.rolls).toBe(2);
    expect(res.geotextile.cost).toBe(200);
    expect(res.edging.lengthFt).toBe(100);
    expect(res.edging.cost).toBe(500);
    expect(res.ancillaryCost).toBe(700);
    expect(res.materialCost).toBe(700);
  });

  it('does not combine different bulk products into one partial truck load', () => {
    const res = calculateDrivewayGravel({
      lengthFt:50,
      widthFt:12,
      layers:[
        { id:'base', label:'Base', enabled:true, depthFt:4/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
        { id:'surface', label:'Surface', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
      ],
      ...baseInput,
    });
    expect(res.tons).toBeLessThan(20);
    expect(res.truckLoads).toBe(2);
    expect(res.layers.map(layer => layer.truckLoads)).toEqual([1,1]);
  });
});
