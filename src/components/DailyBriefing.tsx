import { ClipboardList } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getDailyBriefing } from '../engine/dailyBriefing';

interface Props {
  state: GameState;
}

export default function DailyBriefing({ state }: Props) {
  const briefing = getDailyBriefing(state);
  return (
    <div className={`panel daily-briefing risk-${briefing.risk}`}>
      <div className="panel-header">
        <h3><ClipboardList size={15} /> Daily Briefing</h3>
        <span>{briefing.risk.toUpperCase()} RISK</span>
      </div>
      <div className="briefing-headline">{briefing.headline}</div>
      <ul className="briefing-watch">
        {briefing.watch.map(item => <li key={item}>{item}</li>)}
      </ul>
      <div className="briefing-action">{briefing.firstAction}</div>
    </div>
  );
}
