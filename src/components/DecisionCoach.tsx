import { Brain, BatteryCharging, PauseCircle, TrendingUp } from 'lucide-react';
import type { GameState } from '../engine/types';
import { getDecisionCoach } from '../engine/decisionCoach';

interface Props {
  state: GameState;
}

function ActionIcon({ action }: { action: 'charge' | 'discharge' | 'wait' }) {
  if (action === 'charge') return <BatteryCharging size={16} />;
  if (action === 'discharge') return <TrendingUp size={16} />;
  return <PauseCircle size={16} />;
}

export default function DecisionCoach({ state }: Props) {
  const coach = getDecisionCoach(state);
  return (
    <div className={`panel decision-coach action-${coach.action}`}>
      <div className="panel-header">
        <h3><Brain size={15} /> Decision Coach</h3>
        <span>{coach.confidence.toUpperCase()}</span>
      </div>
      <div className="decision-headline">
        <ActionIcon action={coach.action} />
        <strong>{coach.headline}</strong>
      </div>
      <div className="decision-suggested">
        <span>Suggested action</span>
        <strong>{coach.action.toUpperCase()}{coach.suggestedMw > 0 ? ` ${coach.suggestedMw.toFixed(0)} MW` : ''}</strong>
      </div>
      <ul className="decision-why">
        {coach.why.map(item => <li key={item}>{item}</li>)}
      </ul>
      <div className="decision-cost">{coach.opportunityCost}</div>
    </div>
  );
}
