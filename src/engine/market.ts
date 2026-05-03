import type { Order, Trade, DayAheadBid, AuctionResult } from './types';
import { OrderSide, OrderType, OrderStatus, MarketType } from './types';

let orderIdCounter = 0;

export function createOrder(
  side: OrderSide,
  orderType: OrderType,
  volumeMw: number,
  priceLimit: number | null,
  targetHour: number,
  currentTime: number,
  marketType: MarketType = MarketType.SPOT,
): Order {
  orderIdCounter++;
  return {
    id: `ord-${orderIdCounter}-${Date.now()}`,
    marketType,
    side,
    orderType,
    volumeMw,
    priceLimit,
    targetHour,
    createdAt: currentTime,
    status: OrderStatus.PENDING,
    filledPrice: null,
    filledVolume: 0,
  };
}

export function executeMarketOrder(
  order: Order,
  currentPrice: number,
  slippage = 0.5,
): { order: Order; trade: Trade } | null {
  if (order.orderType !== OrderType.MARKET) return null;

  const executionPrice = order.side === OrderSide.BUY
    ? currentPrice + slippage
    : currentPrice - slippage;

  const filledOrder: Order = {
    ...order,
    status: OrderStatus.FILLED,
    filledPrice: Math.round(executionPrice * 100) / 100,
    filledVolume: order.volumeMw,
  };

  const trade: Trade = {
    orderId: order.id,
    side: order.side,
    volumeMw: order.volumeMw,
    price: filledOrder.filledPrice!,
    timestamp: order.createdAt,
    marketType: order.marketType,
  };

  return { order: filledOrder, trade };
}

export function checkLimitOrder(
  order: Order,
  currentPrice: number,
): { order: Order; trade: Trade } | null {
  if (order.orderType !== OrderType.LIMIT || order.status !== OrderStatus.PENDING) return null;
  if (order.priceLimit === null) return null;

  const shouldFill =
    (order.side === OrderSide.BUY && currentPrice <= order.priceLimit) ||
    (order.side === OrderSide.SELL && currentPrice >= order.priceLimit);

  if (!shouldFill) return null;

  const filledOrder: Order = {
    ...order,
    status: OrderStatus.FILLED,
    filledPrice: order.priceLimit,
    filledVolume: order.volumeMw,
  };

  const trade: Trade = {
    orderId: order.id,
    side: order.side,
    volumeMw: order.volumeMw,
    price: order.priceLimit,
    timestamp: Date.now(),
    marketType: order.marketType,
  };

  return { order: filledOrder, trade };
}

export function expireOrders(orders: Order[], currentTime: number): Order[] {
  return orders.map(o => {
    if (o.status === OrderStatus.PENDING && o.targetHour < currentTime) {
      return { ...o, status: OrderStatus.EXPIRED };
    }
    return o;
  });
}

// Day-ahead auction clearing
// Generates synthetic AI participants and clears against player bids
export function clearDayAheadAuction(
  playerBids: DayAheadBid[],
  forecastPrices: number[],
  seed: number,
): AuctionResult[] {
  const results: AuctionResult[] = [];

  for (let period = 0; period < 48; period++) {
    const forecast = forecastPrices[period];
    if (forecast === undefined) {
      results.push({
        period,
        clearingPrice: 0,
        playerVolume: 0,
        accepted: false,
      });
      continue;
    }

    // Synthetic clearing price: forecast +/- noise
    const noise = Math.sin((seed + period) * 7919) * 5;
    const clearingPrice = Math.round((forecast + noise) * 100) / 100;

    // Check player bids for this settlement period
    const periodBids = playerBids.filter(b => b.period === period);
    let playerVolume = 0;

    for (const bid of periodBids) {
      if (bid.side === OrderSide.BUY && bid.price >= clearingPrice) {
        playerVolume += bid.volumeMw;
      } else if (bid.side === OrderSide.SELL && bid.price <= clearingPrice) {
        playerVolume -= bid.volumeMw;
      }
    }

    results.push({
      period,
      clearingPrice,
      playerVolume,
      accepted: playerVolume !== 0,
    });
  }

  return results;
}
