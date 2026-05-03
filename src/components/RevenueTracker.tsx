import type { BatteryState } from '../engine/battery';
import { getRevenueSummary } from '../engine/battery';
import type { AnalysisSummary } from '../engine/ukMarket';
import HelpIcon from './HelpIcon';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  battery: BatteryState;
  analysis?: AnalysisSummary | null;
}

export default function RevenueTracker({ battery, analysis }: Props) {
  const s = getRevenueSummary(battery);
  const hasAnalysis = analysis && analysis.periods.length > 0;
  const dayRevenue = hasAnalysis ? analysis.totalPlayerRevenue : null;

  return (
    <div className="panel revenue-tracker" id="revenue">
      <div className="panel-header">
        <h3>Revenue</h3>
        <HelpIcon text="Today's P&L matches the Analysis tab. Session Total tracks all trades across the entire session including previous days." />
      </div>

      {/* Today's P&L — matches Analysis */}
      {dayRevenue !== null && (
        <div className="revenue-hero">
          <div className="revenue-hero-label">Today's P&L</div>
          <div className={`revenue-hero-value ${dayRevenue >= 0 ? 'positive' : 'negative'}`}>
            {dayRevenue >= 0 ? '+' : ''}£{dayRevenue.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {hasAnalysis && (
            <div className="revenue-hero-sub">
              Grade: {analysis.grade} ({analysis.score}% of optimal)
            </div>
          )}
        </div>
      )}

      {/* Session totals */}
      <div className={dayRevenue !== null ? 'revenue-session' : 'revenue-hero'}>
        <div className="revenue-hero-label">{dayRevenue !== null ? 'Session Total' : 'Net Profit'}</div>
        <div className={`revenue-hero-value ${dayRevenue !== null ? 'small' : ''} ${s.netProfit >= 0 ? 'positive' : 'negative'}`}>
          {s.netProfit >= 0 ? '+' : ''}£{s.netProfit.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="revenue-grid">
        <div className="revenue-card">
          <div className="revenue-label"><TrendingDown size={12} /> Charge Cost</div>
          <div className="revenue-value negative">-£{s.totalCost.toFixed(2)}</div>
          <div className="revenue-sub">Avg: £{s.avgChargePrice.toFixed(2)}/MWh</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-label"><TrendingUp size={12} /> Discharge Revenue</div>
          <div className="revenue-value positive">+£{s.totalRevenue.toFixed(2)}</div>
          <div className="revenue-sub">Avg: £{s.avgDischargePrice.toFixed(2)}/MWh</div>
        </div>
      </div>

      {s.totalCycles > 0 && (
        <div className="revenue-stats">
          <div className="revenue-stat">
            <span>Cycles: {s.totalCycles}</span>
          </div>
          <div className="revenue-stat">
            <span>£/cycle: {s.revenuePerCycle >= 0 ? '+' : ''}£{s.revenuePerCycle.toFixed(2)}</span>
          </div>
          <div className="revenue-stat">
            <span>Spread: £{(s.avgDischargePrice - s.avgChargePrice).toFixed(2)}/MWh</span>
          </div>
        </div>
      )}

      {s.totalCycles === 0 && !hasAnalysis && (
        <div className="empty-state">
          Charge low, discharge high. Your profit appears here.
        </div>
      )}
    </div>
  );
}
