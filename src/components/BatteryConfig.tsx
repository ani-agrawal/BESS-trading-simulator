import { useState } from 'react';
import type { BatteryConfig } from '../engine/battery';
import HelpIcon from './HelpIcon';
import { Settings, X } from 'lucide-react';

interface Props {
  config: BatteryConfig;
  onApply: (config: Partial<BatteryConfig>) => void;
}

export default function BatteryConfig({ config, onApply }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [capacity, setCapacity] = useState(String(config.capacityMwh));
  const [power, setPower] = useState(String(config.powerRatingMw));
  const [efficiency, setEfficiency] = useState(String(config.efficiencyPct));

  const handleApply = () => {
    onApply({
      capacityMwh: Math.max(10, Math.min(500, Number(capacity) || 100)),
      powerRatingMw: Math.max(5, Math.min(250, Number(power) || 50)),
      efficiencyPct: Math.max(70, Math.min(98, Number(efficiency) || 90)),
    });
    setIsOpen(false);
  };

  return (
    <>
      <button className="btn btn-icon btn-config" onClick={() => setIsOpen(true)} title="Battery Configuration">
        <Settings size={16} />
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal config-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Battery Configuration</h2>
              <button className="btn btn-icon" onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>
            <p className="config-intro">
              Adjust your battery specifications. Changes take effect immediately.
              Typical UK grid-scale BESS: 50 MW / 100 MWh (2-hour duration).
            </p>

            <div className="config-form">
              <div className="config-field">
                <label>
                  Energy Capacity (MWh)
                  <HelpIcon text="Total energy the battery can store. Larger capacity = more energy per cycle but higher capital cost. Typical: 50-200 MWh." />
                </label>
                <input type="number" className="input" value={capacity} onChange={e => setCapacity(e.target.value)} min={10} max={500} step={10} />
                <span className="config-range">10 - 500 MWh</span>
              </div>

              <div className="config-field">
                <label>
                  Power Rating (MW)
                  <HelpIcon text="Maximum charge/discharge rate. Higher power = faster cycling but more grid connection cost. Typical: 25-100 MW." />
                </label>
                <input type="number" className="input" value={power} onChange={e => setPower(e.target.value)} min={5} max={250} step={5} />
                <span className="config-range">5 - 250 MW</span>
              </div>

              <div className="config-field">
                <label>
                  Round-trip Efficiency (%)
                  <HelpIcon text="Energy retained after a full charge-discharge cycle. Li-ion BESS: 85-92%. Higher = less energy lost = more profit per cycle." />
                </label>
                <input type="number" className="input" value={efficiency} onChange={e => setEfficiency(e.target.value)} min={70} max={98} step={1} />
                <span className="config-range">70 - 98%</span>
              </div>

              <div className="config-derived">
                <div className="config-calc">
                  <span>Duration:</span>
                  <strong>{((Number(capacity) || 100) / (Number(power) || 50)).toFixed(1)} hours</strong>
                </div>
                <div className="config-calc">
                  <span>C-rate:</span>
                  <strong>{((Number(power) || 50) / (Number(capacity) || 100)).toFixed(2)}</strong>
                </div>
                <div className="config-calc">
                  <span>Loss per cycle:</span>
                  <strong>{(100 - (Number(efficiency) || 90)).toFixed(0)}%</strong>
                </div>
              </div>

              <div className="config-presets">
                <span className="config-presets-label">Presets:</span>
                <button className="btn btn-preset" onClick={() => { setCapacity('100'); setPower('50'); setEfficiency('90'); }}>
                  Standard (50MW/100MWh)
                </button>
                <button className="btn btn-preset" onClick={() => { setCapacity('200'); setPower('100'); setEfficiency('88'); }}>
                  Large (100MW/200MWh)
                </button>
                <button className="btn btn-preset" onClick={() => { setCapacity('50'); setPower('50'); setEfficiency('92'); }}>
                  1-hour (50MW/50MWh)
                </button>
              </div>

              <button className="btn btn-submit btn-buy" onClick={handleApply}>
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
