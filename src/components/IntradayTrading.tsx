import { useState } from 'react';
import type { DayAheadState } from '../engine/types';
import type { BatteryState } from '../engine/battery';
import { getMaxChargeableMw, getMaxDischargeableMw } from '../engine/battery';
import HelpIcon from './HelpIcon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowDown, ArrowUp, Clock } from 'lucide-react';
import { getIntradayPrice } from '../engine/intradayPricing';
import TermTooltip from './TermTooltip';

interface Props {
  dayAhead: DayAheadState;
  battery: BatteryState;
  currentPrice: number;
  currentHour: number;
  onIntradayCharge: (sp: number, mw: number) => void;
  onIntradayDischarge: (sp: number, mw: number) => void;
}

export default function IntradayTrading({
  dayAhead, battery, currentPrice,
  onIntradayCharge, onIntradayDischarge,
}: Props) {
  const [selectedSp, setSelectedSp] = useState<number | null>(null);
  const [mw, setMw] = useState(String(battery.config.powerRatingMw));

  const { forecastPrices, sipOutturn, revealedPeriods } = dayAhead;

  // Intraday prices are tradable only for live/future periods. Settled periods show SIP instead.
  const idPrices = forecastPrices.map((_, sp) => {
    if (sp < revealedPeriods) return null;
    return getIntradayPrice({ forecastPrices, sipOutturn, revealedPeriods, currentPrice, period: sp });
  });

  const chartData = forecastPrices.map((da, sp) => ({
    sp: `${String(Math.floor(sp / 2)).padStart(2, '0')}:${sp % 2 === 0 ? '00' : '30'}`,
    da,
    id: idPrices[sp],
    sip: sp < revealedPeriods ? sipOutturn[sp] : null,
    isFuture: sp >= revealedPeriods,
    isSelected: sp === selectedSp,
  }));

  const maxCharge = getMaxChargeableMw(battery);
  const maxDischarge = getMaxDischargeableMw(battery);
  const vol = Math.min(Number(mw) || 0, battery.config.powerRatingMw);

  const handleCharge = () => {
    if (selectedSp === null || vol <= 0) return;
    onIntradayCharge(selectedSp, Math.min(vol, maxCharge));
    setSelectedSp(null);
  };

  const handleDischarge = () => {
    if (selectedSp === null || vol <= 0) return;
    onIntradayDischarge(selectedSp, Math.min(vol, maxDischarge));
    setSelectedSp(null);
  };

  return (
    <div className="panel intraday-panel">
      <div className="panel-header">
        <h3><Clock size={16} /> Intraday Continuous Market <TermTooltip term="Gate Closure" label="ID" /></h3>
        <HelpIcon text="Trade individual settlement periods as new information arrives. ID prices update based on latest market conditions. You can revise your DA positions or take new positions. Trades execute at the current ID price for the selected SP." />
      </div>

      <div className="id-chart">
        <h4>
          DA Forecast vs Intraday Prices <TermTooltip term="Forecast vs Outturn" />
          <HelpIcon text="Blue = DA forecast (locked). Green dashed = live intraday price (tradeable). Red = SIP outturn (settled). Click a future SP to trade it." />
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="sp" stroke="#888" fontSize={9} interval={5} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', color: '#e5e7eb' }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#e5e7eb' }}
              formatter={(value: unknown, name: unknown) => {
                if (value === null || value === undefined) return ['—', String(name)];
                const labels: Record<string, string> = { da: 'DA Forecast', id: 'ID Price', sip: 'SIP Outturn' };
                return [`£${Number(value).toFixed(2)}`, labels[String(name)] ?? String(name)];
              }}
            />
            <ReferenceLine x={chartData[revealedPeriods]?.sp} stroke="#666" strokeDasharray="3 3" label={{ value: 'Now', fill: '#888', fontSize: 10 }} />
            <Line type="monotone" dataKey="da" stroke="#3b82f6" strokeWidth={1} strokeOpacity={0.5} dot={false} name="DA Forecast" />
            <Line type="monotone" dataKey="id" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 2" dot={false} name="ID Price" />
            <Line type="monotone" dataKey="sip" stroke="#ef4444" strokeWidth={2} dot={false} name="SIP Outturn" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="id-trade-section">
        <h4>Select Settlement Period to Trade</h4>
        <div className="id-sp-grid">
          {forecastPrices.slice(revealedPeriods, Math.min(revealedPeriods + 12, 48)).map((_, idx) => {
            const sp = revealedPeriods + idx;
            const hour = Math.floor(sp / 2);
            const min = sp % 2 === 0 ? '00' : '30';
            const idPrice = idPrices[sp] ?? currentPrice;
            const isLow = idPrice < 35;
            const isHigh = idPrice > 65;
            return (
              <button
                key={sp}
                className={`id-sp-btn ${selectedSp === sp ? 'selected' : ''} ${isLow ? 'low' : ''} ${isHigh ? 'high' : ''}`}
                onClick={() => setSelectedSp(sp === selectedSp ? null : sp)}
              >
                <span className="id-sp-time">{String(hour).padStart(2, '0')}:{min}</span>
                <span className="id-sp-price">£{idPrice.toFixed(1)}</span>
              </button>
            );
          })}
        </div>

        {selectedSp !== null && (
          <div className="id-trade-form">
            <div className="id-trade-info">
              SP{selectedSp + 1} — ID Price: <strong>£{(idPrices[selectedSp] ?? currentPrice).toFixed(2)}/MWh</strong>
              <span className="id-da-compare">
                (DA was £{forecastPrices[selectedSp].toFixed(2)},
                {(idPrices[selectedSp] ?? currentPrice) > forecastPrices[selectedSp]
                  ? ` up £${((idPrices[selectedSp] ?? currentPrice) - forecastPrices[selectedSp]).toFixed(2)}`
                  : ` down £${(forecastPrices[selectedSp] - (idPrices[selectedSp] ?? currentPrice)).toFixed(2)}`
                })
              </span>
            </div>

            <div className="id-mw-row">
              <label>Volume:</label>
              <input
                type="number"
                className="input input-sm"
                value={mw}
                onChange={e => setMw(e.target.value)}
                min={1}
                max={battery.config.powerRatingMw}
              />
              <span className="id-mw-unit">MW</span>
            </div>

            <div className="id-action-buttons">
              <button
                className="btn btn-action btn-charge"
                onClick={handleCharge}
                disabled={maxCharge < 0.1}
              >
                <ArrowDown size={14} /> Charge {vol} MW @ £{(idPrices[selectedSp] ?? currentPrice).toFixed(2)}
              </button>
              <button
                className="btn btn-action btn-discharge"
                onClick={handleDischarge}
                disabled={maxDischarge < 0.1}
              >
                <ArrowUp size={14} /> Discharge {vol} MW @ £{(idPrices[selectedSp] ?? currentPrice).toFixed(2)}
              </button>
            </div>
          </div>
        )}

        {selectedSp === null && (
          <div className="empty-state" style={{ padding: 12 }}>
            Select a future settlement period above to place an intraday trade.
          </div>
        )}
      </div>
    </div>
  );
}
