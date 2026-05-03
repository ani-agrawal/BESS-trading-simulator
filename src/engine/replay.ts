import type { GameState } from './types';
import { buildPositionBook } from './positionBook';

export interface ReplayStep {
  period: number;
  timeLabel: string;
  forecastPrice: number;
  sipPrice: number | null;
  niv: number;
  action: string;
  result: string;
  explanation: string;
  cashflow: number;
  verdict: 'good' | 'ok' | 'bad' | 'missed' | 'neutral';
}

export function buildReplay(state: GameState): ReplayStep[] {
  const book = buildPositionBook(state);
  const analysisByPeriod = new Map((state.analysis?.periods ?? []).map(period => [period.period, period]));

  return book.rows.map(row => {
    const analysis = analysisByPeriod.get(row.period);
    const forecastPrice = state.dayAhead.forecastPrices[row.period] ?? 0;
    const sipPrice = row.sipPrice;
    const niv = state.dayAhead.niv[row.period] ?? 0;
    const action = row.physicalMwh > 0.1
      ? `Delivered ${row.physicalMwh.toFixed(1)} MWh`
      : row.physicalMwh < -0.1
        ? `Charged ${Math.abs(row.physicalMwh).toFixed(1)} MWh`
        : row.contractedMwh !== 0
          ? 'Position scheduled'
          : 'No action';

    let result = 'Waiting for settlement';
    let explanation = 'This period has not fully settled yet.';
    let verdict: ReplayStep['verdict'] = 'neutral';

    if (analysis) {
      verdict = analysis.verdict;
      result = analysis.playerAction === 'idle'
        ? analysis.verdict === 'missed' ? 'Missed opportunity' : 'Correct to wait'
        : `${analysis.playerAction} at £${analysis.playerPrice.toFixed(2)}`;
      explanation = analysis.explanation;
    } else if (sipPrice !== null) {
      if (Math.abs(row.imbalanceMwh) > 0.1) {
        result = `Imbalance settled at £${sipPrice.toFixed(2)}`;
        explanation = `Physical delivery differed from contracted volume by ${row.imbalanceMwh.toFixed(1)} MWh, so that difference settled at SIP.`;
        verdict = row.imbalanceCashflow >= 0 ? 'ok' : 'bad';
      } else {
        result = 'No imbalance';
        explanation = 'Physical delivery matched contracted volume closely.';
      }
    }

    return {
      period: row.period,
      timeLabel: row.timeLabel,
      forecastPrice,
      sipPrice,
      niv,
      action,
      result,
      explanation,
      cashflow: row.totalCashflow,
      verdict,
    };
  });
}
