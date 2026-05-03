import { Gauge } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getCapacityAllocation } from '../engine/capacityAllocation';

interface Props {
  state: GameState;
}

export default function CapacityAllocationBoard({ state }: Props) {
  const rows = getCapacityAllocation(state);
  const limit = state.battery.config.powerRatingMw;

  return (
    <div className="panel capacity-board">
      <div className="panel-header">
        <h3><Gauge size={15} /> Capacity Allocation</h3>
        <span>{limit.toFixed(0)} MW limit</span>
      </div>
      <div className="capacity-legend">
        <span className="da">DA</span>
        <span className="id">ID</span>
        <span className="bm">BM</span>
        <span className="reserve">Reserve</span>
        <span className="idle">Idle</span>
      </div>
      <div className="capacity-rows">
        {rows.map(row => {
          const total = row.daMw + row.idMw + row.bmMw + row.reserveMw + row.idleMw;
          const scale = Math.max(limit, total);
          return (
            <div key={row.period} className={`capacity-row ${row.overloadedMw > 0 ? 'overloaded' : ''}`}>
              <div className="capacity-row-top">
                <strong>{row.label}</strong>
                <span>{row.note}</span>
              </div>
              <div className="capacity-bar" aria-label={`${row.label} capacity allocation`}>
                {row.daMw > 0 && <span className="da" style={{ width: `${(row.daMw / scale) * 100}%` }}>{row.daMw.toFixed(0)}</span>}
                {row.idMw > 0 && <span className="id" style={{ width: `${(row.idMw / scale) * 100}%` }}>{row.idMw.toFixed(0)}</span>}
                {row.bmMw > 0 && <span className="bm" style={{ width: `${(row.bmMw / scale) * 100}%` }}>{row.bmMw.toFixed(0)}</span>}
                {row.reserveMw > 0 && <span className="reserve" style={{ width: `${(row.reserveMw / scale) * 100}%` }}>{row.reserveMw.toFixed(0)}</span>}
                {row.idleMw > 0 && <span className="idle" style={{ width: `${(row.idleMw / scale) * 100}%` }}>{row.idleMw.toFixed(0)}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="capacity-note">
        Read this as MW capacity, not MWh energy. A 50 MW battery cannot commit 50 MW to DA and another 50 MW to BM in the same settlement period.
      </p>
    </div>
  );
}
