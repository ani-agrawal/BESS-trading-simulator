import { PieChart } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getDominantRevenueStream, getRevenueAttribution } from '../engine/revenueAttribution';

interface Props {
  state: GameState;
}

export default function RevenueAttribution({ state }: Props) {
  const rows = getRevenueAttribution(state);
  const maxAbs = Math.max(1, ...rows.map(row => Math.abs(row.net)));

  return (
    <div className="panel revenue-attribution">
      <div className="panel-header">
        <h3><PieChart size={15} /> Revenue Mix</h3>
      </div>
      <div className="revenue-mix-note">{getDominantRevenueStream(state)}</div>
      <div className="revenue-mix-list">
        {rows.map(row => (
          <div key={row.key} className={`revenue-mix-row ${row.net >= 0 ? 'positive' : 'negative'}`}>
            <div className="revenue-mix-top">
              <strong>{row.label}</strong>
              <span>{row.net >= 0 ? '+' : '-'}£{Math.abs(row.net).toFixed(2)}</span>
            </div>
            <div className="revenue-mix-bar">
              <span style={{ width: `${Math.max(4, (Math.abs(row.net) / maxAbs) * 100)}%` }} />
            </div>
            <small>Revenue £{row.revenue.toFixed(2)} · Cost £{row.cost.toFixed(2)} · {row.mw.toFixed(0)} MW traded</small>
          </div>
        ))}
      </div>
    </div>
  );
}
