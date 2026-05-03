import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import type { HourlyPrice } from '../engine/types';
import HelpIcon from './HelpIcon';
import TermTooltip from './TermTooltip';

interface Props {
  priceHistory: HourlyPrice[];
  currentPrice: HourlyPrice | null;
}

function priceColor(price: number): string {
  if (price < 0) return '#3b82f6';
  if (price < 30) return '#22c55e';
  if (price < 70) return '#eab308';
  if (price < 100) return '#f97316';
  return '#ef4444';
}

export default function PriceChart({ priceHistory, currentPrice }: Props) {
  // Show last 96 points (48 hours / 2 days of half-hourly data)
  const visible = priceHistory.slice(-96);

  const firstDay = visible.length > 0 ? new Date(visible[0].timestamp).getUTCDate() : 0;
  const lastDay = visible.length > 0 ? new Date(visible[visible.length - 1].timestamp).getUTCDate() : 0;
  const multiDay = firstDay !== lastDay;

  const data = visible.map((p) => {
    const d = new Date(p.timestamp);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const label = multiDay
      ? `${d.getUTCDate()}/${d.getUTCMonth() + 1} ${hh}:${mm}`
      : `${hh}:${mm}`;
    return { time: label, price: p.price, renewable: Math.round(p.renewablePct * 100) };
  });

  const lastPrice = currentPrice?.price ?? 0;
  const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : lastPrice;
  const change = lastPrice - prevPrice;
  const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);

  // Calculate Y domain for reference areas
  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 100);

  return (
    <div className="panel price-chart-panel" id="price-chart">
      <div className="panel-header">
        <h3>Electricity Price <TermTooltip term="Spread" /></h3>
        <HelpIcon text="The spot electricity price by settlement period. Use fixed zones as rough context, but make decisions from relative moves, recent volatility, SoC, and the Market Signal panel." />
        <div className="price-display">
          <span className="current-price" style={{ color: priceColor(lastPrice) }}>
            £{lastPrice.toFixed(2)}
          </span>
          <span className="price-unit">/MWh</span>
          <span className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {changeStr}
          </span>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="time"
              stroke="#888"
              fontSize={11}
              interval={Math.max(0, Math.floor(data.length / 12) - 1)}
            />
            <YAxis stroke="#888" fontSize={11} domain={[Math.floor(minPrice - 5), Math.ceil(maxPrice + 5)]} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#ccc' }}
              formatter={(value: unknown) => [`£${Number(value).toFixed(2)}/MWh`, 'Price']}
            />
            {/* Charge zone */}
            <ReferenceArea y1={Math.floor(minPrice - 5)} y2={30} fill="#22c55e" fillOpacity={0.06} />
            {/* Discharge zone */}
            <ReferenceArea y1={70} y2={Math.ceil(maxPrice + 5)} fill="#ef4444" fillOpacity={0.06} />
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Charge zone', fill: '#22c55e', fontSize: 10, position: 'left' }} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Discharge zone', fill: '#ef4444', fontSize: 10, position: 'left' }} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {currentPrice && (
        <div className="price-context">
          <span>Demand: {(currentPrice.demandMw / 1000).toFixed(1)} GW</span>
          <span>Renewables: {Math.round(currentPrice.renewablePct * 100)}%</span>
          <span>Base: £{currentPrice.basePrice.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
