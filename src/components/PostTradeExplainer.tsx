import type { GameState } from '../engine/types';
import { buildReplay } from '../engine/replay';
import { Lightbulb } from 'lucide-react';

export default function PostTradeExplainer({ state }: { state: GameState }) {
  const replay = buildReplay(state);
  const bad = replay.find(step => step.verdict === 'bad');
  const missed = replay.find(step => step.verdict === 'missed');
  const good = replay.find(step => step.verdict === 'good');
  const selected = bad ?? missed ?? good ?? replay.find(step => step.action !== 'No action');

  if (!selected) {
    return (
      <div className="panel post-trade-explainer">
        <div className="panel-header"><h3><Lightbulb size={15} /> What Happened?</h3></div>
        <p>No meaningful trading event yet. Make a trade or step forward to reveal settlement.</p>
      </div>
    );
  }

  const headline = selected.verdict === 'bad'
    ? 'Main lesson: avoid using the battery against the price signal.'
    : selected.verdict === 'missed'
      ? 'Main lesson: you had a profitable opportunity but did not use the battery.'
      : selected.verdict === 'good'
        ? 'Main lesson: this decision matched the market move.'
        : 'Main lesson: connect your action to the outturn.';

  return (
    <div className={`panel post-trade-explainer verdict-${selected.verdict}`}>
      <div className="panel-header"><h3><Lightbulb size={15} /> What Happened?</h3></div>
      <h4>{headline}</h4>
      <div className="explainer-period">{selected.timeLabel}: {selected.action}</div>
      <p>{selected.explanation}</p>
    </div>
  );
}
