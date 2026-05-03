import type { GameState } from './types';

export interface JournalEntry {
  id: string;
  title: string;
  detail: string;
  lesson: string;
  tone: 'good' | 'watch' | 'neutral';
}

export function getTradeJournal(state: GameState): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const prices = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const sorted = [...prices].sort((a, b) => a - b);
  const lowCut = sorted[Math.floor(sorted.length * 0.25)] ?? 35;
  const highCut = sorted[Math.floor(sorted.length * 0.75)] ?? 75;

  for (const [idx, trade] of state.battery.cycleLog.slice(0, 5).entries()) {
    const isCharge = trade.action === 'charge';
    const cheap = trade.price <= lowCut;
    const expensive = trade.price >= highCut;
    const tone: JournalEntry['tone'] = isCharge
      ? cheap ? 'good' : 'watch'
      : expensive ? 'good' : 'watch';

    entries.push({
      id: `physical-${trade.timestamp}-${idx}`,
      title: `${isCharge ? 'Charged' : 'Discharged'} ${trade.mw.toFixed(0)} MW at £${trade.price.toFixed(2)}`,
      detail: `${trade.energyMwh.toFixed(1)} MWh moved. Cash impact ${trade.cost >= 0 ? '+' : '-'}£${Math.abs(trade.cost).toFixed(2)}.`,
      lesson: tone === 'good'
        ? isCharge
          ? 'Good: this was cheap relative to the day, so it creates spread potential.'
          : 'Good: this was expensive relative to the day, so it monetises stored energy.'
        : isCharge
          ? 'Watch: this was not obviously cheap, so make sure there is a stronger later discharge.'
          : 'Watch: this was not obviously expensive, so check you are not selling optionality too early.',
      tone,
    });
  }

  for (const [idx, position] of state.dayAhead.playerSchedule.slice(-5).reverse().entries()) {
    entries.push({
      id: `position-${position.lockedAt}-${position.period}-${idx}`,
      title: `${position.market.toUpperCase()} ${position.action} scheduled for SP${position.period + 1}`,
      detail: `${position.mw.toFixed(0)} MW at £${position.price.toFixed(2)}/MWh${position.delivered ? ' delivered.' : ' pending delivery.'}`,
      lesson: position.market === 'bm'
        ? 'BM instruction now competes for the same battery MW as DA and ID.'
        : position.market === 'id'
          ? 'ID should improve or correct the DA schedule, not add noise.'
          : 'DA is a plan: the battery changes only when the settlement period arrives.',
      tone: position.delivered ? 'good' : 'neutral',
    });
  }

  if (entries.length === 0) {
    entries.push({
      id: 'empty',
      title: 'No journal entries yet',
      detail: 'Make a dispatch, DA schedule, ID revision, or BM submission.',
      lesson: 'The journal will translate each action into a learning note.',
      tone: 'neutral',
    });
  }

  return entries.slice(0, 8);
}
