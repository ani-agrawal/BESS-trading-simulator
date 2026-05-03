import { FileText } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getEndOfDayReport } from '../engine/endOfDayReport';

interface Props {
  state: GameState;
}

export default function EndOfDayReport({ state }: Props) {
  const report = getEndOfDayReport(state);
  return (
    <div className="panel eod-report">
      <div className="panel-header">
        <h3><FileText size={15} /> End-of-Day Report</h3>
      </div>
      <div className="eod-headline">{report.headline}</div>
      <div className="eod-grid">
        <div><span>P&L</span><p>{report.pnl}</p></div>
        <div><span>Utilisation</span><p>{report.utilisation}</p></div>
        <div><span>Best decision</span><p>{report.bestDecision}</p></div>
        <div><span>Worst decision</span><p>{report.worstDecision}</p></div>
      </div>
      <div className="eod-focus">{report.tomorrowFocus}</div>
      <ul className="eod-notes">
        {report.deskNotes.map(note => <li key={note}>{note}</li>)}
      </ul>
    </div>
  );
}
