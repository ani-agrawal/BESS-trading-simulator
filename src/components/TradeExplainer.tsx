import { Lightbulb } from 'lucide-react';
import type { BatteryState } from '../engine/battery';
import type { HourlyPrice } from '../engine/types';

interface Props {
  battery: BatteryState;
  currentPrice: HourlyPrice | null;
  priceHistory: HourlyPrice[];
}

function priceContext(price: number, history: number[]): string {
  if (history.length < 6) return 'There is not much recent price history yet, so treat this as early practice.';
  const sorted = [...history].sort((a, b) => a - b);
  const rank = sorted.findIndex(value => value >= price);
  const pct = Math.round((rank / Math.max(1, sorted.length - 1)) * 100);
  if (pct <= 25) return 'The trade was near the recent low-price range, which is usually better for charging.';
  if (pct >= 75) return 'The trade was near the recent high-price range, which is usually better for discharging.';
  return 'The trade was in the middle of the recent price range, so the edge depends on your next planned action.';
}

export default function TradeExplainer({ battery, currentPrice, priceHistory }: Props) {
  const trade = battery.cycleLog[0];

  if (!trade) {
    return (
      <div className="panel trade-explainer">
        <div className="panel-header"><h3><Lightbulb size={15} /> Trade Explainer</h3></div>
        <p>After you charge or discharge, this panel explains the decision in MW, MWh, SoC, and price-context terms.</p>
        {currentPrice && <p>Current reference price: £{currentPrice.price.toFixed(2)}/MWh.</p>}
      </div>
    );
  }

  const gridMwh = trade.mw * 0.5;
  const storedText = trade.action === 'charge'
    ? `The battery stored ${trade.energyMwh.toFixed(1)} MWh after efficiency losses.`
    : `The battery delivered ${trade.energyMwh.toFixed(1)} MWh from stored energy.`;
  const cashText = trade.action === 'charge'
    ? `Cash impact: -£${Math.abs(trade.cost).toFixed(0)} because charging buys power.`
    : `Cash impact: +£${trade.cost.toFixed(0)} because discharging sells power.`;
  const recentPrices = priceHistory.slice(-24).map(point => point.price);

  return (
    <div className={`panel trade-explainer ${trade.action}`}>
      <div className="panel-header"><h3><Lightbulb size={15} /> Last Trade Explained</h3></div>
      <div className="trade-explain-grid">
        <div>
          <span>Action</span>
          <strong>{trade.action === 'charge' ? 'Charged' : 'Discharged'} {trade.mw.toFixed(0)} MW</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{trade.mw.toFixed(0)} MW x 0.5h = {gridMwh.toFixed(1)} MWh</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>£{trade.price.toFixed(2)}/MWh</strong>
        </div>
        <div>
          <span>SoC now</span>
          <strong>{battery.socPct.toFixed(1)}%</strong>
        </div>
      </div>
      <p>{storedText} {cashText}</p>
      <p>{priceContext(trade.price, recentPrices)}</p>
    </div>
  );
}
