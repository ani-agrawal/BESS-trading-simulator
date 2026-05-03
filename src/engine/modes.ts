// Mode-specific gameplay logic for each trading strategy
import type { GameState, MarketEvent, Trade } from './types';
import { GameMode, OrderSide, MarketType } from './types';
import type { BatteryState } from './battery';
import { chargeBattery, dischargeBattery } from './battery';

// ===== FREQUENCY RESPONSE =====
export interface FrequencyEvent {
  id: string;
  timestamp: number;
  direction: 'up' | 'down'; // up = discharge needed, down = charge needed
  requiredMw: number;
  durationSp: number; // settlement periods
  paymentPerMwHr: number; // £/MW/hr availability payment
}

export function generateFrequencyEvent(timestamp: number, seed: number): FrequencyEvent | null {
  const rng = seededRng(seed);
  if (rng() > 0.12) return null; // ~12% chance per tick

  const direction = rng() > 0.5 ? 'up' : 'down';
  return {
    id: `freq-${timestamp}`,
    timestamp,
    direction,
    requiredMw: Math.round((10 + rng() * 40) / 5) * 5,
    durationSp: 1,
    paymentPerMwHr: Math.round((5 + rng() * 12) * 100) / 100,
  };
}

export function calculateFrequencyReward(
  battery: BatteryState,
  event: FrequencyEvent | null,
): { availabilityPayment: number; socPenalty: number; description: string } {
  // Availability payment: paid for keeping SoC near 50% (able to respond either way)
  const socDeviation = Math.abs(battery.socPct - 50);
  const availabilityFactor = Math.max(0, 1 - socDeviation / 50);
  const basePayment = battery.config.powerRatingMw * 8; // ~£8/MW/hr
  const availabilityPayment = Math.round(basePayment * availabilityFactor * 100) / 100;

  let socPenalty = 0;
  const eventContext = event ? ` Event requires ${event.requiredMw} MW ${event.direction === 'up' ? 'upward' : 'downward'} response.` : '';
  let description: string;

  if (socDeviation < 10) {
    description = `Excellent SoC management (${battery.socPct.toFixed(0)}%). Full availability payment.${eventContext}`;
  } else if (socDeviation < 25) {
    description = `SoC at ${battery.socPct.toFixed(0)}% — partial availability. Keep closer to 50% for full payments.${eventContext}`;
  } else {
    socPenalty = Math.round(socDeviation * 5 * 100) / 100;
    description = `SoC at ${battery.socPct.toFixed(0)}% — limited response capability. Penalty: £${socPenalty}. Target 50% SoC.${eventContext}`;
  }

  return { availabilityPayment, socPenalty, description };
}

// ===== BM PARTICIPATION =====
export interface BOAInstruction {
  id: string;
  timestamp: number;
  direction: 'bid' | 'offer'; // bid = charge, offer = discharge
  volumeMw: number;
  price: number;
  accepted: boolean;
  expiresAt: number;
}

export function generateBOA(timestamp: number, currentPrice: number, seed: number): BOAInstruction | null {
  const rng = seededRng(seed + 3333);
  if (rng() > 0.08) return null; // ~8% chance per tick

  const direction = rng() > 0.5 ? 'offer' : 'bid';
  const premium = 1.5 + rng() * 2.5; // 1.5-4x spot price premium
  const price = direction === 'offer'
    ? Math.round(currentPrice * premium * 100) / 100
    : Math.round(currentPrice / premium * 100) / 100;

  return {
    id: `boa-${timestamp}`,
    timestamp,
    direction,
    volumeMw: Math.round((10 + rng() * 40) / 5) * 5,
    price,
    accepted: false,
    expiresAt: timestamp + 3600_000 * 2, // expires in 2 hours
  };
}

export function executeBOA(
  battery: BatteryState,
  boa: BOAInstruction,
  timestamp: number,
): { newBattery: BatteryState; trade: Trade; revenue: number } | { error: string } {
  if (boa.direction === 'offer') {
    // NGESO wants us to discharge
    const result = dischargeBattery(battery, boa.volumeMw, boa.price, timestamp);
    if ('error' in result) return result;
    return {
      newBattery: result.newState,
      trade: {
        orderId: boa.id,
        side: OrderSide.SELL,
        volumeMw: result.entry.mw,
        price: boa.price,
        timestamp,
        marketType: MarketType.BM,
      },
      revenue: result.entry.cost,
    };
  } else {
    // NGESO wants us to charge
    const result = chargeBattery(battery, boa.volumeMw, boa.price, timestamp);
    if ('error' in result) return result;
    return {
      newBattery: result.newState,
      trade: {
        orderId: boa.id,
        side: OrderSide.BUY,
        volumeMw: result.entry.mw,
        price: boa.price,
        timestamp,
        marketType: MarketType.BM,
      },
      revenue: result.entry.cost,
    };
  }
}

