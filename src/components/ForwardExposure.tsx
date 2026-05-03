import { ArrowLeftRight } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getForwardExposure } from '../engine/forwardExposure';

interface Props {
  state: GameState;
}

export default function ForwardExposure({ state }: Props) {
  const exposure = getForwardExposure(state);
  return (
    <div className="panel forward-exposure">
      <div className="panel-header">
        <h3><ArrowLeftRight size={15} /> Forward Exposure</h3>
      </div>
      <div className="exposure-net">
        <span>Net next 8 SPs</span>
        <strong>{exposure.netMw >= 0 ? '+' : ''}{exposure.netMw.toFixed(0)} MW</strong>
      </div>
      <div className="exposure-metrics">
        <div><span>Charge</span><strong>{exposure.chargeMw.toFixed(0)} MW</strong></div>
        <div><span>Discharge</span><strong>{exposure.dischargeMw.toFixed(0)} MW</strong></div>
        <div><span>BM</span><strong>{exposure.bmMw.toFixed(0)} MW</strong></div>
      </div>
      <p>{exposure.interpretation}</p>
      <div className="exposure-list">
        {exposure.nextPeriods.length === 0 ? (
          <span>No scheduled positions in the next 8 SPs.</span>
        ) : (
          exposure.nextPeriods.map(item => <span key={item}>{item}</span>)
        )}
      </div>
    </div>
  );
}
