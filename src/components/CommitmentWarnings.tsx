import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getCommitmentWarnings } from '../engine/commitmentWarnings';

interface Props {
  state: GameState;
}

function WarningIcon({ severity }: { severity: 'info' | 'warning' | 'danger' }) {
  if (severity === 'danger') return <AlertTriangle size={15} />;
  if (severity === 'warning') return <AlertTriangle size={15} />;
  return <Info size={15} />;
}

export default function CommitmentWarnings({ state }: Props) {
  const warnings = getCommitmentWarnings(state);
  const hasDanger = warnings.some(warning => warning.severity === 'danger');
  return (
    <div className={`panel commitment-warnings ${hasDanger ? 'has-danger' : ''}`}>
      <div className="panel-header">
        <h3><CheckCircle2 size={15} /> Commitment Check</h3>
      </div>
      <div className="commitment-list">
        {warnings.map(warning => (
          <div key={warning.id} className={`commitment-warning ${warning.severity}`}>
            <WarningIcon severity={warning.severity} />
            <div>
              <strong>{warning.title}</strong>
              <span>{warning.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
