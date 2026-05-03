import { Radio } from 'lucide-react';
import type { GameState } from '../engine/types';

export default function FrequencyResponsePanel({ state }: { state: GameState }) {
  const soc = state.battery.socPct;
  const deviation = Math.abs(soc - 50);
  const availability = Math.max(0, Math.round((1 - deviation / 50) * 100));
  const power = state.battery.config.powerRatingMw;
  const estimatedPayment = Math.round(power * 8 * (availability / 100) * 100) / 100;
  const status = availability >= 80 ? 'Ready' : availability >= 50 ? 'Partial' : 'Poor';

  return (
    <div className={`panel frequency-panel availability-${status.toLowerCase()}`}>
      <div className="panel-header">
        <h3><Radio size={15} /> Frequency Response</h3>
        <span>{status}</span>
      </div>
      <div className="frequency-score">
        <strong>{availability}%</strong>
        <span>availability from current SoC</span>
      </div>
      <div className="frequency-grid">
        <div><span>Target SoC</span><strong>50%</strong></div>
        <div><span>Current SoC</span><strong>{soc.toFixed(0)}%</strong></div>
        <div><span>Est. £/SP</span><strong>£{estimatedPayment.toFixed(0)}</strong></div>
      </div>
      <p>
        Frequency response pays for being ready to move both directions. Keep SoC near 50%;
        too full limits charge response, too empty limits discharge response.
      </p>
    </div>
  );
}
