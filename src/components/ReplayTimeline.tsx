import type { GameState } from '../engine/types';
import { buildReplay } from '../engine/replay';
import { Clock3, PlayCircle } from 'lucide-react';

const verdictLabels: Record<string, string> = {
  good: 'Good',
  ok: 'OK',
  bad: 'Bad',
  missed: 'Missed',
  neutral: 'Neutral',
};

export default function ReplayTimeline({ state }: { state: GameState }) {
  const replay = buildReplay(state);
  const interesting = replay.filter(step =>
    step.verdict !== 'neutral' || step.action !== 'No action' || step.period < state.dayAhead.revealedPeriods + 4
  ).slice(0, 18);

  return (
    <div className="panel replay-panel">
      <div className="panel-header">
        <h3><PlayCircle size={15} /> Replay Timeline</h3>
      </div>
      <div className="replay-list">
        {interesting.map(step => (
          <div key={step.period} className={`replay-item verdict-${step.verdict}`}>
            <div className="replay-time">
              <Clock3 size={13} />
              <strong>{step.timeLabel}</strong>
              <span>{verdictLabels[step.verdict]}</span>
            </div>
            <div className="replay-main">
              <div className="replay-row">
                <span>Forecast £{step.forecastPrice.toFixed(2)}</span>
                <span>SIP {step.sipPrice === null ? '-' : `£${step.sipPrice.toFixed(2)}`}</span>
                <span>NIV {step.niv >= 0 ? '+' : ''}{step.niv}</span>
                <strong className={step.cashflow >= 0 ? 'positive' : 'negative'}>{step.cashflow >= 0 ? '+' : ''}£{step.cashflow.toFixed(2)}</strong>
              </div>
              <div className="replay-action">{step.action} · {step.result}</div>
              <p>{step.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
