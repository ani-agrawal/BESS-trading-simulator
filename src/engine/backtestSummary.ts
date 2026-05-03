import { HISTORICAL_DAYS } from '../data/historicalDays';

export interface BacktestRow {
  scenario: string;
  difficulty: string;
  spread: number;
  naivePnl: number;
  hindsightPnl: number;
  bestUse: string;
}

function simpleCycle(prices: number[], powerMw = 50, efficiency = 0.9): number {
  const sorted = prices.map((price, period) => ({ price, period })).sort((a, b) => a.price - b.price);
  const charge = sorted[0];
  const discharge = [...sorted].reverse().find(item => item.period > charge.period) ?? sorted[sorted.length - 1];
  const mwh = powerMw * 0.5;
  return (discharge.price * mwh * efficiency) - (charge.price * mwh);
}

function naivePeak(prices: number[], powerMw = 50, efficiency = 0.9): number {
  const charge = prices.slice(4, 9).reduce((sum, price) => sum + price, 0) / 5;
  const discharge = prices.slice(32, 37).reduce((sum, price) => sum + price, 0) / 5;
  const mwh = powerMw * 0.5;
  return (discharge * mwh * efficiency) - (charge * mwh);
}

export function getBacktestSummary(): BacktestRow[] {
  return HISTORICAL_DAYS.map(day => {
    const min = Math.min(...day.sipPrices);
    const max = Math.max(...day.sipPrices);
    const spread = max - min;
    let bestUse = 'Arbitrage';
    if (spread < 35) bestUse = 'Reserve / wait';
    if (max > 200) bestUse = 'Scarcity / BM optionality';
    if (min < 0) bestUse = 'Negative-price charging';

    return {
      scenario: day.title,
      difficulty: day.difficulty,
      spread: Math.round(spread * 100) / 100,
      naivePnl: Math.round(naivePeak(day.sipPrices) * 100) / 100,
      hindsightPnl: Math.round(simpleCycle(day.sipPrices) * 100) / 100,
      bestUse,
    };
  });
}
