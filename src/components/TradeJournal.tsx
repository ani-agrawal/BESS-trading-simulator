import { NotebookPen } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getTradeJournal } from '../engine/tradeJournal';

interface Props {
  state: GameState;
}

export default function TradeJournal({ state }: Props) {
  const entries = getTradeJournal(state);
  return (
    <div className="panel trade-journal">
      <div className="panel-header">
        <h3><NotebookPen size={15} /> Trade Journal</h3>
      </div>
      <div className="journal-list">
        {entries.map(entry => (
          <div key={entry.id} className={`journal-entry ${entry.tone}`}>
            <strong>{entry.title}</strong>
            <span>{entry.detail}</span>
            <p>{entry.lesson}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
