import type { GameState } from '../engine/types';
import { buildPositionBook } from '../engine/positionBook';
import { getSettlementPeriod } from '../engine/clock';
import { BookOpen, Sigma } from 'lucide-react';

function fmtMwh(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
}

function fmtCash(value: number): string {
  return `${value >= 0 ? '+' : ''}£${value.toFixed(2)}`;
}

export default function PositionBook({ state }: { state: GameState }) {
  const book = buildPositionBook(state);
  const currentPeriod = getSettlementPeriod(state.clock.currentTime) - 1;
  const visibleRows = book.rows.filter(row => {
    const hasPosition = row.status !== 'open';
    const nearNow = row.period >= currentPeriod - 4 && row.period <= currentPeriod + 8;
    const nearSettledEdge = row.period >= state.dayAhead.revealedPeriods - 2 && row.period <= state.dayAhead.revealedPeriods + 6;
    return hasPosition || nearNow || nearSettledEdge;
  }).slice(0, 28);

  return (
    <div className="panel position-book-panel">
      <div className="panel-header">
        <h3><BookOpen size={15} /> Position Book</h3>
      </div>
      <div className="position-book-summary">
        <div><span>Contracted</span><strong>{fmtMwh(book.totalContractedMwh)} MWh</strong></div>
        <div><span>Physical</span><strong>{fmtMwh(book.totalPhysicalMwh)} MWh</strong></div>
        <div><span>Imbalance</span><strong>{fmtMwh(book.totalImbalanceMwh)} MWh</strong></div>
        <div><span>Total Cashflow</span><strong className={book.totalCashflow >= 0 ? 'positive' : 'negative'}>{fmtCash(book.totalCashflow)}</strong></div>
      </div>
      <div className="cashflow-split">
        <div><span>DA</span><strong className={book.totalDaCashflow >= 0 ? 'positive' : 'negative'}>{fmtCash(book.totalDaCashflow)}</strong></div>
        <div><span>ID</span><strong className={book.totalIdCashflow >= 0 ? 'positive' : 'negative'}>{fmtCash(book.totalIdCashflow)}</strong></div>
        <div><span>Imbalance</span><strong className={book.totalImbalanceCashflow >= 0 ? 'positive' : 'negative'}>{fmtCash(book.totalImbalanceCashflow)}</strong></div>
      </div>
      <div className="position-book-note">
        <Sigma size={14} />
        Simple version: you make promises in DA/ID, then the battery physically delivers. Any difference is imbalance and settles at SIP.
      </div>
      <div className="position-book-explainer">
        <div><strong>Contracted</strong><span>What you promised financially.</span></div>
        <div><strong>Physical</strong><span>What the battery actually did.</span></div>
        <div><strong>Imbalance</strong><span>Physical minus contracted.</span></div>
        <div><strong>SIP</strong><span>The price used to settle imbalance.</span></div>
      </div>
      <div className="position-book-scroll">
        <table className="data-table position-book-table">
          <thead>
            <tr>
              <th>SP</th>
              <th>DA</th>
              <th>ID</th>
              <th>Contracted</th>
              <th>Physical</th>
              <th>Imbalance</th>
              <th>SIP</th>
              <th>Cashflow</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.period} className={`position-row ${row.status}`}>
                <td>{row.timeLabel}</td>
                <td>{fmtMwh(row.daMwh)}</td>
                <td>{fmtMwh(row.idMwh)}</td>
                <td>{fmtMwh(row.contractedMwh)}</td>
                <td>{fmtMwh(row.physicalMwh)}</td>
                <td className={Math.abs(row.imbalanceMwh) > 0.1 ? 'warning-text' : ''}>{fmtMwh(row.imbalanceMwh)}</td>
                <td>{row.sipPrice === null ? '-' : `£${row.sipPrice.toFixed(2)}`}</td>
                <td className={row.totalCashflow >= 0 ? 'positive' : 'negative'}>{fmtCash(row.totalCashflow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
