import { ShieldAlert } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getRiskReport } from '../engine/riskLimits';

interface Props {
  state: GameState;
}

const STATUS_LABEL = {
  ok: 'OK',
  watch: 'WATCH',
  breach: 'BREACH',
};

export default function RiskLimits({ state }: Props) {
  const report = getRiskReport(state);
  return (
    <div className={`panel risk-limits risk-${report.status}`}>
      <div className="panel-header">
        <h3><ShieldAlert size={15} /> Risk Limits</h3>
        <span>{STATUS_LABEL[report.status]}</span>
      </div>
      <div className="risk-list">
        {report.limits.map(limit => (
          <div key={limit.label} className={`risk-item ${limit.status}`}>
            <div>
              <strong>{limit.label}</strong>
              <span>{limit.guidance}</span>
            </div>
            <em>{limit.value}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
