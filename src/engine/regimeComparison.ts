import type { GameState } from './types';
import { HISTORICAL_DAYS } from '../data/historicalDays';

export interface RegimeComparisonRow {
  title: string;
  spread: number;
  maxPrice: number;
  windPct: number;
  optimalRevenue: number;
  similarity: number;
}

export interface RegimeComparison {
  today: {
    spread: number;
    maxPrice: number;
    windPct: number;
  };
  closest: RegimeComparisonRow[];
}

function spread(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

export function getRegimeComparison(state: GameState): RegimeComparison {
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const today = {
    spread: spread(prices),
    maxPrice: Math.max(...prices),
    windPct: state.currentPrice?.renewablePct ?? 0.25,
  };

  const closest = HISTORICAL_DAYS.map(day => {
    const daySpread = spread(day.daPrices);
    const dayMax = Math.max(...day.daPrices);
    const distance =
      Math.abs(today.spread - daySpread) / 150 +
      Math.abs(today.maxPrice - dayMax) / 250 +
      Math.abs(today.windPct - day.windPct);
    const similarity = Math.max(0, Math.round((1 - Math.min(1, distance / 3)) * 100));
    return {
      title: day.title,
      spread: daySpread,
      maxPrice: dayMax,
      windPct: day.windPct,
      optimalRevenue: day.optimalRevenue,
      similarity,
    };
  }).sort((a, b) => b.similarity - a.similarity).slice(0, 4);

  return { today, closest };
}
