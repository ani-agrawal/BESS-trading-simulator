import type { GameState } from './types';
import { getRevenueSummary } from './battery';

export interface BenchmarkRow {
  label: string;
  pnl: number;
  explanation: string;
}

function fullCycleBenchmark(prices: number[], powerMw: number, efficiency: number): number {
  if (prices.length < 2) return 0;
  const sorted = prices.map((price, period) => ({ price, period })).sort((a, b) => a.price - b.price);
  const charge = sorted[0];
  const discharge = [...sorted].reverse().find(item => item.period > charge.period) ?? sorted[sorted.length - 1];
  const mwh = powerMw * 0.5;
  return (discharge.price * mwh * efficiency) - (charge.price * mwh);
}

function naivePeakBenchmark(prices: number[], powerMw: number, efficiency: number): number {
  const chargePeriods = prices.slice(4, 9);
  const dischargePeriods = prices.slice(32, 37);
  const charge = chargePeriods.reduce((sum, price) => sum + price, 0) / Math.max(1, chargePeriods.length);
  const discharge = dischargePeriods.reduce((sum, price) => sum + price, 0) / Math.max(1, dischargePeriods.length);
  const mwh = powerMw * 0.5;
  return (discharge * mwh * efficiency) - (charge * mwh);
}

export function getBenchmarks(state: GameState): BenchmarkRow[] {
  const prices = state.dayAhead.revealedPeriods > 4
    ? state.dayAhead.sipOutturn.slice(0, state.dayAhead.revealedPeriods)
    : state.dayAhead.forecastPrices;
  const power = state.battery.config.powerRatingMw;
  const efficiency = state.battery.config.efficiencyPct / 100;
  const player = getRevenueSummary(state.battery).netProfit;
  const perfect = fullCycleBenchmark(prices, power, efficiency);
  const naive = naivePeakBenchmark(prices, power, efficiency);

  return [
    { label: 'Your realised P&L', pnl: player, explanation: 'Actual battery revenue minus cost from your actions.' },
    { label: 'No-trade baseline', pnl: 0, explanation: 'Doing nothing. Useful on flat or uncertain days.' },
    { label: 'Naive peak/trough', pnl: naive, explanation: 'Charge early morning, discharge evening peak.' },
    { label: 'Simple hindsight cycle', pnl: perfect, explanation: 'Best single low-to-high cycle using known prices.' },
  ].map(row => ({ ...row, pnl: Math.round(row.pnl * 100) / 100 }));
}
