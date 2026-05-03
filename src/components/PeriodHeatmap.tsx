import { Grid3X3 } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getPeriodHeatmap } from '../engine/periodHeatmap';

interface Props {
  state: GameState;
}

export default function PeriodHeatmap({ state }: Props) {
  const cells = getPeriodHeatmap(state);
  return (
    <div className="panel period-heatmap">
      <div className="panel-header">
        <h3><Grid3X3 size={15} /> 48-Period Map</h3>
      </div>
      <div className="heatmap-legend">
        <span className="cheap">Cheap</span>
        <span className="expensive">Expensive</span>
        <span className="traded">Traded</span>
        <span className="current">Now</span>
      </div>
      <div className="heatmap-grid">
        {cells.map(cell => (
          <div
            key={cell.period}
            className={`heatmap-cell ${cell.band} ${cell.traded ? 'traded' : ''} ${cell.settled ? 'settled' : ''} ${cell.current ? 'current' : ''}`}
            title={`SP${cell.period + 1} ${cell.label}: £${cell.price.toFixed(2)}/MWh`}
          >
            <strong>{cell.period + 1}</strong>
            <span>£{cell.price.toFixed(0)}</span>
          </div>
        ))}
      </div>
      <p className="heatmap-note">Use this to scan the whole day: cheap blocks create charge candidates, expensive blocks create discharge candidates.</p>
    </div>
  );
}
