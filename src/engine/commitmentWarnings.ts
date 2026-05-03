import type { GameState } from './types';

export interface CommitmentWarning {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  detail: string;
}

function spLabel(period: number): string {
  const hour = Math.floor(period / 2);
  return `${String(hour).padStart(2, '0')}:${period % 2 === 0 ? '00' : '30'}`;
}

export function getCommitmentWarnings(state: GameState): CommitmentWarning[] {
  const warnings: CommitmentWarning[] = [];
  const positions = state.dayAhead.playerSchedule.filter(position => !position.delivered);
  const byPeriod = new Map<number, typeof positions>();

  for (const position of positions) {
    byPeriod.set(position.period, [...(byPeriod.get(position.period) ?? []), position]);
  }

  for (const [period, periodPositions] of byPeriod) {
    const chargeMw = periodPositions
      .filter(position => position.action === 'charge')
      .reduce((sum, position) => sum + position.mw, 0);
    const dischargeMw = periodPositions
      .filter(position => position.action === 'discharge')
      .reduce((sum, position) => sum + position.mw, 0);

    if (chargeMw > 0 && dischargeMw > 0) {
      warnings.push({
        id: `opposite-${period}`,
        severity: 'danger',
        title: `Opposite actions in SP${period + 1}`,
        detail: `${spLabel(period)} has charge and discharge commitments. Real desks would net or cancel one side.`,
      });
    }

    if (chargeMw > state.battery.config.powerRatingMw) {
      warnings.push({
        id: `charge-limit-${period}`,
        severity: 'danger',
        title: `Charge power limit exceeded in SP${period + 1}`,
        detail: `${chargeMw.toFixed(0)} MW scheduled vs ${state.battery.config.powerRatingMw.toFixed(0)} MW battery limit.`,
      });
    }

    if (dischargeMw > state.battery.config.powerRatingMw) {
      warnings.push({
        id: `discharge-limit-${period}`,
        severity: 'danger',
        title: `Discharge power limit exceeded in SP${period + 1}`,
        detail: `${dischargeMw.toFixed(0)} MW scheduled vs ${state.battery.config.powerRatingMw.toFixed(0)} MW battery limit.`,
      });
    }
  }

  const acceptedBm = state.bm?.accepted.length ?? 0;
  if (acceptedBm > 0) {
    warnings.push({
      id: 'bm-accepted',
      severity: 'info',
      title: 'BM instruction added to the book',
      detail: `${acceptedBm} accepted BM instruction(s) now compete with DA/ID for battery capacity.`,
    });
  }

  if (positions.length === 0) {
    warnings.push({
      id: 'empty-book',
      severity: 'info',
      title: 'No forward commitments',
      detail: 'The book is clean, but there is no scheduled revenue yet.',
    });
  }

  return warnings.slice(0, 5);
}
