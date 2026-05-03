import type { GameState } from '../engine/types';
import PriceChart from './PriceChart';
import BatteryStatus from './BatteryStatus';
import ChargeDischargeControls from './ChargeDischargeControls';
import RevenueTracker from './RevenueTracker';
import type { BatteryConfig } from '../engine/battery';
import CockpitContextCharts from './CockpitContextCharts';

interface Props {
  state: GameState;
  onCharge: (mw: number) => void;
  onDischarge: (mw: number) => void;
  onConfigureBattery?: (config: Partial<BatteryConfig>) => void;
}

export default function TradingCockpit({ state, onCharge, onDischarge, onConfigureBattery }: Props) {
  return (
    <section className="trading-cockpit">
      <div className="cockpit-price">
        <PriceChart priceHistory={state.priceHistory} currentPrice={state.currentPrice} />
        <CockpitContextCharts state={state} />
      </div>
      <div className="cockpit-battery">
        <BatteryStatus battery={state.battery} onConfigure={onConfigureBattery} />
      </div>
      <div className="cockpit-controls">
        <ChargeDischargeControls
          battery={state.battery}
          currentPrice={state.currentPrice?.price ?? 0}
          onCharge={onCharge}
          onDischarge={onDischarge}
        />
      </div>
      <div className="cockpit-revenue">
        <RevenueTracker battery={state.battery} analysis={state.analysis} />
      </div>
    </section>
  );
}
