import type { GameState } from './types';

export interface ForecastReview {
  mae: number;
  bias: number;
  biggestMissPeriod: number | null;
  biggestMiss: number;
  verdict: string;
  lessons: string[];
}

export function getForecastReview(state: GameState): ForecastReview {
  const revealed = Math.min(state.dayAhead.revealedPeriods, state.dayAhead.forecastPrices.length, state.dayAhead.sipOutturn.length);
  const errors: { period: number; error: number; abs: number }[] = [];

  for (let period = 0; period < revealed; period += 1) {
    const forecast = state.dayAhead.forecastPrices[period];
    const outturn = state.dayAhead.sipOutturn[period];
    if (!Number.isFinite(forecast) || !Number.isFinite(outturn)) continue;
    const error = outturn - forecast;
    errors.push({ period, error, abs: Math.abs(error) });
  }

  if (errors.length === 0) {
    return {
      mae: 0,
      bias: 0,
      biggestMissPeriod: null,
      biggestMiss: 0,
      verdict: 'No forecast outturn revealed yet.',
      lessons: ['Step forward to reveal SIP, then compare forecast against outturn.'],
    };
  }

  const mae = errors.reduce((sum, item) => sum + item.abs, 0) / errors.length;
  const bias = errors.reduce((sum, item) => sum + item.error, 0) / errors.length;
  const biggest = errors.reduce((max, item) => item.abs > max.abs ? item : max, errors[0]);

  let verdict = 'Forecast was usable.';
  if (mae >= 35) verdict = 'Forecast was poor: rely more on intraday updates and imbalance signals.';
  else if (mae >= 18) verdict = 'Forecast was noisy: keep optionality and avoid overcommitting too early.';
  else if (Math.abs(bias) >= 15) verdict = bias > 0
    ? 'Forecast was biased too low: outturn prices came in higher than DA.'
    : 'Forecast was biased too high: outturn prices came in lower than DA.';

  const lessons = [
    `Mean absolute error: £${mae.toFixed(2)}/MWh.`,
    bias > 0
      ? `Bias: SIP averaged £${bias.toFixed(2)}/MWh above DA.`
      : `Bias: SIP averaged £${Math.abs(bias).toFixed(2)}/MWh below DA.`,
    `Biggest miss: SP${biggest.period + 1}, £${biggest.error.toFixed(2)}/MWh.`,
  ];

  if (mae >= 18) lessons.push('Training implication: use ID/BM optionality rather than trusting the first forecast.');
  else lessons.push('Training implication: DA schedule quality mattered more than forecast error today.');

  return {
    mae: Math.round(mae * 100) / 100,
    bias: Math.round(bias * 100) / 100,
    biggestMissPeriod: biggest.period,
    biggestMiss: Math.round(biggest.error * 100) / 100,
    verdict,
    lessons,
  };
}