// ===== NIV CHASING =====
export interface NIVPrediction {
  period: number;
  predictedDirection: 'long' | 'short' | 'balanced';
  confidence: number; // 0-1
  signals: string[];
}

export function generateNIVPredictions(
  forecastPrices: number[],
  windPct: number,
  seed: number,
): NIVPrediction[] {
  const rng = seededRng(seed + 7777);
  return forecastPrices.map((price, sp) => {
    const hour = sp / 2;
    const signals: string[] = [];
    let shortScore = 0;

    // High demand periods more likely to be short
    if (hour >= 16 && hour <= 19) {
      shortScore += 0.3;
      signals.push('Peak demand window');
    }

    // Low wind = more likely short
    if (windPct < 0.2) {
      shortScore += 0.25;
      signals.push('Low wind forecast');
    } else if (windPct > 0.5) {
      shortScore -= 0.3;
      signals.push('High wind — likely oversupplied');
    }

    // High prices suggest tight system
    if (price > 70) {
      shortScore += 0.2;
      signals.push('High DA price indicates tight market');
    } else if (price < 25) {
      shortScore -= 0.2;
      signals.push('Low DA price suggests oversupply');
    }

    // Random noise (forecast uncertainty)
    shortScore += (rng() - 0.5) * 0.3;

    const confidence = Math.min(0.9, Math.max(0.1, 0.5 + Math.abs(shortScore)));
    let predictedDirection: 'long' | 'short' | 'balanced';
    if (shortScore > 0.15) predictedDirection = 'short';
    else if (shortScore < -0.15) predictedDirection = 'long';
    else predictedDirection = 'balanced';

    return { period: sp, predictedDirection, confidence, signals };
  });
}

// ===== TRIAD MANAGEMENT =====
export interface TriadWarning {
  timestamp: number;
  riskLevel: 'medium' | 'high' | 'critical';
  peakSp: number; // settlement period of expected peak
  estimatedDemandGw: number;
  reason: string;
}

export function generateTriadWarning(
  timestamp: number,
  month: number,
  dow: number,
  hour: number,
  windPct: number,
  seed: number,
): TriadWarning | null {
  // Triads only Nov-Feb, weekdays
  if ((month < 10 && month > 1) || dow === 0 || dow === 6) return null;

  const rng = seededRng(seed + 5555);
  const tempC = -2 + rng() * 10; // -2 to 8°C

  // Only generate during afternoon (lookahead)
  if (hour < 12 || hour > 18) return null;

  const demandGw = 38 + (5 - tempC) * 1.5 + (1 - windPct) * 4 + rng() * 3;

  if (demandGw > 48 && tempC < 2) {
    return {
      timestamp,
      riskLevel: 'critical',
      peakSp: 34 + Math.floor(rng() * 4), // SP34-37 (5-6:30pm)
      estimatedDemandGw: Math.round(demandGw * 10) / 10,
      reason: `Cold snap (${tempC.toFixed(0)}°C) + low wind (${Math.round(windPct * 100)}%). Demand forecast ${demandGw.toFixed(1)} GW. HIGH TRIAD RISK.`,
    };
  }

  if (demandGw > 45 && tempC < 5) {
    return {
      timestamp,
      riskLevel: 'high',
      peakSp: 34 + Math.floor(rng() * 4),
      estimatedDemandGw: Math.round(demandGw * 10) / 10,
      reason: `Cool weather (${tempC.toFixed(0)}°C), moderate wind. Demand ${demandGw.toFixed(1)} GW. Monitor closely.`,
    };
  }

  if (demandGw > 42 && rng() < 0.3) {
    return {
      timestamp,
      riskLevel: 'medium',
      peakSp: 34 + Math.floor(rng() * 4),
      estimatedDemandGw: Math.round(demandGw * 10) / 10,
      reason: `Demand ${demandGw.toFixed(1)} GW — above average but not extreme. Low Triad probability.`,
    };
  }

  return null;
}

