import type { GameState } from './types';
import { getSettlementPeriod } from './clock';
import { getMaxChargeableMw, getMaxDischargeableMw } from './battery';

export interface DecisionCoach {
  action: 'charge' | 'discharge' | 'wait';
  confidence: 'low' | 'medium' | 'high';
  headline: string;
  why: string[];
  opportunityCost: string;
  suggestedMw: number;
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * pct)))];
}

export function getDecisionCoach(state: GameState): DecisionCoach {
  const currentPrice = state.currentPrice?.price ?? 0;
  const currentSp = Math.max(0, getSettlementPeriod(state.clock.currentTime) - 1);
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const low = percentile(prices, 0.25);
  const high = percentile(prices, 0.75);
  const future = state.dayAhead.forecastPrices.slice(currentSp + 1).filter(Number.isFinite);
  const futureHigh = future.length ? Math.max(...future) : currentPrice;
  const futureLow = future.length ? Math.min(...future) : currentPrice;
  const efficiency = state.battery.config.efficiencyPct / 100;
  const degradation = 4;
  const chargeValue = (futureHigh * efficiency) - currentPrice - degradation;
  const dischargeValue = currentPrice - (futureLow / Math.max(0.01, efficiency)) - degradation;
  const maxCharge = getMaxChargeableMw(state.battery);
  const maxDischarge = getMaxDischargeableMw(state.battery);
  const recent = state.priceHistory.slice(-8).map(price => price.price);
  const recentAvg = recent.reduce((sum, price) => sum + price, 0) / Math.max(1, recent.length);
  const recentMove = currentPrice - recentAvg;

  const why: string[] = [
    `Current price: £${currentPrice.toFixed(2)}/MWh.`,
    `Cheap threshold: £${low.toFixed(2)}; expensive threshold: £${high.toFixed(2)}.`,
  ];

  if (currentPrice <= low && chargeValue > 0 && maxCharge > 0.1) {
    return {
      action: 'charge',
      confidence: chargeValue > 12 ? 'high' : 'medium',
      headline: 'Charge is the cleanest action right now.',
      why: [
        ...why,
        `Future high is £${futureHigh.toFixed(2)}, giving about £${chargeValue.toFixed(2)}/MWh expected value after efficiency and degradation.`,
        `Battery has headroom for up to ${maxCharge.toFixed(0)} MW this SP.`,
      ],
      opportunityCost: 'Main risk: filling now may block an even cheaper period later.',
      suggestedMw: Math.min(25, maxCharge),
    };
  }

  if (currentPrice >= high && dischargeValue > 0 && maxDischarge > 0.1) {
    return {
      action: 'discharge',
      confidence: dischargeValue > 12 ? 'high' : 'medium',
      headline: 'Discharge is the cleanest action right now.',
      why: [
        ...why,
        `Future low is £${futureLow.toFixed(2)}, giving about £${dischargeValue.toFixed(2)}/MWh expected value after refill cost and degradation.`,
        `Battery has stored energy for up to ${maxDischarge.toFixed(0)} MW this SP.`,
      ],
      opportunityCost: 'Main risk: selling now may leave too little SoC for a stronger spike later.',
      suggestedMw: Math.min(25, maxDischarge),
    };
  }

  if (maxCharge < 0.1 && currentPrice <= low) {
    return {
      action: 'wait',
      confidence: 'high',
      headline: 'Wait: the price is cheap, but the battery is full.',
      why: [...why, 'There is no charging headroom. A trader cannot buy flexibility the asset cannot store.'],
      opportunityCost: 'The mistake happened earlier: you needed spare headroom before this cheap period.',
      suggestedMw: 0,
    };
  }

  if (maxDischarge < 0.1 && currentPrice >= high) {
    return {
      action: 'wait',
      confidence: 'high',
      headline: 'Wait: the price is high, but the battery is empty.',
      why: [...why, 'There is no stored energy to sell. A high price only matters if you have inventory.'],
      opportunityCost: 'The mistake happened earlier: you needed to charge before this expensive period.',
      suggestedMw: 0,
    };
  }

  return {
    action: 'wait',
    confidence: Math.abs(recentMove) < 5 ? 'medium' : 'low',
    headline: 'Wait is the disciplined action right now.',
    why: [
      ...why,
      `Charge value is £${chargeValue.toFixed(2)}/MWh; discharge value is £${dischargeValue.toFixed(2)}/MWh.`,
      'Neither side is clearly strong enough after efficiency and degradation.',
    ],
    opportunityCost: 'Waiting preserves optionality. Overtrading weak signals creates degradation without enough spread.',
    suggestedMw: 0,
  };
}
