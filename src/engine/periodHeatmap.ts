import type { GameState } from './types';
import { getSettlementPeriod } from './clock';

export interface PeriodHeatmapCell {
  period: number;
  label: string;
  price: number;
  band: 'cheap' | 'mid' | 'expensive';
  traded: boolean;
  settled: boolean;
  current: boolean;
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * pct)))];
}

function spLabel(period: number): string {
  const hour = Math.floor(period / 2);
  return `${String(hour).padStart(2, '0')}:${period % 2 === 0 ? '00' : '30'}`;
}

export function getPeriodHeatmap(state: GameState): PeriodHeatmapCell[] {
  const prices = state.dayAhead.forecastPrices;
  const low = percentile(prices, 0.25);
  const high = percentile(prices, 0.75);
  const currentPeriod = Math.max(0, getSettlementPeriod(state.clock.currentTime) - 1);
  const tradedPeriods = new Set(state.dayAhead.playerSchedule.map(position => position.period));

  return prices.map((price, period) => ({
    period,
    label: spLabel(period),
    price,
    band: price <= low ? 'cheap' : price >= high ? 'expensive' : 'mid',
    traded: tradedPeriods.has(period),
    settled: period < state.dayAhead.revealedPeriods,
    current: period === currentPeriod,
  }));
}
