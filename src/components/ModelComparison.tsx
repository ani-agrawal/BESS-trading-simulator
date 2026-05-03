import { LineChart } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getModelComparison } from '../engine/modelComparison';

export default function ModelComparison({ state }: { state: GameState }) {
  const rows = getModelComparison(state);
  return (
    <div className="panel model-comparison">
      <div className="panel-header">
        <h3><LineChart size={15} /> Model Compare</h3>
      </div>
      <div className="model-list">
        {rows.map(row => (
          <div key={row.model} className={`model-row action-${row.action}`}>
            <div>
              <strong>{row.model}</strong>
              <span>{row.rationale}</span>
            </div>
            <em>{row.action}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
