import type { GameState, MarketType } from './types';
import { MarketType as Markets, OrderSide } from './types';

export interface RevenueAttributionRow {
  key: 'spot' | 'da' | 'id' | 'bm';
  label: string;
  revenue: number;
  cost: number;
  net: number;
  mw: number;
}

const MARKET_TO_KEY: Record<MarketType, RevenueAttributionRow['key']> = {
  [Markets.SPOT]: 'spot',
  [Markets.DAY_AHEAD]: 'da',
  [Markets.INTRADAY]: 'id',
  [Markets.BM]: 'bm',
};

const LABELS: Record<RevenueAttributionRow['key'], string> = {
  spot: 'Physical / Spot',
  da: 'Day-ahead',
  id: 'Intraday',
  bm: 'Balancing Mechanism',
};

export function getRevenueAttribution(state: GameState): RevenueAttributionRow[] {
  const rows: Record<RevenueAttributionRow['key'], RevenueAttributionRow> = {
    spot: { key: 'spot', label: LABELS.spot, revenue: 0, cost: 0, net: 0, mw: 0 },
    da: { key: 'da', label: LABELS.da, revenue: 0, cost: 0, net: 0, mw: 0 },
    id: { key: 'id', label: LABELS.id, revenue: 0, cost: 0, net: 0, mw: 0 },
    bm: { key: 'bm', label: LABELS.bm, revenue: 0, cost: 0, net: 0, mw: 0 },
  };

  for (const trade of state.trades) {
    const key = MARKET_TO_KEY[trade.marketType] ?? 'spot';
    const cashflow = trade.volumeMw * 0.5 * trade.price;
    rows[key].mw += trade.volumeMw;
    if (trade.side === OrderSide.SELL) rows[key].revenue += cashflow;
    else rows[key].cost += cashflow;
  }

  for (const position of state.dayAhead.playerSchedule) {
    if (!position.delivered) continue;
    const row = rows[position.market];
    if (!row) continue;
    const cashflow = position.mw * 0.5 * position.price;
    row.mw += position.mw;
    if (position.action === 'discharge') row.revenue += cashflow;
    else row.cost += cashflow;
  }

  return Object.values(rows).map(row => ({
    ...row,
    revenue: Math.round(row.revenue * 100) / 100,
    cost: Math.round(row.cost * 100) / 100,
    net: Math.round((row.revenue - row.cost) * 100) / 100,
    mw: Math.round(row.mw * 100) / 100,
  }));
}

export function getDominantRevenueStream(state: GameState): string {
  const rows = getRevenueAttribution(state);
  const best = rows.reduce((max, row) => row.net > max.net ? row : max, rows[0]);
  if (!best || best.net === 0) return 'No dominant revenue stream yet.';
  return `${best.label} is currently the largest contributor at £${best.net.toFixed(2)} net.`;
}
