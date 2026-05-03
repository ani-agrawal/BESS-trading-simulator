import type { GameState } from './types';
import { getRevenueSummary } from './battery';
import { getCommitmentWarnings } from './commitmentWarnings';

export interface EndOfDayReport {
  headline: string;
  pnl: string;
  utilisation: string;
  bestDecision: string;
  worstDecision: string;
  tomorrowFocus: string;
  deskNotes: string[];
}

export function getEndOfDayReport(state: GameState): EndOfDayReport {
  const summary = getRevenueSummary(state.battery);
  const physicalTrades = state.battery.cycleLog.length;
  const scheduled = state.dayAhead.playerSchedule.length;
  const delivered = state.dayAhead.playerSchedule.filter(position => position.delivered).length;
  const bmAccepted = state.bm?.accepted.length ?? 0;
  const warnings = getCommitmentWarnings(state).filter(warning => warning.severity === 'danger');
  const grade = state.analysis?.grade ?? 'N/A';

  const headline = state.analysis
    ? `Desk review: ${grade} grade, £${summary.netProfit.toFixed(2)} net battery P&L.`
    : `Desk review: £${summary.netProfit.toFixed(2)} net battery P&L so far.`;

  const pnl = summary.netProfit >= 0
    ? `Positive realised P&L. Average charge £${summary.avgChargePrice.toFixed(2)}, average discharge £${summary.avgDischargePrice.toFixed(2)}.`
    : `Negative realised P&L. Review whether charge prices were too high or discharge prices too low.`;

  const utilisation = scheduled > 0
    ? `${delivered}/${scheduled} scheduled position(s) delivered. ${bmAccepted} BM instruction(s) accepted.`
    : `${physicalTrades} physical action(s), but no forward schedule built.`;

  const bestDecision = state.analysis?.bestTrade
    ? `Best decision: SP${state.analysis.bestTrade.period + 1}, ${state.analysis.bestTrade.playerAction} at £${state.analysis.bestTrade.playerPrice.toFixed(2)}.`
    : physicalTrades > 0
      ? 'Best decision: you made at least one active dispatch decision.'
      : 'Best decision: no trade yet; waiting is valid only when the signal is weak.';

  const worstDecision = state.analysis?.worstTrade
    ? `Worst decision: SP${state.analysis.worstTrade.period + 1}. ${state.analysis.worstTrade.explanation}`
    : warnings.length > 0
      ? `Worst issue: ${warnings[0].title}.`
      : 'Worst issue: not enough settled data yet to identify a bad decision.';

  let tomorrowFocus = 'Practise one complete cycle: plan, trade, deliver, review.';
  if (warnings.length > 0) tomorrowFocus = 'Tomorrow focus: remove schedule conflicts before adding more markets.';
  else if (state.dayAhead.playerSchedule.filter(position => position.market === 'id').length === 0 && scheduled > 0) {
    tomorrowFocus = 'Tomorrow focus: use intraday once to improve or correct the DA schedule.';
  } else if (bmAccepted === 0 && state.mode === 'revenue_stacking') {
    tomorrowFocus = 'Tomorrow focus: price one BM bid/offer while preserving battery headroom.';
  } else if (state.analysis && state.analysis.score < 60) {
    tomorrowFocus = 'Tomorrow focus: explain every missed value period before trading again.';
  }

  const deskNotes = [
    `SoC ended at ${state.battery.socPct.toFixed(0)}%.`,
    `Total charged ${state.battery.totalChargedMwh.toFixed(1)} MWh; discharged ${state.battery.totalDischargedMwh.toFixed(1)} MWh.`,
    `Cycle count ${summary.totalCycles.toFixed(2)}; revenue per cycle £${summary.revenuePerCycle.toFixed(2)}.`,
  ];

  return { headline, pnl, utilisation, bestDecision, worstDecision, tomorrowFocus, deskNotes };
}
