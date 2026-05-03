import type { GameState } from './types';
import { GameMode } from './types';
import { getSettlementPeriod } from './clock';

export interface CapacityAllocationRow {
  period: number;
  label: string;
  daMw: number;
  idMw: number;
  bmMw: number;
  reserveMw: number;
  idleMw: number;
  overloadedMw: number;
  note: string;
}

function spLabel(period: number): string {
  const hour = Math.floor(period / 2);
  return `${String(hour).padStart(2, '0')}:${period % 2 === 0 ? '00' : '30'}`;
}

function reserveMwForMode(state: GameState, period: number): number {
  if (state.mode !== GameMode.FREQUENCY_RESPONSE && state.mode !== GameMode.REVENUE_STACKING) return 0;
  const hour = period / 2;
  const daPrice = state.dayAhead.forecastPrices[period] ?? 0;
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const average = prices.reduce((sum, price) => sum + price, 0) / Math.max(1, prices.length);
  const isPeak = hour >= 16 && hour <= 19;

  if (state.mode === GameMode.FREQUENCY_RESPONSE) return Math.round(state.battery.config.powerRatingMw * 0.6);
  if (isPeak && daPrice > average + 20) return Math.round(state.battery.config.powerRatingMw * 0.15);
  return Math.round(state.battery.config.powerRatingMw * 0.3);
}

export function getCapacityAllocation(state: GameState, horizon = 8): CapacityAllocationRow[] {
  const powerLimit = state.battery.config.powerRatingMw;
  const currentPeriod = Math.max(0, getSettlementPeriod(state.clock.currentTime) - 1);
  const rows: CapacityAllocationRow[] = [];

  for (let offset = 0; offset < horizon; offset += 1) {
    const period = Math.min(47, currentPeriod + offset);
    const positions = state.dayAhead.playerSchedule.filter(position => !position.delivered && position.period === period);
    const daMw = positions.filter(position => position.market === 'da').reduce((sum, position) => sum + position.mw, 0);
    const idMw = positions.filter(position => position.market === 'id').reduce((sum, position) => sum + position.mw, 0);
    const bmMw = positions.filter(position => position.market === 'bm').reduce((sum, position) => sum + position.mw, 0);
    const reserveMw = reserveMwForMode(state, period);
    const committed = daMw + idMw + bmMw + reserveMw;
    const overloadedMw = Math.max(0, committed - powerLimit);
    const idleMw = Math.max(0, powerLimit - committed);

    let note = 'Capacity available.';
    if (overloadedMw > 0) note = 'Overcommitted: reduce one service.';
    else if (idleMw < powerLimit * 0.15) note = 'Almost fully allocated.';
    else if (positions.length === 0 && reserveMw === 0) note = 'Idle: no revenue assigned.';
    else if (reserveMw > 0 && positions.length === 0) note = 'Reserved for frequency response.';

    rows.push({
      period,
      label: `SP${period + 1} ${spLabel(period)}`,
      daMw,
      idMw,
      bmMw,
      reserveMw,
      idleMw,
      overloadedMw,
      note,
    });

    if (period === 47) break;
  }

  return rows;
}
