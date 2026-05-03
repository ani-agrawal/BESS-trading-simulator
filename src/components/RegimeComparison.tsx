import { GitCompare } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getRegimeComparison } from '../engine/regimeComparison';

interface Props {
  state: GameState;
}

export default function RegimeComparison({ state }: Props) {
  const comparison = getRegimeComparison(state);
  return (
    <div className="panel regime-comparison">
      <div className="panel-header">
        <h3><GitCompare size={15} /> Regime Compare</h3>
      </div>
      <div className="regime-today">
        <div><span>Today spread</span><strong>£{comparison.today.spread.toFixed(0)}</strong></div>
        <div><span>Max price</span><strong>£{comparison.today.maxPrice.toFixed(0)}</strong></div>
        <div><span>Wind</span><strong>{Math.round(comparison.today.windPct * 100)}%</strong></div>
      </div>
      <div className="regime-list">
        {comparison.closest.map(row => (
          <div key={row.title} className="regime-row">
            <div>
              <strong>{row.title}</strong>
              <span>Spread £{row.spread.toFixed(0)} · max £{row.maxPrice.toFixed(0)} · wind {Math.round(row.windPct * 100)}%</span>
            </div>
            <em>{row.similarity}%</em>
          </div>
        ))}
      </div>
      <p className="regime-note">Use this to build pattern recognition: similar days often reward similar battery behaviour.</p>
    </div>
  );
}
