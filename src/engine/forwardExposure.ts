import type { GameState } from './types';
import { getSettlementPeriod } from './clock';

export interface ForwardExposure {
  netMw: number;
  chargeMw: number;
  dischargeMw: number;
  bmMw: number;
  nextPeriods: string[];
  interpretation: string;
}

function spLabel(period: number): string {
  const hour = Math.floor(period / 2);
  return `${String(hour).padStart(2, '0')}:${period % 2 === 0 ? '00' : '30'}`;
}

export function getForwardExposure(state: GameState, horizon = 8): ForwardExposure {
  const currentPeriod = Math.max(0, getSettlementPeriod(state.clock.currentTime) - 1);
  const positions = state.dayAhead.playerSchedule.filter(position =>
    !position.delivered &&
    position.period >= currentPeriod &&
    position.period < currentPeriod + horizon,
  );

  const chargeMw = positions
    .filter(position => position.action === 'charge')
    .reduce((sum, position) => sum + position.mw, 0);
  const dischargeMw = positions
    .filter(position => position.action === 'discharge')
    .reduce((sum, position) => sum + position.mw, 0);
  const bmMw = positions
    .filter(position => position.market === 'bm')
    .reduce((sum, position) => sum + position.mw, 0);
  const netMw = dischargeMw - chargeMw;

  let interpretation = 'Book is mostly flat over the next few periods.';
  if (netMw > 20) interpretation = 'Book is net long generation: you are mostly committed to discharge.';
  else if (netMw < -20) interpretation = 'Book is net load: you are mostly committed to charge.';
  if (bmMw > 0) interpretation += ' BM instructions add operational uncertainty.';

  const nextPeriods = positions
    .slice()
    .sort((a, b) => a.period - b.period)
    .slice(0, 5)
    .map(position => `SP${position.period + 1} ${spLabel(position.period)}: ${position.market.toUpperCase()} ${position.action} ${position.mw.toFixed(0)} MW`);

  return {
    netMw,
    chargeMw,
    dischargeMw,
    bmMw,
    nextPeriods,
    interpretation,
  };
}
