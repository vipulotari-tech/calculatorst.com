import { describe, expect, it } from 'vitest';
import { calculateDrivewayGravel, densityToTonYd3, lengthToFeet } from '../driveway-gravel';

describe('driveway gravel calculation', () => {
  it('keeps base and surface layers separate', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 50,
      widthFt: 12,
      layers: [
        { id:'base', label:'Base course', enabled:true, depthFt:4/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
        { id:'surface', label:'Surface course', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
      ],
      truckCapacityTons:20,
      delivery:0,
      taxPct:0,
    });
    expect(res.layers).toHaveLength(2);
    expect(res.layers[0].installedYd3).toBeCloseTo(7.4074074074, 8);
    expect(res.layers[0].orderYd3).toBeCloseTo(8.1481481481, 8);
    expect(res.layers[0].tons).toBeCloseTo(11.4074074074, 8);
    expect(res.layers[1].installedYd3).toBeCloseTo(3.7037037037, 8);
    expect(res.tons).toBeCloseTo(17.1111111111, 8);
    expect(res.truckLoads).toBe(2);
    expect(res.layers[0].truckLoads).toBe(1);
    expect(res.layers[1].truckLoads).toBe(1);
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

  it('adds apron area without repeating the whole driveway', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 40,
      widthFt: 12,
      extraAreaFt2:120,
      layers: [
        { id:'surface', label:'Surface', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton' },
      ],
      truckCapacityTons:20,
      delivery:0,
      taxPct:0,
    });
    expect(res.areaFt2).toBe(600);
    expect(res.orderYd3).toBeCloseTo(600*(2/12)/27, 8);
  });

  it('supports metric density and length conversions', () => {
    expect(lengthToFeet(1,'m')).toBeCloseTo(3.280839895, 8);
    expect(densityToTonYd3(1600,'kg/m3')).toBeCloseTo(1.3484439484, 8);
  });

  it('does not combine different material layers into one partial truck load', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 50,
      widthFt: 12,
      layers: [
        { id:'base', label:'Base', enabled:true, depthFt:4/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
        { id:'surface', label:'Surface', enabled:true, depthFt:2/12, densityValue:1.4, densityUnit:'ton/yd3', compactionPct:0, wastePct:10, price:0, priceBasis:'ton' },
      ],
      truckCapacityTons:20,
      delivery:0,
      taxPct:0,
    });
    expect(res.tons).toBeLessThan(20);
    expect(res.truckLoads).toBe(2);
    expect(res.layers.map(layer => layer.truckLoads)).toEqual([1,1]);
  });

  it('reports final truck load utilization', () => {
    const res = calculateDrivewayGravel({
      lengthFt: 100,
      widthFt: 12,
      layers: [
        { id:'base', label:'Base', enabled:true, depthFt:4/12, densityValue:1.5, densityUnit:'ton/yd3', compactionPct:0, wastePct:0, price:0, priceBasis:'ton' },
      ],
      truckCapacityTons:10,
      delivery:0,
      taxPct:0,
    });
    expect(res.tons).toBeCloseTo(22.2222222222, 8);
    expect(res.truckLoads).toBe(3);
    expect(res.finalLoadTons).toBeCloseTo(2.2222222222, 8);
    expect(res.finalLoadUtilizationPct).toBeCloseTo(22.2222222222, 8);
  });
});
