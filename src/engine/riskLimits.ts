import type { GameState } from './types';
import { getCommitmentWarnings } from './commitmentWarnings';
import { getForecastReview } from './forecastReview';

export interface RiskLimit {
  label: string;
  status: 'ok' | 'watch' | 'breach';
  value: string;
  guidance: string;
}

export interface RiskReport {
  status: 'ok' | 'watch' | 'breach';
  limits: RiskLimit[];
}

export function getRiskReport(state: GameState): RiskReport {
  const forecast = getForecastReview(state);
  const dangerWarnings = getCommitmentWarnings(state).filter(warning => warning.severity === 'danger');
  const cycles = state.battery.totalCycles;
  const soc = state.battery.socPct;
  const scheduleMw = Math.max(
    0,
    ...state.dayAhead.playerSchedule
      .filter(position => !position.delivered)
      .map(position => position.mw),
  );

  const limits: RiskLimit[] = [
    {
      label: 'SoC optionality',
      status: soc < 10 || soc > 95 ? 'breach' : soc < 20 || soc > 85 ? 'watch' : 'ok',
      value: `${soc.toFixed(0)}%`,
      guidance: soc < 20
        ? 'Low SoC limits discharge optionality.'
        : soc > 85
          ? 'High SoC limits charging headroom.'
          : 'SoC leaves room to respond both ways.',
    },
    {
      label: 'Cycling discipline',
      status: cycles > 1.5 ? 'breach' : cycles > 0.9 ? 'watch' : 'ok',
      value: `${cycles.toFixed(2)} cycles`,
      guidance: cycles > 1
        ? 'Only cycle this hard when spread is strong enough after degradation.'
        : 'Cycle count is reasonable for training.',
    },
    {
      label: 'Power commitment',
      status: dangerWarnings.length > 0 ? 'breach' : scheduleMw > state.battery.config.powerRatingMw * 0.85 ? 'watch' : 'ok',
      value: `${scheduleMw.toFixed(0)} MW max ticket`,
      guidance: dangerWarnings.length > 0
        ? 'Resolve overcommitments before delivery.'
        : 'No immediate power-limit breach detected.',
    },
    {
      label: 'Forecast uncertainty',
      status: forecast.mae > 35 ? 'breach' : forecast.mae > 18 ? 'watch' : 'ok',
      value: `£${forecast.mae.toFixed(2)} MAE`,
      guidance: forecast.mae > 18
        ? 'Use ID/BM optionality instead of fully trusting DA.'
        : 'Forecast error is manageable so far.',
    },
  ];

  const status = limits.some(limit => limit.status === 'breach')
    ? 'breach'
    : limits.some(limit => limit.status === 'watch')
      ? 'watch'
      : 'ok';

  return { status, limits };
}
