import type { HourlyPrice } from './types';
import { getHour, isWeekend } from './clock';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PriceGeneratorState {
  seed: number;
  ouState: number;
  windCapacity: number;
  tickCount: number;
}

export function createPriceGenerator(seed = 42): PriceGeneratorState {
  return { seed, ouState: 0, windCapacity: 0.25, tickCount: 0 };
}

// GB weekday electricity demand shape (£/MWh, approximating N2EX/EPEX UK)
function gbPriceShape(hour: number, weekend: boolean): number {
  const weekday: Record<number, number> = {
    0: 35, 1: 31, 2: 28, 3: 26, 4: 27, 5: 33,
    6: 45, 7: 58, 8: 65, 9: 60, 10: 56, 11: 54,
    12: 55, 13: 53, 14: 52, 15: 55, 16: 65, 17: 80,
    18: 82, 19: 68, 20: 55, 21: 46, 22: 40, 23: 37,
  };
  const base = weekday[hour] ?? 45;
  return weekend ? base * 0.78 : base;
}

// GB wind generation
function windGeneration(capacity: number): number {
  return capacity * 28; // ~28 GW installed UK wind capacity
}

function solarOutput(hour: number): number {
  if (hour < 6 || hour > 20) return 0;
  const peak = 13;
  const sigma = 3.5;
  const x = (hour - peak) / sigma;
  return 14 * Math.exp(-0.5 * x * x); // ~14 GW UK solar
}

// GB demand (GW)
function gbDemand(hour: number, weekend: boolean): number {
  const weekday: Record<number, number> = {
    0: 28, 1: 26, 2: 24, 3: 23, 4: 23, 5: 25,
    6: 30, 7: 36, 8: 40, 9: 42, 10: 42, 11: 43,
    12: 42, 13: 41, 14: 40, 15: 41, 16: 43, 17: 46,
    18: 45, 19: 42, 20: 39, 21: 36, 22: 33, 23: 30,
  };
  const base = weekday[hour] ?? 35;
  return weekend ? base * 0.85 : base;
}

export function generateNextHour(
  state: PriceGeneratorState,
  currentTime: number,
): { price: HourlyPrice; newState: PriceGeneratorState } {
  const rng = mulberry32(state.seed + state.tickCount * 7919);
  const hour = getHour(currentTime);
  const weekend = isWeekend(currentTime);

  const demand = gbDemand(hour, weekend);

  // Wind random walk with mean reversion
  const windDelta = (rng() - 0.5) * 0.08;
  const meanRev = (0.25 - state.windCapacity) * 0.05;
  let newWind = state.windCapacity + windDelta + meanRev;
  newWind = Math.max(0.02, Math.min(0.95, newWind));
  const wind = windGeneration(newWind);
  const solar = solarOutput(hour);
  const totalRenewable = wind + solar;
  const renewablePct = Math.min(totalRenewable / demand, 1.0);

  // Base price from shape
  const basePrice = gbPriceShape(hour, weekend);

  // Wind depression effect
  const windEffect = -(newWind - 0.25) * 30;

  // Ornstein-Uhlenbeck noise
  const theta = 0.15;
  const sigma = 5;
  const normalRand = Math.sqrt(-2 * Math.log(Math.max(0.001, rng()))) * Math.cos(2 * Math.PI * rng());
  const newOuState = state.ouState + theta * (0 - state.ouState) + sigma * normalRand;

  // Demand shock
  let demandShock = 0;
  if (rng() < 0.015) {
    demandShock = (rng() > 0.5 ? 1 : -1) * (15 + rng() * 40);
  }

  let price = basePrice + windEffect + newOuState + demandShock;

  // Allow negative prices during very high renewables
  if (renewablePct > 0.7 && price > 0) {
    price = price * (1 - (renewablePct - 0.7) * 3);
  }

  price = Math.round(price * 100) / 100;

  const hourlyPrice: HourlyPrice = {
    timestamp: currentTime,
    price,
    demandMw: demand * 1000,
    renewablePct: Math.round(renewablePct * 100) / 100,
    basePrice: Math.round(basePrice * 100) / 100,
    eventImpact: Math.round(demandShock * 100) / 100,
  };

  return {
    price: hourlyPrice,
    newState: {
      seed: state.seed,
      ouState: newOuState,
      windCapacity: newWind,
      tickCount: state.tickCount + 1,
    },
  };
}

export function generateDayAheadForecast(
  state: PriceGeneratorState,
  deliveryDayStart: number,
): HourlyPrice[] {
  const HOUR_MS = 3600_000;
  let tempState = { ...state };
  const prices: HourlyPrice[] = [];
  for (let h = 0; h < 24; h++) {
    const time = deliveryDayStart + h * HOUR_MS;
    const { price, newState } = generateNextHour(tempState, time);
    prices.push(price);
    tempState = newState;
  }
  return prices;
}
