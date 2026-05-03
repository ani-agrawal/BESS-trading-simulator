import type { AnalysisSummary } from '../engine/ukMarket';
import type { DayAheadState } from '../engine/types';
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import HelpIcon from './HelpIcon';
import TermTooltip from './TermTooltip';
import { Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  dayAhead: DayAheadState;
  analysis: AnalysisSummary | null;
}

const verdictColors: Record<string, string> = {
  good: '#22c55e', ok: '#eab308', bad: '#ef4444', missed: '#f97316', neutral: '#6b7280',
};
const verdictLabels: Record<string, string> = {
  good: 'GOOD TRADE', ok: 'COULD IMPROVE', bad: 'BAD TRADE', missed: 'MISSED', neutral: 'IDLE OK',
};

export default function PostTradeAnalysis({ dayAhead, analysis }: Props) {
  const { forecastPrices, sipOutturn, revealedPeriods } = dayAhead;

  const chartData = forecastPrices.map((da, i) => ({
    sp: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    da,
    sip: i < revealedPeriods ? sipOutturn[i] : null,
  }));

  if (!analysis) {
    return (
      <div className="panel analysis-panel" id="analysis-tab">
        <div className="panel-header">
          <h3>Post-Trade Analysis <TermTooltip term="SIP" /> <TermTooltip term="NIV" /></h3>
          <HelpIcon text="Compares your trades against the SIP outturn. Start trading and let settlement periods reveal." />
        </div>
        <div className="analysis-chart">
          <h4>DA Forecast vs SIP Outturn</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="sp" stroke="#888" fontSize={10} interval={3} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip formatter={(value: unknown, name: unknown) => {
                if (value == null) return ['—', String(name)];
                return [`£${Number(value).toFixed(2)}`, name === 'da' ? 'DA Forecast' : 'SIP Outturn'];
              }} />
              <Bar dataKey="da" fill="#3b82f6" fillOpacity={0.3} name="DA Forecast" />
              <Line type="monotone" dataKey="sip" stroke="#ef4444" strokeWidth={2} dot={false} name="SIP Outturn" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="empty-state">
          <p>Analysis appears as settlement periods reveal and you make trades.</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Trade on Spot, Day-Ahead, or Intraday — then watch this tab for performance review.</p>
        </div>
      </div>
    );
  }

  const { score, grade, overallVerdict, totalPlayerRevenue, totalOptimalRevenue, totalMissedRevenue, bestTrade, worstTrade, strategyAdvice, periods } = analysis;
  const interestingPeriods = periods.filter(p => p.playerAction !== 'idle' || p.verdict === 'missed');
  const totalRevealed = periods.length;

  return (
    <div className="panel analysis-panel" id="analysis-tab">
      <div className="panel-header">
          <h3>Post-Trade Analysis <TermTooltip term="SIP" /> <TermTooltip term="NIV" /></h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {totalRevealed}/48 SPs revealed
        </span>
        <HelpIcon text="Compares your trades against the SIP outturn as it reveals. Only shows settlement periods where the actual price is known. Score updates live." />
      </div>

      {/* Score */}
      <div className="analysis-score-banner">
        <div className="score-grade" style={{ borderColor: score >= 50 ? '#22c55e' : score > 0 ? '#eab308' : '#6b7280' }}>
          <span className="grade-letter">{grade}</span>
          <span className="grade-pct">{score}%</span>
        </div>
        <div className="score-details">
          <div className="score-verdict">{overallVerdict}</div>
          <div className="score-numbers">
            <span className={totalPlayerRevenue >= 0 ? 'positive' : 'negative'}>
              You: {totalPlayerRevenue >= 0 ? '+' : ''}£{totalPlayerRevenue.toFixed(2)}
            </span>
            <span style={{ color: '#9ca3af' }}>Optimal: £{totalOptimalRevenue.toFixed(2)}</span>
            <span style={{ color: '#f97316' }}>Missed: £{totalMissedRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="analysis-chart">
        <h4>DA Forecast vs SIP Outturn <TermTooltip term="Forecast vs Outturn" /> <HelpIcon text="Blue = forecast. Red = actual. The gap is where money was made or lost." /></h4>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="sp" stroke="#888" fontSize={10} interval={3} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip formatter={(value: unknown, name: unknown) => {
              if (value == null) return ['—', String(name)];
              return [`£${Number(value).toFixed(2)}`, name === 'da' ? 'DA Forecast' : 'SIP Outturn'];
            }} />
            <Bar dataKey="da" fill="#3b82f6" fillOpacity={0.3} name="DA Forecast" />
            <Line type="monotone" dataKey="sip" stroke="#ef4444" strokeWidth={2} dot={false} name="SIP Outturn" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Best/Worst */}
      <div className="analysis-highlights">
        {bestTrade && bestTrade.playerAction !== 'idle' && (
          <div className="highlight-card good">
            <h4><CheckCircle size={14} /> Best Trade</h4>
            <div className="highlight-sp">{bestTrade.spLabel} — {bestTrade.playerAction.toUpperCase()} {bestTrade.playerMw}MW @ £{bestTrade.playerPrice.toFixed(2)}</div>
            <div className="highlight-rev positive">+£{bestTrade.playerRevenue.toFixed(2)}</div>
            <p>{bestTrade.explanation}</p>
          </div>
        )}
        {worstTrade && worstTrade.playerAction !== 'idle' && worstTrade !== bestTrade && (
          <div className="highlight-card bad">
            <h4><AlertTriangle size={14} /> Worst Trade</h4>
            <div className="highlight-sp">{worstTrade.spLabel} — {worstTrade.playerAction.toUpperCase()} {worstTrade.playerMw}MW @ £{worstTrade.playerPrice.toFixed(2)}</div>
            <div className="highlight-rev negative">£{worstTrade.playerRevenue.toFixed(2)}</div>
            <p>{worstTrade.explanation}</p>
          </div>
        )}
      </div>

      {/* Advice */}
      {strategyAdvice.length > 0 && (
        <div className="analysis-advice">
          <h4><Award size={14} /> Strategy Advice</h4>
          <ul>{strategyAdvice.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}

      {/* Period breakdown */}
      <div className="analysis-details">
        <h4>Period-by-Period ({interestingPeriods.length} significant)</h4>
        <div className="analysis-list">
          {interestingPeriods.map((p, i) => (
            <div key={i} className={`analysis-item verdict-${p.verdict}`} style={{ borderLeftColor: verdictColors[p.verdict] }}>
              <div className="analysis-item-header">
                <span className="analysis-sp">{p.spLabel}</span>
                <span style={{ color: verdictColors[p.verdict], fontSize: '10px', fontWeight: 700 }}>{verdictLabels[p.verdict]}</span>
              </div>
              <div className="analysis-item-prices">
                <span>DA: £{p.daPrice.toFixed(2)}</span>
                <span>→</span>
                <span>SIP: £{p.sipPrice.toFixed(2)}</span>
                {p.nivValue !== 0 && <span style={{ color: '#9ca3af' }}>NIV: {p.nivValue > 0 ? '+' : ''}{p.nivValue}</span>}
              </div>
              {p.playerAction !== 'idle' && (
                <div className="analysis-item-trade">
                  <span className={p.playerAction === 'charge' ? 'buy-text' : 'sell-text'}>
                    {p.playerAction.toUpperCase()} {p.playerMw}MW @ £{p.playerPrice.toFixed(2)} ({p.playerMarket})
                  </span>
                  <span className={p.playerRevenue >= 0 ? 'positive' : 'negative'}>
                    {p.playerRevenue >= 0 ? '+' : ''}£{p.playerRevenue.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="analysis-item-optimal">
                <strong>Optimal:</strong> {p.optimalAction.toUpperCase()} — {p.optimalReason}
              </div>
              <p className="analysis-explanation">{p.explanation}</p>
              {p.missedRevenue > 1 && (
                <div className="analysis-missed">Missed: £{p.missedRevenue.toFixed(2)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
