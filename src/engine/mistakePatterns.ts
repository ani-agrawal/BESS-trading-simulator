import type { GameState } from './types';
import { getRevenueSummary } from './battery';
import { getCommitmentWarnings } from './commitmentWarnings';

export interface MistakePattern {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
  fix: string;
}

export function getMistakePatterns(state: GameState): MistakePattern[] {
  const patterns: MistakePattern[] = [];
  const summary = getRevenueSummary(state.battery);
  const trades = state.battery.cycleLog;
  const charges = trades.filter(trade => trade.action === 'charge');
  const discharges = trades.filter(trade => trade.action === 'discharge');
  const warnings = getCommitmentWarnings(state).filter(warning => warning.severity === 'danger');
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const spread = Math.max(...prices) - Math.min(...prices);

  if (charges.length > 0 && discharges.length === 0 && state.battery.socPct > 75) {
    patterns.push({
      id: 'unmonetised-energy',
      title: 'Unmonetised energy',
      severity: 'medium',
      evidence: `${charges.length} charge action(s), no discharge yet, SoC ${state.battery.socPct.toFixed(0)}%.`,
      fix: 'Before adding more charge, identify the sell period that will monetise the stored energy.',
    });
  }

  if (discharges.length > 0 && charges.length === 0 && state.battery.socPct < 25) {
    patterns.push({
      id: 'sold-inventory-early',
      title: 'Sold inventory without a refill plan',
      severity: 'medium',
      evidence: `${discharges.length} discharge action(s), no charge yet, SoC ${state.battery.socPct.toFixed(0)}%.`,
      fix: 'After a discharge, find the next cheap refill period or preserve remaining SoC.',
    });
  }

  if (charges.length > 0 && discharges.length > 0 && summary.avgDischargePrice - summary.avgChargePrice < 8) {
    patterns.push({
      id: 'thin-spread',
      title: 'Thin-spread cycling',
      severity: 'high',
      evidence: `Realised spread is £${(summary.avgDischargePrice - summary.avgChargePrice).toFixed(2)}/MWh.`,
      fix: 'Only cycle when the spread clears efficiency, degradation, and opportunity cost.',
    });
  }

  if (trades.length >= 4 && spread < 30) {
    patterns.push({
      id: 'overtrading-flat-day',
      title: 'Overtrading a flat day',
      severity: 'medium',
      evidence: `${trades.length} physical actions on a day with only £${spread.toFixed(2)}/MWh forecast range.`,
      fix: 'On flat days, wait or use reserve-style revenue rather than forcing arbitrage.',
    });
  }

  if (warnings.length > 0) {
    patterns.push({
      id: 'overcommitted-book',
      title: 'Overcommitted book',
      severity: 'high',
      evidence: warnings[0].detail,
      fix: 'Resolve conflicting or oversized commitments before stepping into delivery.',
    });
  }

  if (state.dayAhead.playerSchedule.length >= 4 && !state.dayAhead.playerSchedule.some(position => position.market === 'id') && state.dayAhead.revealedPeriods > 12) {
    patterns.push({
      id: 'no-reoptimization',
      title: 'No intraday re-optimisation',
      severity: 'low',
      evidence: 'Several periods have settled but no ID revision has been used.',
      fix: 'When SIP/forecast diverges, use ID to improve the book rather than leaving DA untouched.',
    });
  }

  if (patterns.length === 0) {
    patterns.push({
      id: 'clean',
      title: 'No obvious bad habit detected',
      severity: 'low',
      evidence: 'Current actions do not show a repeated mistake pattern.',
      fix: 'Keep explaining each trade before you click it.',
    });
  }

  return patterns.slice(0, 4);
}
