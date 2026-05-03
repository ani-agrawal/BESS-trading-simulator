import type { GameState } from './types';

export interface ModelComparisonRow {
  model: string;
  action: string;
  confidence: string;
  rationale: string;
}

function actionFromPrices(current: number, low: number, high: number): string {
  if (current <= low) return 'charge';
  if (current >= high) return 'discharge';
  return 'wait';
}

function percentile(values: number[], pct: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * pct)))] ?? 0;
}

export function getModelComparison(state: GameState): ModelComparisonRow[] {
  const sp = Math.max(0, state.dayAhead.revealedPeriods - 1);
  const current = state.currentPrice?.price ?? state.dayAhead.forecastPrices[sp] ?? 0;
  const da = state.dayAhead.forecastPrices.filter(Number.isFinite);
  const revealedSip = state.dayAhead.sipOutturn.slice(0, Math.max(1, state.dayAhead.revealedPeriods)).filter(Number.isFinite);
  const allSip = state.dayAhead.sipOutturn.filter(Number.isFinite);

  const daLow = percentile(da, 0.25);
  const daHigh = percentile(da, 0.75);
  const sipLow = percentile(revealedSip, 0.25);
  const sipHigh = percentile(revealedSip, 0.75);
  const hindsightLow = percentile(allSip, 0.25);
  const hindsightHigh = percentile(allSip, 0.75);

  return [
    {
      model: 'DA-only',
      action: actionFromPrices(current, daLow, daHigh),
      confidence: 'medium',
      rationale: `Uses DA bands: cheap below £${daLow.toFixed(2)}, expensive above £${daHigh.toFixed(2)}.`,
    },
    {
      model: 'ID/SIP-aware',
      action: actionFromPrices(current, sipLow, sipHigh),
      confidence: state.dayAhead.revealedPeriods > 8 ? 'medium' : 'low',
      rationale: `Uses revealed SIP bands: cheap below £${sipLow.toFixed(2)}, expensive above £${sipHigh.toFixed(2)}.`,
    },
    {
      model: 'Hindsight tutor',
      action: actionFromPrices(current, hindsightLow, hindsightHigh),
      confidence: 'high',
      rationale: `Uses full outturn bands for learning: cheap below £${hindsightLow.toFixed(2)}, expensive above £${hindsightHigh.toFixed(2)}.`,
    },
  ];
}
