import { BarChart3 } from 'lucide-react';
import { getBacktestSummary } from '../engine/backtestSummary';

export default function BacktestSummary() {
  const rows = getBacktestSummary();
  return (
    <div className="panel backtest-summary">
      <div className="panel-header">
        <h3><BarChart3 size={15} /> Scenario Backtest</h3>
      </div>
      <div className="backtest-table-wrap">
        <table className="backtest-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Best use</th>
              <th>Spread</th>
              <th>Naive</th>
              <th>Hindsight</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.scenario}>
                <td>
                  <strong>{row.scenario}</strong>
                  <span>{row.difficulty}</span>
                </td>
                <td>{row.bestUse}</td>
                <td>£{row.spread.toFixed(0)}</td>
                <td className={row.naivePnl >= 0 ? 'positive' : 'negative'}>{row.naivePnl >= 0 ? '+' : '-'}£{Math.abs(row.naivePnl).toFixed(0)}</td>
                <td className={row.hindsightPnl >= 0 ? 'positive' : 'negative'}>{row.hindsightPnl >= 0 ? '+' : '-'}£{Math.abs(row.hindsightPnl).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="backtest-note">This is a simple benchmark across bundled scenarios, useful for pattern recognition rather than production valuation.</p>
    </div>
  );
}
