import { Trophy } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getBenchmarks } from '../engine/benchmarks';

interface Props {
  state: GameState;
}

export default function BenchmarkComparison({ state }: Props) {
  const rows = getBenchmarks(state);
  const maxAbs = Math.max(1, ...rows.map(row => Math.abs(row.pnl)));

  return (
    <div className="panel benchmark-comparison">
      <div className="panel-header">
        <h3><Trophy size={15} /> Benchmark Compare</h3>
      </div>
      <div className="benchmark-list">
        {rows.map(row => (
          <div key={row.label} className={`benchmark-row ${row.pnl >= 0 ? 'positive' : 'negative'}`}>
            <div className="benchmark-top">
              <strong>{row.label}</strong>
              <span>{row.pnl >= 0 ? '+' : '-'}£{Math.abs(row.pnl).toFixed(2)}</span>
            </div>
            <div className="benchmark-bar">
              <span style={{ width: `${Math.max(4, (Math.abs(row.pnl) / maxAbs) * 100)}%` }} />
            </div>
            <p>{row.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
