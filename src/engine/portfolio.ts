import type { Trade, Position } from './types';
import { OrderSide, MarketType } from './types';

interface PositionEntry {
  key: string;
  volumeMw: number;
  totalCost: number;
  marketType: MarketType;
}

export function calculatePositions(trades: Trade[]): PositionEntry[] {
  const posMap = new Map<string, PositionEntry>();

  for (const trade of trades) {
    const key = `${trade.marketType}-${trade.timestamp}`;
    const existing = posMap.get(key);

    const signedVolume = trade.side === OrderSide.BUY ? trade.volumeMw : -trade.volumeMw;
    const cost = trade.price * trade.volumeMw * 0.5 * (trade.side === OrderSide.BUY ? 1 : -1);

    if (existing) {
      existing.volumeMw += signedVolume;
      existing.totalCost += cost;
    } else {
      posMap.set(key, {
        key,
        volumeMw: signedVolume,
        totalCost: cost,
        marketType: trade.marketType,
      });
    }
  }

  return Array.from(posMap.values()).filter(p => Math.abs(p.volumeMw) > 0.001);
}

export function getNetPosition(trades: Trade[]): number {
  let net = 0;
  for (const trade of trades) {
    net += trade.side === OrderSide.BUY ? trade.volumeMw : -trade.volumeMw;
  }
  return net;
}

export function calculateRealizedPnl(trades: Trade[]): number {
  let pnl = 0;
  for (const trade of trades) {
    if (trade.side === OrderSide.SELL) {
      pnl += trade.price * trade.volumeMw * 0.5;
    } else {
      pnl -= trade.price * trade.volumeMw * 0.5;
    }
  }
  return Math.round(pnl * 100) / 100;
}

export function calculateUnrealizedPnl(trades: Trade[], currentPrice: number): number {
  const netPosition = getNetPosition(trades);
  if (Math.abs(netPosition) < 0.001) return 0;

  // Average entry price
  let totalCost = 0;
  for (const trade of trades) {
    if (trade.side === OrderSide.BUY) {
      totalCost += trade.price * trade.volumeMw * 0.5;
    } else {
      totalCost -= trade.price * trade.volumeMw * 0.5;
    }
  }

  // Unrealized = current mark-to-market of remaining position
  return Math.round(netPosition * currentPrice * 0.5 * 100) / 100 + Math.round(totalCost * 100) / 100 * -1;
}

export function calculateCash(initialCash: number, trades: Trade[]): number {
  let cash = initialCash;
  for (const trade of trades) {
    if (trade.side === OrderSide.BUY) {
      cash -= trade.price * trade.volumeMw * 0.5;
    } else {
      cash += trade.price * trade.volumeMw * 0.5;
    }
  }
  return Math.round(cash * 100) / 100;
}

export function getPositionSummary(
  trades: Trade[],
  currentPrice: number,
): Position[] {
  const net = getNetPosition(trades);
  if (Math.abs(net) < 0.001) return [];

  // Group by market type
  const byMarket = new Map<MarketType, Trade[]>();
  for (const t of trades) {
    const arr = byMarket.get(t.marketType) ?? [];
    arr.push(t);
    byMarket.set(t.marketType, arr);
  }

  const positions: Position[] = [];
  for (const [mkt, mktTrades] of byMarket) {
    const vol = getNetPosition(mktTrades);
    if (Math.abs(vol) < 0.001) continue;

    // Weighted average entry price for remaining position
    let weightedCost = 0;
    let absVol = 0;
    for (const t of mktTrades) {
      if ((vol > 0 && t.side === OrderSide.BUY) || (vol < 0 && t.side === OrderSide.SELL)) {
        weightedCost += t.price * t.volumeMw * 0.5;
        absVol += t.volumeMw;
      }
    }
    const avgEntry = absVol > 0 ? weightedCost / (absVol * 0.5) : 0;
    const unrealized = vol * (currentPrice - avgEntry);

    positions.push({
      hourLabel: mkt === MarketType.SPOT ? 'Spot' : 'Day-Ahead',
      volumeMw: Math.round(vol * 100) / 100,
      avgEntryPrice: Math.round(avgEntry * 100) / 100,
      marketType: mkt,
      currentPrice,
      unrealizedPnl: Math.round(unrealized * 100) / 100,
    });
  }

  return positions;
}
