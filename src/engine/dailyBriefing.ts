import type { GameState } from './types';

export interface DailyBriefing {
  regime: string;
  risk: 'low' | 'medium' | 'high';
  headline: string;
  watch: string[];
  firstAction: string;
}

function percentileRank(values: number[], value: number): number {
  if (values.length === 0) return 0.5;
  const below = values.filter(item => item <= value).length;
  return below / values.length;
}

export function getDailyBriefing(state: GameState): DailyBriefing {
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const current = state.currentPrice?.price ?? prices[0] ?? 50;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min;
  const avg = prices.reduce((sum, price) => sum + price, 0) / Math.max(1, prices.length);
  const rank = percentileRank(prices, current);
  const biggestNiv = Math.max(...state.dayAhead.niv.map(value => Math.abs(value)), 0);
  const negativePeriods = prices.filter(price => price < 0).length;
  const peakPeriods = prices.filter(price => price > avg + 25).length;

  let regime = 'Normal trading day';
  if (negativePeriods >= 3) regime = 'High-renewables / negative-price day';
  else if (spread >= 90 || peakPeriods >= 4) regime = 'Scarcity / spike-risk day';
  else if (spread < 25) regime = 'Flat-spread day';
  else if (biggestNiv > 250) regime = 'Imbalance-risk day';

  const risk: DailyBriefing['risk'] = spread >= 90 || biggestNiv > 300
    ? 'high'
    : spread < 25
      ? 'medium'
      : 'low';

  const watch = [
    `DA range: £${min.toFixed(2)} to £${max.toFixed(2)}/MWh.`,
    `Current price is in the ${(rank * 100).toFixed(0)}th percentile of today's forecast.`,
    state.battery.socPct > 80
      ? 'SoC is high: protect discharge optionality.'
      : state.battery.socPct < 20
        ? 'SoC is low: look for cheap refill periods.'
        : 'SoC is flexible: you can still choose either direction.',
  ];

  if (negativePeriods > 0) watch.push(`${negativePeriods} negative-price period(s): charging can be valuable.`);
  if (biggestNiv > 250) watch.push('Large NIV moves expected: review imbalance risk after delivery.');

  let firstAction = 'Wait for a clear relative low/high before dispatching.';
  if (rank <= 0.25 && state.battery.socPct < 90) firstAction = 'First action: consider charging, but only if enough spread remains later.';
  if (rank >= 0.75 && state.battery.socPct > 10) firstAction = 'First action: consider discharging, but keep enough SoC for later spikes.';
  if (spread < 25) firstAction = 'First action: avoid forcing trades; flat days punish overtrading.';
  if (negativePeriods >= 3 && state.battery.socPct < 90) firstAction = 'First action: preserve headroom for negative-price charging.';

  return {
    regime,
    risk,
    headline: `${regime}. Forecast spread is £${spread.toFixed(2)}/MWh.`,
    watch: watch.slice(0, 4),
    firstAction,
  };
}