// ===== INTRADAY MARKET =====
export interface IntradayOrder {
  id: string;
  timestamp: number;
  targetSp: number;
  side: 'buy' | 'sell';
  mw: number;
  price: number;
  filled: boolean;
}

export function generateIntradayPrices(
  daPrices: number[],
  hoursElapsed: number,
  seed: number,
): number[] {
  const rng = seededRng(seed + hoursElapsed * 137);
  return daPrices.map((da, sp) => {
    // ID prices converge toward SIP as delivery approaches
    const hoursToDelivery = Math.max(1, (sp / 2) - hoursElapsed);
    const volatility = Math.max(2, 10 / Math.sqrt(hoursToDelivery));
    const drift = (rng() - 0.48) * volatility; // slight upward bias
    return Math.round((da + drift) * 100) / 100;
  });
}

// ===== MODE TICK DISPATCH =====
export function modeTickEffects(state: GameState, seed: number): {
  events: MarketEvent[];
  frequencyEvent: FrequencyEvent | null;
  boa: BOAInstruction | null;
  triadWarning: TriadWarning | null;
  availabilityPayment: number;
} {
  const ts = state.clock.currentTime;
  const d = new Date(ts);
  const hour = d.getUTCHours();
  const month = d.getUTCMonth();
  const dow = d.getUTCDay();
  const windPct = state.currentPrice?.renewablePct ?? 0.25;

  let frequencyEvent: FrequencyEvent | null = null;
  let boa: BOAInstruction | null = null;
  let triadWarning: TriadWarning | null = null;
  let availabilityPayment = 0;
  const events: MarketEvent[] = [];

  const mode = state.mode;

  // Frequency response events
  if (mode === GameMode.FREQUENCY_RESPONSE || mode === GameMode.REVENUE_STACKING) {
    frequencyEvent = generateFrequencyEvent(ts, seed);
    const reward = calculateFrequencyReward(state.battery, frequencyEvent);
    availabilityPayment = reward.availabilityPayment - reward.socPenalty;

    if (frequencyEvent) {
      events.push({
        id: `freq-evt-${seed}`,
        timestamp: ts,
        headline: `Frequency ${frequencyEvent.direction === 'up' ? 'drop' : 'rise'} — ${frequencyEvent.direction === 'up' ? 'discharge' : 'charge'} ${frequencyEvent.requiredMw} MW`,
        description: reward.description,
        priceImpact: frequencyEvent.paymentPerMwHr,
        category: 'policy',
      });
    }
  }

  // BM dispatch instructions
  if (mode === GameMode.BM_PARTICIPATION || mode === GameMode.REVENUE_STACKING) {
    boa = generateBOA(ts, state.currentPrice?.price ?? 50, seed);
    if (boa) {
      events.push({
        id: `boa-evt-${seed}`,
        timestamp: ts,
        headline: `BM Dispatch: ${boa.direction === 'offer' ? 'Discharge' : 'Charge'} ${boa.volumeMw} MW @ £${boa.price.toFixed(2)}`,
        description: `NGESO requests ${boa.direction === 'offer' ? 'generation increase' : 'demand increase'}. ${boa.direction === 'offer' ? 'Premium' : 'Discounted'} price vs spot. Accept within 2 hours.`,
        priceImpact: boa.price - (state.currentPrice?.price ?? 50),
        category: 'policy',
      });
    }
  }

  // Triad warnings
  if (mode === GameMode.TRIAD_MANAGEMENT || mode === GameMode.REVENUE_STACKING) {
    triadWarning = generateTriadWarning(ts, month, dow, hour, windPct, seed);
    if (triadWarning) {
      events.push({
        id: `triad-evt-${seed}`,
        timestamp: ts,
        headline: `TRIAD ${triadWarning.riskLevel.toUpperCase()}: Peak demand ${triadWarning.estimatedDemandGw} GW`,
        description: triadWarning.reason,
        priceImpact: triadWarning.riskLevel === 'critical' ? 50 : triadWarning.riskLevel === 'high' ? 25 : 10,
        category: 'triad',
      });
    }
  }

  return { events, frequencyEvent, boa, triadWarning, availabilityPayment };
}

function seededRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
