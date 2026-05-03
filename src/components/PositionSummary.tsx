import type { Position, Trade } from '../engine/types';
import { OrderSide } from '../engine/types';

interface Props {
  positions: Position[];
  trades: Trade[];
}

export default function PositionSummary({ positions, trades }: Props) {
  const recentTrades = trades.slice(-10).reverse();

  return (
    <div className="panel position-summary">
      <div className="panel-header">
        <h3>Positions & Trades</h3>
      </div>

      {positions.length === 0 && recentTrades.length === 0 ? (
        <div className="empty-state">
          No positions yet. Place your first trade!
        </div>
      ) : (
        <>
          {positions.length > 0 && (
            <div className="positions-section">
              <h4>Open Positions</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Volume</th>
                    <th>Avg Entry</th>
                    <th>Current</th>
                    <th>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, i) => (
                    <tr key={i}>
                      <td>{p.hourLabel}</td>
                      <td className={p.volumeMw > 0 ? 'positive' : 'negative'}>
                        {p.volumeMw > 0 ? '+' : ''}{p.volumeMw} MW
                      </td>
                      <td>€{p.avgEntryPrice.toFixed(2)}</td>
                      <td>€{p.currentPrice.toFixed(2)}</td>
                      <td className={p.unrealizedPnl >= 0 ? 'positive' : 'negative'}>
                        €{p.unrealizedPnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentTrades.length > 0 && (
            <div className="trades-section">
              <h4>Recent Trades</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Side</th>
                    <th>Volume</th>
                    <th>Price</th>
                    <th>Market</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((t, i) => (
                    <tr key={i}>
                      <td className={t.side === OrderSide.BUY ? 'buy-text' : 'sell-text'}>
                        {t.side.toUpperCase()}
                      </td>
                      <td>{t.volumeMw} MW</td>
                      <td>€{t.price.toFixed(2)}</td>
                      <td>{t.marketType === 'spot' ? 'Spot' : 'DA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
