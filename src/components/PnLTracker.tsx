import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

interface Props {
  cash: number;
  realized: number;
  unrealized: number;
  total: number;
  initialCash: number;
}

export default function PnLTracker({ cash, realized, unrealized, total, initialCash }: Props) {
  const returnPct = (total / initialCash) * 100;

  return (
    <div className="panel pnl-tracker">
      <div className="panel-header">
        <h3>Portfolio</h3>
      </div>
      <div className="pnl-grid">
        <div className="pnl-card">
          <div className="pnl-label">
            <Wallet size={14} /> Cash
          </div>
          <div className="pnl-value">€{cash.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="pnl-card">
          <div className="pnl-label">Unrealized P&L</div>
          <div className={`pnl-value ${unrealized >= 0 ? 'positive' : 'negative'}`}>
            {unrealized >= 0 ? '+' : ''}€{unrealized.toFixed(2)}
          </div>
        </div>
        <div className="pnl-card">
          <div className="pnl-label">
            <DollarSign size={14} /> Realized P&L
          </div>
          <div className={`pnl-value ${realized >= 0 ? 'positive' : 'negative'}`}>
            {realized >= 0 ? '+' : ''}€{realized.toFixed(2)}
          </div>
        </div>
        <div className="pnl-card">
          <div className="pnl-label">
            {total >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} Total P&L
          </div>
          <div className={`pnl-value large ${total >= 0 ? 'positive' : 'negative'}`}>
            {total >= 0 ? '+' : ''}€{total.toFixed(2)}
            <span className="pnl-pct">({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
